import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { CreateInjuryDto, UpdateInjuryDto, InjuryDetailDto } from './dto/injury.dto';

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
        `MATCH (p:Player {playerId: $playerId}) RETURN p`,
        { playerId: createInjuryDto.playerId }
      );

      if (playerCheck.records.length === 0) {
        throw new NotFoundException(`Player ${createInjuryDto.playerId} not found`);
      }

      // Generate injury ID
      const injuryId = await this.generateInjuryId(session);

      // Create the injury node and relationship to player
      const query = `
        MATCH (p:Player {playerId: $playerId})
        
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
        
        CREATE (p)-[:HAS_INJURY {
          diagnosedDate: datetime(),
          reportedBy: $reportedBy
        }]->(i)
        
        RETURN i, p.playerId AS playerId
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
          playerId: createInjuryDto.playerId,
          diagnosedDate: new Date().toISOString(),
          reportedBy,
        },
      };
    } finally {
      await session.close();
    }
  }

  async findOne(injuryId: string): Promise<InjuryDetailDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (i:Injury {injuryId: $injuryId})
        OPTIONAL MATCH (p:Player)-[r:HAS_INJURY]->(i)
        OPTIONAL MATCH (i)-[:HAS_STATUS_UPDATE]->(s:StatusUpdate)
        
        WITH i, p, r, s
        ORDER BY s.recordedAt DESC
        
        RETURN i,
               p.playerId AS playerId,
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
}
