import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Pool } from "pg";
import { Driver, Session } from "neo4j-driver";
import { CreateParentInvitationDto } from "./dto/create-parent-invitation.dto";
import { AcceptParentInvitationDto } from "./dto/accept-parent-invitation.dto";
import { ParentDto, ParentListDto } from "./dto/parent.dto";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class ParentsService {
  constructor(
    @Inject("POSTGRES_POOL") private readonly pool: Pool,
    @Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver,
  ) {}

  async createInvitation(
    dto: CreateParentInvitationDto & { coachPseudonymId?: string },
  ) {
    const token = randomBytes(16).toString("hex");

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO parent_invitations (coach_pseudonym_id, parent_email, parent_phone, token, created_at)
         VALUES ($1,$2,$3,$4,NOW())`,
        [
          dto.coachPseudonymId || dto.coachPseudonymId,
          dto.parentEmail,
          dto.parentPhone || null,
          token,
        ],
      );
    } finally {
      client.release();
    }

    // In production we'd send email; for now return token so tests/dev can use it
    return { token };
  }

  async acceptInvitation(dto: AcceptParentInvitationDto) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const res = await client.query(
        `SELECT * FROM parent_invitations WHERE token=$1`,
        [dto.token],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException("Invitation not found");
      }

      const inv = res.rows[0];

      if (inv.accepted) {
        throw new BadRequestException("Invitation already accepted");
      }

      // create parent identity in Postgres
      const pseudo =
        dto.pseudonymId || `parent-${randomBytes(6).toString("hex")}`;
      const parentIdentityResult = await client.query(
        `INSERT INTO parent_identities (pseudonym_id, first_name, last_name, email, phone, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
         RETURNING parent_id`,
        [
          pseudo,
          dto.firstName,
          dto.lastName,
          inv.parent_email || null,
          inv.parent_phone || null,
        ],
      );

      const parentId = parentIdentityResult.rows[0].parent_id;

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const passwordSalt = "bcrypt";

      // Create user account for parent
      await client.query(
        `INSERT INTO user_accounts (email, password_hash, password_salt, identity_type, pseudonym_id, identity_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          inv.parent_email || null,
          passwordHash,
          passwordSalt,
          "parent",
          pseudo,
          parentId,
        ],
      );

      await client.query(
        `UPDATE parent_invitations SET accepted=TRUE, accepted_at=NOW() WHERE invitation_id=$1`,
        [inv.invitation_id],
      );

      // Create Parent node in Neo4j and link to coach and/or players once linked via API
      const session: Session = this.neo4jDriver.session();
      try {
        await session.run(
          `CREATE (p:Parent {parentId: $parentId, pseudonymId: $pseudonymId, createdAt: datetime()})`,
          { parentId: pseudo, pseudonymId: pseudo },
        );
      } finally {
        await session.close();
      }

      await client.query("COMMIT");
      return { pseudonymId: pseudo };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getProfile(pseudonymId: string) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(
        `SELECT * FROM parent_identities WHERE pseudonym_id=$1`,
        [pseudonymId],
      );
      if (res.rows.length === 0) {
        throw new NotFoundException("Parent not found");
      }
      return res.rows[0];
    } finally {
      client.release();
    }
  }

  async findAllForAdmin(): Promise<ParentListDto> {
    // Get parent data from Neo4j
    const neo4jSession: Session = this.neo4jDriver.session();
    try {
      const result = await neo4jSession.run(`
        MATCH (parent:Parent)
        OPTIONAL MATCH (parent)-[:PARENT_OF]->(player:Player)
        RETURN parent.pseudonymId as pseudonymId,
               count(DISTINCT player) as childrenCount
        ORDER BY parent.pseudonymId
      `);

      const pseudonymIds = result.records.map((r) => r.get("pseudonymId"));
      const childrenCounts = new Map(
        result.records.map((r) => [
          r.get("pseudonymId"),
          r.get("childrenCount").toNumber(),
        ]),
      );

      if (pseudonymIds.length === 0) {
        return { parents: [], total: 0 };
      }

      // Get identity data from PostgreSQL
      const client = await this.pool.connect();
      try {
        const identityResult = await client.query(
          `SELECT 
             pi.parent_id,
             pi.pseudonym_id,
             pi.first_name,
             pi.last_name,
             pi.email,
             pi.phone,
             COALESCE(ua.is_active, true) as is_active
           FROM parent_identities pi
           LEFT JOIN user_accounts ua ON ua.pseudonym_id = pi.pseudonym_id AND ua.identity_type = 'parent'
           WHERE pi.pseudonym_id = ANY($1::text[])
           ORDER BY pi.last_name, pi.first_name`,
          [pseudonymIds],
        );

        const parents: ParentDto[] = identityResult.rows.map((row) => ({
          parentId: row.parent_id,
          pseudonymId: row.pseudonym_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          childrenCount: childrenCounts.get(row.pseudonym_id) || 0,
          isActive: row.is_active ?? true,
        }));

        return {
          parents,
          total: parents.length,
        };
      } finally {
        client.release();
      }
    } finally {
      await neo4jSession.close();
    }
  }
}
