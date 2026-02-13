import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Driver, Session, int } from 'neo4j-driver';
import { CreateInjuryDto, UpdateInjuryDto, InjuryDetailDto, QueryInjuriesDto, PaginatedInjuriesDto, ResolveInjuryDto } from './dto/injury.dto';

@Injectable()
export class InjuriesService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
  ) {}

  async createInjury(createInjuryDto: CreateInjuryDto, reportedBy: string): Promise<InjuryDetailDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // First verify the player exists
      const playerCheck = await session.run(
        `MATCH (p:Player {pseudonymId: $playerId}) RETURN p`,
        { playerId: createInjuryDto.playerId }
      );

      if (playerCheck.records.length === 0) {
        throw new NotFoundException(`Player ${createInjuryDto.playerId} not found`);
      }

      // Generate injury ID
      const injuryId = await this.generateInjuryId(session);

      // Create the injury node and relationship to player
      const query = `
        MATCH (p:Player {pseudonymId: $playerId})
        
        CREATE (i:Injury {
          injuryId: $injuryId,
          injuryType: $injuryType,
          bodyPart: $bodyPart,
          side: $side,
          severity: $severity,
          status: 'Active',
          injuryDate: datetime($injuryDate),
          expectedReturnDate: CASE WHEN $expectedReturnDate IS NOT NULL 
            THEN date($expectedReturnDate) ELSE NULL END,
          mechanism: $mechanism,
          diagnosis: $diagnosis,
          treatmentPlan: $treatmentPlan,
          notes: $notes,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        
        CREATE (p)-[:SUSTAINED {
          diagnosedDate: datetime(),
          reportedBy: $reportedBy
        }]->(i)
        
        RETURN i, p.playerId AS playerId, p.pseudonymId AS pseudonymId
      `;

      const result = await session.run(query, {
        playerId: createInjuryDto.playerId,
        injuryId,
        injuryType: createInjuryDto.injuryType,
        bodyPart: createInjuryDto.bodyPart,
        side: createInjuryDto.side || null,
        severity: createInjuryDto.severity,
        injuryDate: createInjuryDto.injuryDate,
        expectedReturnDate: createInjuryDto.expectedReturnDate || null,
        mechanism: createInjuryDto.mechanism || null,
        diagnosis: createInjuryDto.diagnosis || null,
        treatmentPlan: createInjuryDto.treatmentPlan || null,
        notes: createInjuryDto.notes || null,
        reportedBy,
      });

      const record = result.records[0];
      const injury = record.get('i').properties;

      return {
        injuryId: injury.injuryId,
        injuryType: injury.injuryType,
        bodyPart: injury.bodyPart,
        side: injury.side,
        severity: injury.severity,
        status: injury.status,
        injuryDate: injury.injuryDate.toString(),
        expectedReturnDate: injury.expectedReturnDate ? injury.expectedReturnDate.toString() : undefined,
        mechanism: injury.mechanism,
        diagnosis: injury.diagnosis,
        treatmentPlan: injury.treatmentPlan,
        notes: injury.notes,
        createdAt: injury.createdAt.toString(),
        updatedAt: injury.updatedAt.toString(),
        player: {
          playerId: record.get('playerId'),
          pseudonymId: record.get('pseudonymId'),
          diagnosedDate: new Date().toISOString(),
          reportedBy,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create injury: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  async findOne(injuryId: string): Promise<InjuryDetailDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (i:Injury {injuryId: $injuryId})
        OPTIONAL MATCH (p:Player)-[r:SUSTAINED]->(i)
        OPTIONAL MATCH (i)-[:HAS_STATUS_UPDATE]->(s:StatusUpdate)
        
        WITH i, p, r, s
        ORDER BY s.recordedAt DESC
        
        RETURN i,
               p.playerId AS playerId,
               p.pseudonymId AS pseudonymId,
               r.diagnosedDate AS diagnosedDate,
               r.reportedBy AS reportedBy,
               collect(DISTINCT {
                 updateId: s.updateId,
                 status: s.status,
                 notes: s.notes,
                 recordedBy: s.recordedBy,
                 recordedAt: s.recordedAt
               }) AS statusUpdates
      `;

      const result = await session.run(query, { injuryId });

      if (result.records.length === 0) {
        throw new NotFoundException(`Injury ${injuryId} not found`);
      }

      const record = result.records[0];
      const injury = record.get('i').properties;
      const statusUpdates = record.get('statusUpdates')
        .filter(update => update.updateId !== null);

      return {
        injuryId: injury.injuryId,
        injuryType: injury.injuryType,
        bodyPart: injury.bodyPart,
        side: injury.side,
        severity: injury.severity,
        status: injury.status,
        injuryDate: injury.injuryDate.toString(),
        expectedReturnDate: injury.expectedReturnDate ? injury.expectedReturnDate.toString() : undefined,
        mechanism: injury.mechanism,
        diagnosis: injury.diagnosis,
        treatmentPlan: injury.treatmentPlan,
        notes: injury.notes,
        createdAt: injury.createdAt.toString(),
        updatedAt: injury.updatedAt.toString(),
        player: record.get('playerId') ? {
          playerId: record.get('playerId'),
          pseudonymId: record.get('pseudonymId'),
          diagnosedDate: record.get('diagnosedDate')?.toString(),
          reportedBy: record.get('reportedBy'),
        } : undefined,
        statusUpdates: statusUpdates.map(update => ({
          updateId: update.updateId,
          status: update.status,
          notes: update.notes,
          recordedBy: update.recordedBy,
          recordedAt: update.recordedAt.toString(),
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch injury: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  async updateInjury(injuryId: string, updateInjuryDto: UpdateInjuryDto, updatedBy: string): Promise<InjuryDetailDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // Build dynamic SET clause based on provided fields
      const setFields: string[] = ['i.updatedAt = datetime()'];
      const params: any = { injuryId, updatedBy };

      if (updateInjuryDto.status !== undefined) {
        setFields.push('i.status = $status');
        params.status = updateInjuryDto.status;
      }
      if (updateInjuryDto.expectedReturnDate !== undefined) {
        setFields.push('i.expectedReturnDate = date($expectedReturnDate)');
        params.expectedReturnDate = updateInjuryDto.expectedReturnDate;
      }
      if (updateInjuryDto.treatmentPlan !== undefined) {
        setFields.push('i.treatmentPlan = $treatmentPlan');
        params.treatmentPlan = updateInjuryDto.treatmentPlan;
      }
      if (updateInjuryDto.notes !== undefined) {
        setFields.push('i.notes = $notes');
        params.notes = updateInjuryDto.notes;
      }
      if (updateInjuryDto.diagnosis !== undefined) {
        setFields.push('i.diagnosis = $diagnosis');
        params.diagnosis = updateInjuryDto.diagnosis;
      }

      // If status is being updated, create a status update node
      let statusUpdateClause = '';
      if (updateInjuryDto.status) {
        const updateId = `UPDATE-${Date.now()}`;
        params.updateId = updateId;
        params.statusNote = updateInjuryDto.statusNote || null;
        
        statusUpdateClause = `
          CREATE (s:StatusUpdate {
            updateId: $updateId,
            status: $status,
            notes: $statusNote,
            recordedBy: $updatedBy,
            recordedAt: datetime()
          })
          CREATE (i)-[:HAS_STATUS_UPDATE]->(s)
        `;
      }

      const query = `
        MATCH (i:Injury {injuryId: $injuryId})
        SET ${setFields.join(', ')}
        ${statusUpdateClause}
        RETURN i
      `;

      const result = await session.run(query, params);

      if (result.records.length === 0) {
        throw new NotFoundException(`Injury ${injuryId} not found`);
      }

      // Return the updated injury details
      return this.findOne(injuryId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update injury: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  private async generateInjuryId(session: Session): Promise<string> {
    // Get the current year
    const year = new Date().getFullYear();
    
    // Find the highest injury number for this year
    const result = await session.run(`
      MATCH (i:Injury)
      WHERE i.injuryId STARTS WITH 'INJ-${year}-'
      RETURN i.injuryId AS id
      ORDER BY id DESC
      LIMIT 1
    `);

    if (result.records.length === 0) {
      return `INJ-${year}-001`;
    }

    const lastId = result.records[0].get('id');
    const lastNumber = parseInt(lastId.split('-')[2], 10);
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');

    return `INJ-${year}-${nextNumber}`;
  }

  async findAll(queryDto: QueryInjuriesDto, userRole: string, userPseudonym: string): Promise<PaginatedInjuriesDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const page = Math.floor(queryDto.page || 1);
      const limit = Math.floor(queryDto.limit || 20);
      const skip = (page - 1) * limit;

      // Build WHERE clause based on filters and role-based access
      const whereClauses: string[] = [];
      const params: any = { skip: int(skip), limit: int(limit) };

      // Role-based filtering
      if (userRole === 'player') {
        // Players can only see their own injuries
        whereClauses.push('p.pseudonymId = $userPseudonym');
        params.userPseudonym = userPseudonym;
      } else if (userRole === 'coach') {
        // Coaches can see injuries for players on their teams
        // For MVP, coaches can see all injuries (will be refined with team relationships)
        whereClauses.push('1=1');
      } else if (userRole === 'admin') {
        // Admins can see all injuries
        whereClauses.push('1=1');
      }

      // Status filter
      if (queryDto.status) {
        whereClauses.push('i.status = $status');
        params.status = queryDto.status;
      }

      // Severity filter
      if (queryDto.severity) {
        whereClauses.push('i.severity = $severity');
        params.severity = queryDto.severity;
      }

      // Player ID filter (only for coaches and admins)
      if (queryDto.playerId && (userRole === 'coach' || userRole === 'admin')) {
        whereClauses.push('p.pseudonymId = $playerId');
        params.playerId = queryDto.playerId;
      }

      // Body part filter
      if (queryDto.bodyPart) {
        whereClauses.push('i.bodyPart = $bodyPart');
        params.bodyPart = queryDto.bodyPart;
      }

      // Date range filters
      if (queryDto.fromDate) {
        whereClauses.push('i.injuryDate >= datetime($fromDate)');
        params.fromDate = queryDto.fromDate;
      }

      if (queryDto.toDate) {
        whereClauses.push('i.injuryDate <= datetime($toDate)');
        params.toDate = queryDto.toDate;
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Determine sort field and order
      const sortBy = queryDto.sortBy || 'createdAt';
      const sortOrder = queryDto.sortOrder || 'DESC';
      const sortField = sortBy === 'injuryDate' ? 'i.injuryDate' : `i.${sortBy}`;

      // Count total matching records
      const countQuery = `
        MATCH (p:Player)-[:SUSTAINED]->(i:Injury)
        ${whereClause}
        RETURN count(i) AS total
      `;

      const countResult = await session.run(countQuery, params);
      const total = countResult.records[0].get('total').toNumber();

      // Fetch paginated results
      const dataQuery = `
        MATCH (p:Player)-[r:SUSTAINED]->(i:Injury)
        ${whereClause}
        WITH i, p, r
        ORDER BY ${sortField} ${sortOrder}
        SKIP $skip
        LIMIT $limit
        
        OPTIONAL MATCH (i)-[:HAS_STATUS_UPDATE]->(s:StatusUpdate)
        WITH i, p, r, s
        ORDER BY s.recordedAt DESC
        
        RETURN i,
               p.playerId AS playerId,
               p.pseudonymId AS pseudonymId,
               r.diagnosedDate AS diagnosedDate,
               r.reportedBy AS reportedBy,
               collect(DISTINCT {
                 updateId: s.updateId,
                 status: s.status,
                 notes: s.notes,
                 recordedBy: s.recordedBy,
                 recordedAt: s.recordedAt
               }) AS statusUpdates
      `;

      const dataResult = await session.run(dataQuery, params);

      const injuries = dataResult.records.map(record => {
        const injury = record.get('i').properties;
        const statusUpdates = record.get('statusUpdates')
          .filter(update => update.updateId !== null);

        return {
          injuryId: injury.injuryId,
          injuryType: injury.injuryType,
          bodyPart: injury.bodyPart,
          side: injury.side,
          severity: injury.severity,
          status: injury.status,
          injuryDate: injury.injuryDate.toString(),
          expectedReturnDate: injury.expectedReturnDate ? injury.expectedReturnDate.toString() : undefined,
          mechanism: injury.mechanism,
          diagnosis: injury.diagnosis,
          treatmentPlan: injury.treatmentPlan,
          notes: injury.notes,
          createdAt: injury.createdAt.toString(),
          updatedAt: injury.updatedAt.toString(),
          player: {
            playerId: record.get('playerId'),
            pseudonymId: record.get('pseudonymId'),
            diagnosedDate: record.get('diagnosedDate')?.toString(),
            reportedBy: record.get('reportedBy'),
          },
          statusUpdates: statusUpdates.map(update => ({
            updateId: update.updateId,
            status: update.status,
            notes: update.notes,
            recordedBy: update.recordedBy,
            recordedAt: update.recordedAt.toString(),
          })),
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: injuries,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      console.error('❌ Error in findAll service:', error.message);
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch injuries: ${error.message}`);
    } finally {
      await session.close();
    }
  }

  async resolveInjury(injuryId: string, resolveDto: ResolveInjuryDto, resolvedBy: string): Promise<InjuryDetailDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // First check if the injury exists and is not already resolved
      const checkQuery = `
        MATCH (i:Injury {injuryId: $injuryId})
        RETURN i.status AS status
      `;

      const checkResult = await session.run(checkQuery, { injuryId });

      if (checkResult.records.length === 0) {
        throw new NotFoundException(`Injury ${injuryId} not found`);
      }

      const currentStatus = checkResult.records[0].get('status');
      if (currentStatus === 'Recovered') {
        throw new BadRequestException(`Injury ${injuryId} is already resolved`);
      }

      // Generate update ID for the status update
      const updateId = `UPDATE-${Date.now()}`;

      // Update the injury to Recovered status and add resolution details
      const resolveQuery = `
        MATCH (i:Injury {injuryId: $injuryId})
        SET i.status = 'Recovered',
            i.returnToPlayDate = date($returnToPlayDate),
            i.resolutionNotes = $resolutionNotes,
            i.medicalClearance = $medicalClearance,
            i.updatedAt = datetime()
        
        CREATE (s:StatusUpdate {
          updateId: $updateId,
          status: 'Recovered',
          notes: $resolutionNotes,
          recordedBy: $resolvedBy,
          recordedAt: datetime()
        })
        CREATE (i)-[:HAS_STATUS_UPDATE]->(s)
        
        RETURN i
      `;

      const result = await session.run(resolveQuery, {
        injuryId,
        returnToPlayDate: resolveDto.returnToPlayDate,
        resolutionNotes: resolveDto.resolutionNotes || 'Injury resolved',
        medicalClearance: resolveDto.medicalClearance || null,
        updateId,
        resolvedBy,
      });

      if (result.records.length === 0) {
        throw new NotFoundException(`Failed to resolve injury ${injuryId}`);
      }

      // Return the updated injury details
      return this.findOne(injuryId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to resolve injury: ${error.message}`);
    } finally {
      await session.close();
    }
  }
}
