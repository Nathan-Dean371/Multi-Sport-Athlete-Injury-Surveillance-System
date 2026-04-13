import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import {
  TrainingScheduleDto,
  TrainingSessionDefinitionDto,
  TrainingSessionReportDto,
  UpsertTrainingSessionDefinitionDto,
  UpsertTrainingSessionReportDto,
} from "./dto/training.dto";

@Injectable()
export class TrainingService {
  constructor(@Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver) {}

  private async assertRequesterCanAccessPlayer(
    playerPseudonymId: string,
    requesterPseudonymId: string,
  ): Promise<void> {
    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})
        OPTIONAL MATCH (reqParent:Parent {pseudonymId: $requesterPseudonymId})-[:PARENT_OF]->(pl)
        RETURN pl.pseudonymId AS playerPseudo,
               (pl.pseudonymId = $requesterPseudonymId) AS isSelf,
               (count(reqParent) > 0) AS isLinkedParent
      `;

      const res = await session.run(cypher, {
        playerPseudonymId,
        requesterPseudonymId,
      });

      if (res.records.length === 0) {
        throw new NotFoundException("Player not found");
      }

      const rec = res.records[0];
      const isSelf = rec.get("isSelf");
      const isLinkedParent = rec.get("isLinkedParent");

      if (!isSelf && !isLinkedParent) {
        throw new ForbiddenException(
          "Not allowed to access this player's training data",
        );
      }
    } finally {
      await session.close();
    }
  }

  async getTrainingSchedule(
    playerPseudonymId: string,
    requesterPseudonymId: string,
  ): Promise<TrainingScheduleDto> {
    await this.assertRequesterCanAccessPlayer(
      playerPseudonymId,
      requesterPseudonymId,
    );

    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})
        OPTIONAL MATCH (pl)-[:HAS_TRAINING_SESSION_DEF]->(d:TrainingSessionDefinition)
        WITH collect(d) AS defs
        RETURN [d IN defs WHERE d IS NOT NULL | d] AS defs
      `;

      const res = await session.run(cypher, { playerPseudonymId });
      const defs = (res.records[0]?.get("defs") || []) as any[];

      const sessions: TrainingSessionDefinitionDto[] = defs.map((node: any) => {
        const p = node.properties;
        return {
          trainingSessionId: p.trainingSessionId,
          name: p.name,
          sessionType: p.sessionType,
          startDateTime:
            p.startDateTime?.toString?.() ?? String(p.startDateTime),
          isRepeatable: Boolean(p.isRepeatable),
          repeatIntervalDays:
            p.repeatIntervalDays === null || p.repeatIntervalDays === undefined
              ? null
              : Number(p.repeatIntervalDays),
          createdAt: p.createdAt?.toString?.() ?? String(p.createdAt),
          updatedAt: p.updatedAt?.toString?.() ?? String(p.updatedAt),
        };
      });

      return { sessions };
    } finally {
      await session.close();
    }
  }

  async upsertTrainingSessionDefinition(
    playerPseudonymId: string,
    sessionId: string,
    dto: UpsertTrainingSessionDefinitionDto,
    requesterPseudonymId: string,
  ): Promise<{ trainingSessionId: string }> {
    await this.assertRequesterCanAccessPlayer(
      playerPseudonymId,
      requesterPseudonymId,
    );

    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})
        MERGE (d:TrainingSessionDefinition {trainingSessionId: $trainingSessionId})
          ON CREATE SET d.ownerPseudonymId = $playerPseudonymId,
                        d.createdAt = datetime()
        WITH pl, d
        WHERE d.ownerPseudonymId = $playerPseudonymId
        SET d.name = $name,
            d.sessionType = $sessionType,
            d.startDateTime = datetime($startDateTime),
            d.isRepeatable = $isRepeatable,
            d.repeatIntervalDays = $repeatIntervalDays,
            d.updatedAt = datetime()
        MERGE (pl)-[:HAS_TRAINING_SESSION_DEF]->(d)
        RETURN d.trainingSessionId AS id
      `;

      const res = await session.run(cypher, {
        playerPseudonymId,
        trainingSessionId: sessionId,
        name: dto.name,
        sessionType: dto.sessionType,
        startDateTime: dto.startDateTime,
        isRepeatable: dto.isRepeatable,
        repeatIntervalDays: dto.isRepeatable ? dto.repeatIntervalDays : null,
      });

      if (res.records.length === 0) {
        throw new ConflictException(
          "Training session ID already belongs to another player",
        );
      }

      return { trainingSessionId: res.records[0].get("id") };
    } finally {
      await session.close();
    }
  }

  async deleteTrainingSessionDefinition(
    playerPseudonymId: string,
    sessionId: string,
    requesterPseudonymId: string,
  ): Promise<{ deleted: boolean }> {
    await this.assertRequesterCanAccessPlayer(
      playerPseudonymId,
      requesterPseudonymId,
    );

    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})-[:HAS_TRAINING_SESSION_DEF]->(d:TrainingSessionDefinition {trainingSessionId: $trainingSessionId})
        OPTIONAL MATCH (d)-[:HAS_REPORT]->(r:TrainingSessionReport)
        DETACH DELETE d, r
        RETURN count(d) AS deletedCount
      `;

      const res = await session.run(cypher, {
        playerPseudonymId,
        trainingSessionId: sessionId,
      });

      const deletedCount = res.records[0]?.get("deletedCount");
      const deleted = Number(deletedCount) > 0;
      if (!deleted) {
        throw new NotFoundException("Training session not found");
      }

      return { deleted: true };
    } finally {
      await session.close();
    }
  }

  async upsertTrainingSessionReport(
    playerPseudonymId: string,
    sessionId: string,
    occurrenceDate: string,
    dto: UpsertTrainingSessionReportDto,
    requesterPseudonymId: string,
  ): Promise<{ reportKey: string }> {
    await this.assertRequesterCanAccessPlayer(
      playerPseudonymId,
      requesterPseudonymId,
    );

    const reportKey = `${sessionId}:${occurrenceDate}`;

    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})-[:HAS_TRAINING_SESSION_DEF]->(d:TrainingSessionDefinition {trainingSessionId: $trainingSessionId})
        MERGE (r:TrainingSessionReport {reportKey: $reportKey})
          ON CREATE SET r.createdAt = datetime()
        SET r.trainingSessionId = $trainingSessionId,
            r.playerPseudonymId = $playerPseudonymId,
            r.occurrenceDate = date($occurrenceDate),
            r.reportDate = date($reportDate),
            r.effortExpended = $effortExpended,
            r.physicalFeeling = $physicalFeeling,
            r.mentalFeeling = $mentalFeeling,
            r.notes = $notes,
            r.updatedAt = datetime()
        MERGE (d)-[:HAS_REPORT]->(r)
        RETURN r.reportKey AS key
      `;

      const res = await session.run(cypher, {
        playerPseudonymId,
        trainingSessionId: sessionId,
        reportKey,
        occurrenceDate,
        reportDate: dto.reportDate,
        effortExpended: dto.effortExpended,
        physicalFeeling: dto.physicalFeeling,
        mentalFeeling: dto.mentalFeeling,
        notes: dto.notes ?? null,
      });

      if (res.records.length === 0) {
        throw new NotFoundException(
          "Training session definition not found for player",
        );
      }

      return { reportKey: res.records[0].get("key") };
    } finally {
      await session.close();
    }
  }

  async listTrainingReports(
    playerPseudonymId: string,
    requesterPseudonymId: string,
    from?: string,
    to?: string,
  ): Promise<{ reports: TrainingSessionReportDto[] }> {
    await this.assertRequesterCanAccessPlayer(
      playerPseudonymId,
      requesterPseudonymId,
    );

    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (pl:Player {pseudonymId: $playerPseudonymId})-[:HAS_TRAINING_SESSION_DEF]->(:TrainingSessionDefinition)-[:HAS_REPORT]->(r:TrainingSessionReport)
        WITH r
        WHERE ($from IS NULL OR r.reportDate >= date($from))
          AND ($to IS NULL OR r.reportDate <= date($to))
        RETURN r
        ORDER BY r.reportDate DESC, r.occurrenceDate DESC
      `;

      const res = await session.run(cypher, {
        playerPseudonymId,
        from: from ?? null,
        to: to ?? null,
      });

      const reports = res.records.map((record) => {
        const r = record.get("r").properties;
        return {
          reportKey: r.reportKey,
          trainingSessionId: r.trainingSessionId,
          playerPseudonymId: r.playerPseudonymId,
          occurrenceDate:
            r.occurrenceDate?.toString?.() ?? String(r.occurrenceDate),
          reportDate: r.reportDate?.toString?.() ?? String(r.reportDate),
          effortExpended: Number(r.effortExpended),
          physicalFeeling: r.physicalFeeling,
          mentalFeeling: r.mentalFeeling,
          notes: r.notes ?? null,
          createdAt: r.createdAt?.toString?.() ?? String(r.createdAt),
          updatedAt: r.updatedAt?.toString?.() ?? String(r.updatedAt),
        };
      });

      return { reports };
    } finally {
      await session.close();
    }
  }
}
