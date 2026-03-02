import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { Pool } from 'pg';
import { CreateSessionDto } from './dto/create-session.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionsService {
  constructor(
    @Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver,
    @Inject('POSTGRES_POOL') private readonly pool: Pool,
  ) {}

  async createSession(ownerPseudonym: string, dto: CreateSessionDto) {
    const sessionId = `SES-${new Date().getFullYear()}-${randomBytes(4).toString('hex')}`;
    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (owner {pseudonymId: $ownerPseudonym})
        CREATE (s:Session {
          sessionId: $sessionId,
          sessionType: $sessionType,
          sessionDate: datetime($sessionDate),
          notes: $notes,
          createdAt: datetime()
        })
        CREATE (owner)-[:OWNS_SESSION]->(s)
        RETURN s
      `;

      const res = await session.run(cypher, {
        ownerPseudonym,
        sessionId,
        sessionType: dto.sessionType,
        sessionDate: dto.sessionDate,
        notes: dto.notes || null,
      });

      if (res.records.length === 0) {
        throw new NotFoundException('Owner not found');
      }

      return { sessionId };
    } finally {
      await session.close();
    }
  }

  async getSession(sessionId: string, requesterPseudo: string) {
    const session: Session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (s:Session {sessionId:$sessionId})
        OPTIONAL MATCH (owner)-[:OWNS_SESSION]->(s)
        OPTIONAL MATCH (p:Parent)-[:PARENT_OF]->(owner)
        RETURN s, owner.pseudonymId AS ownerPseudo, collect(p.pseudonymId) AS parentPseudos
      `;

      const res = await session.run(cypher, { sessionId });
      if (res.records.length === 0) {
        throw new NotFoundException('Session not found');
      }

      const rec = res.records[0];
      const s = rec.get('s').properties;
      const ownerPseudo = rec.get('ownerPseudo');
      const parentPseudos = rec.get('parentPseudos') || [];

      // Only owner or linked parents may access
      if (requesterPseudo !== ownerPseudo && !parentPseudos.includes(requesterPseudo)) {
        throw new ForbiddenException('Not allowed to access this session');
      }

      return {
        sessionId: s.sessionId,
        sessionType: s.sessionType,
        sessionDate: s.sessionDate?.toString(),
        notes: s.notes,
        createdAt: s.createdAt?.toString(),
        ownerPseudo,
      };
    } finally {
      await session.close();
    }
  }
}
