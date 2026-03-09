import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Driver, Session } from "neo4j-driver";
import { Pool } from "pg";
import { CoachDto, CoachListDto } from "./dto/coach.dto";
import { CreateCoachInvitationDto } from "./dto/create-coach-invitation.dto";
import { AcceptCoachInvitationDto } from "./dto/accept-coach-invitation.dto";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { EmailService } from "../common/email.service";

@Injectable()
export class CoachesService {
  constructor(
    @Inject("NEO4J_DRIVER") private neo4jDriver: Driver,
    @Inject("POSTGRES_POOL") private readonly pool: Pool,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get all coaches with their team counts
   */
  async findAll(): Promise<CoachListDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      // Get coaches from Neo4j with team counts
      const query = `
        MATCH (c:Coach)
        OPTIONAL MATCH (c)-[:MANAGES]->(t:Team)
        WITH c, count(DISTINCT t) as teamCount
        RETURN c.coachId as coachId,
               c.pseudonymId as pseudonymId,
               teamCount as teamCount
        ORDER BY c.coachId
      `;

      const result = await session.run(query);

      // Get identity info from PostgreSQL
      const coaches: CoachDto[] = await Promise.all(
        result.records.map(async (record) => {
          const pseudonymId = record.get("pseudonymId");

          // Get identity information from PostgreSQL
          let firstName = null;
          let lastName = null;
          let email = null;
          let isActive = true;

          try {
            const pgResult = await this.pool.query(
              `SELECT ci.first_name, ci.last_name, ci.email, ua.is_active
               FROM coach_identities ci
               LEFT JOIN user_accounts ua ON ua.pseudonym_id = ci.pseudonym_id
               WHERE ci.pseudonym_id = $1`,
              [pseudonymId],
            );
            if (pgResult.rows.length > 0) {
              firstName = pgResult.rows[0].first_name;
              lastName = pgResult.rows[0].last_name;
              email = pgResult.rows[0].email;
              isActive = pgResult.rows[0].is_active ?? true;
            }
          } catch (error) {
            console.warn(`Could not fetch identity for ${pseudonymId}:`, error);
          }

          return {
            coachId: record.get("coachId"),
            pseudonymId,
            firstName,
            lastName,
            email,
            teamCount: record.get("teamCount").toNumber(),
            isActive,
          };
        }),
      );

      return {
        coaches,
        total: coaches.length,
      };
    } catch (error) {
      console.error("Error fetching coaches:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get a specific coach by ID
   */
  async findOne(id: string): Promise<CoachDto> {
    const session: Session = this.neo4jDriver.session();

    try {
      const query = `
        MATCH (c:Coach)
        WHERE c.coachId = $id OR c.pseudonymId = $id
        OPTIONAL MATCH (c)-[:MANAGES]->(t:Team)
        WITH c, count(DISTINCT t) as teamCount
        RETURN c.coachId as coachId,
               c.pseudonymId as pseudonymId,
               teamCount as teamCount
      `;

      const result = await session.run(query, { id });

      if (result.records.length === 0) {
        throw new NotFoundException(`Coach with ID ${id} not found`);
      }

      const record = result.records[0];
      const pseudonymId = record.get("pseudonymId");

      // Get identity information from PostgreSQL
      let firstName = null;
      let lastName = null;
      let email = null;
      let isActive = true;

      try {
        const pgResult = await this.pool.query(
          `SELECT ci.first_name, ci.last_name, ci.email, ua.is_active
           FROM coach_identities ci
           LEFT JOIN user_accounts ua ON ua.pseudonym_id = ci.pseudonym_id
           WHERE ci.pseudonym_id = $1`,
          [pseudonymId],
        );
        if (pgResult.rows.length > 0) {
          firstName = pgResult.rows[0].first_name;
          lastName = pgResult.rows[0].last_name;
          email = pgResult.rows[0].email;
          isActive = pgResult.rows[0].is_active ?? true;
        }
      } catch (error) {
        console.warn(`Could not fetch identity for ${pseudonymId}:`, error);
      }

      return {
        coachId: record.get("coachId"),
        pseudonymId,
        firstName,
        lastName,
        email,
        teamCount: record.get("teamCount").toNumber(),
        isActive,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error("Error fetching coach:", error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create a coach invitation (Admin only)
   */
  async createInvitation(
    dto: CreateCoachInvitationDto & { adminPseudonymId?: string },
  ) {
    const token = randomBytes(32).toString("hex");

    const client = await this.pool.connect();
    try {
      // Check if there's already a pending invitation for this email
      const existingInvitation = await client.query(
        `SELECT * FROM coach_invitations 
         WHERE coach_email = $1 AND accepted = false AND expires_at > NOW()`,
        [dto.coachEmail],
      );

      if (existingInvitation.rows.length > 0) {
        throw new BadRequestException(
          "An active invitation already exists for this email",
        );
      }

      // Check if coach already has an account
      const existingUser = await client.query(
        `SELECT * FROM user_accounts WHERE email = $1 AND identity_type = 'coach'`,
        [dto.coachEmail],
      );

      if (existingUser.rows.length > 0) {
        throw new BadRequestException(
          "A coach account already exists with this email",
        );
      }

      await client.query(
        `INSERT INTO coach_invitations 
         (admin_pseudonym_id, coach_email, coach_first_name, coach_last_name, token, created_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '7 days')`,
        [
          dto.adminPseudonymId || "admin",
          dto.coachEmail,
          dto.coachFirstName || null,
          dto.coachLastName || null,
          token,
        ],
      );

      // Send invitation email
      try {
        await this.emailService.sendCoachInvitation(
          dto.coachEmail,
          token,
          dto.coachFirstName,
          dto.coachLastName,
        );
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the invitation creation if email fails
      }
    } finally {
      client.release();
    }

    // In production, we'd send an email with the token
    // For now, return the token for development/testing purposes
    return {
      token,
      message:
        "Invitation created successfully. An email has been sent to the coach.",
      invitationLink: `${process.env.FRONTEND_URL || "http://localhost:3001"}/accept-invitation/coach?token=${token}`,
    };
  }

  /**
   * Accept a coach invitation
   */
  async acceptInvitation(dto: AcceptCoachInvitationDto) {
    const client = await this.pool.connect();
    const neo4jSession: Session = this.neo4jDriver.session();

    try {
      await client.query("BEGIN");

      // Check if invitation exists and is valid
      const res = await client.query(
        `SELECT * FROM coach_invitations 
         WHERE token = $1 AND accepted = false AND expires_at > NOW()`,
        [dto.token],
      );

      if (res.rows.length === 0) {
        throw new NotFoundException(
          "Invitation not found, already accepted, or expired",
        );
      }

      const invitation = res.rows[0];

      // Use invitation data for firstName and lastName if not provided in request
      const firstName = dto.firstName || invitation.coach_first_name;
      const lastName = dto.lastName || invitation.coach_last_name;

      // Generate pseudonym ID if not provided
      const pseudonymId =
        dto.pseudonymId || `coach-${randomBytes(6).toString("hex")}`;

      // Generate unique coach ID for Neo4j
      const coachNeoId = `COACH-${randomBytes(4).toString("hex").toUpperCase()}`;

      // Create coach identity in PostgreSQL
      const coachIdentityResult = await client.query(
        `INSERT INTO coach_identities 
         (pseudonym_id, neo4j_coach_id, first_name, last_name, email, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [pseudonymId, coachNeoId, firstName, lastName, invitation.coach_email],
      );

      const coachIdentityId = coachIdentityResult.rows[0].id;

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const passwordSalt = "bcrypt";

      // Create user account for coach
      await client.query(
        `INSERT INTO user_accounts 
         (email, password_hash, password_salt, identity_type, pseudonym_id, identity_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          invitation.coach_email,
          passwordHash,
          passwordSalt,
          "coach",
          pseudonymId,
          coachIdentityId,
        ],
      );

      // Mark invitation as accepted
      await client.query(
        `UPDATE coach_invitations 
         SET accepted = true, accepted_at = NOW() 
         WHERE token = $1`,
        [dto.token],
      );

      // Create coach node in Neo4j
      await neo4jSession.run(
        `CREATE (c:Coach {
          coachId: $coachId,
          pseudonymId: $pseudonymId,
          createdAt: datetime()
        })`,
        {
          coachId: coachNeoId,
          pseudonymId: pseudonymId,
        },
      );

      await client.query("COMMIT");

      return {
        message: "Coach invitation accepted successfully",
        coach: {
          coachId: coachNeoId,
          pseudonymId,
          email: invitation.coach_email,
          firstName: firstName,
          lastName: lastName,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      await neo4jSession.close();
    }
  }

  /**
   * Get all pending coach invitations (Admin only)
   */
  async getPendingInvitations() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT invitation_id, coach_email, coach_first_name, coach_last_name, 
                created_at, expires_at, admin_pseudonym_id
         FROM coach_invitations
         WHERE accepted = false AND expires_at > NOW()
         ORDER BY created_at DESC`,
      );

      return {
        invitations: result.rows.map((row) => ({
          invitationId: row.invitation_id,
          coachEmail: row.coach_email,
          coachFirstName: row.coach_first_name,
          coachLastName: row.coach_last_name,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          adminPseudonymId: row.admin_pseudonym_id,
        })),
        total: result.rows.length,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all accepted coach invitations (Admin only)
   */
  async getAcceptedInvitations() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT invitation_id, coach_email, coach_first_name, coach_last_name, 
                created_at, accepted_at, admin_pseudonym_id
         FROM coach_invitations
         WHERE accepted = true
         ORDER BY accepted_at DESC`,
      );

      return {
        invitations: result.rows.map((row) => ({
          invitationId: row.invitation_id,
          coachEmail: row.coach_email,
          coachFirstName: row.coach_first_name,
          coachLastName: row.coach_last_name,
          createdAt: row.created_at,
          acceptedAt: row.accepted_at,
          adminPseudonymId: row.admin_pseudonym_id,
        })),
        total: result.rows.length,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Cancel a pending coach invitation
   */
  async cancelInvitation(invitationId: string) {
    const client = await this.pool.connect();
    try {
      // Check if invitation exists and is not yet accepted
      const checkResult = await client.query(
        `SELECT invitation_id, accepted FROM coach_invitations 
         WHERE invitation_id = $1`,
        [invitationId],
      );

      if (checkResult.rows.length === 0) {
        throw new NotFoundException(
          `Invitation with ID ${invitationId} not found`,
        );
      }

      if (checkResult.rows[0].accepted) {
        throw new BadRequestException(
          "Cannot cancel an invitation that has already been accepted",
        );
      }

      // Delete the invitation
      await client.query(
        `DELETE FROM coach_invitations WHERE invitation_id = $1`,
        [invitationId],
      );

      return {
        message: "Invitation cancelled successfully",
      };
    } finally {
      client.release();
    }
  }
}
