import {
  Injectable,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Pool } from "pg";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { LoginDto, RegisterDto, AuthResponseDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject("POSTGRES_POOL") private readonly pool: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto, ip?: string): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Query user account
    const result = await this.pool.query(
      `SELECT ua.id, ua.email, ua.password_hash, ua.password_salt, ua.identity_type, ua.pseudonym_id, ua.is_active, ua.is_locked
       FROM user_accounts ua
       WHERE ua.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      // No user found - cannot record activity without user id
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = result.rows[0];

    // Check if account is active and not locked
    if (!user.is_active) {
      throw new UnauthorizedException("Account is inactive");
    }

    if (user.is_locked) {
      throw new UnauthorizedException("Account is locked");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Record failed login attempt
      await this.pool.query(
        `INSERT INTO user_activity (user_account_id, occurred_at, success, ip_address)
         VALUES ($1, CURRENT_TIMESTAMP, false, $2)`,
        [user.id, ip],
      );

      // Increment failed login attempts
      await this.pool.query(
        `UPDATE user_accounts 
         SET failed_login_attempts = failed_login_attempts + 1,
             is_locked = CASE WHEN failed_login_attempts >= 4 THEN true ELSE false END
         WHERE id = $1`,
        [user.id],
      );

      throw new UnauthorizedException("Invalid credentials");
    }

    // Update last login and reset failed attempts
    await this.pool.query(
      `UPDATE user_accounts 
       SET last_login_at = CURRENT_TIMESTAMP,
           failed_login_attempts = 0
       WHERE id = $1`,
      [user.id],
    );

    // Record successful login activity
    await this.pool.query(
      `INSERT INTO user_activity (user_account_id, occurred_at, success, ip_address)
       VALUES ($1, CURRENT_TIMESTAMP, true, $2)`,
      [user.id, ip],
    );

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      identityType: user.identity_type,
      pseudonymId: user.pseudonym_id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        identityType: user.identity_type,
        pseudonymId: user.pseudonym_id,
      },
    };
  }

  async getUserActivity(query: {
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, limit = 50, offset = 0 } = query;

    // If no userId provided, return all activity (paginated)
    if (!userId) {
      const resAll = await this.pool.query(
        `SELECT ua.id, ua.user_account_id, ua.occurred_at, ua.success, ua.ip_address, acc.pseudonym_id
         FROM user_activity ua
         LEFT JOIN user_accounts acc ON acc.id = ua.user_account_id
         ORDER BY ua.occurred_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );

      return resAll.rows.map((r) => ({
        id: r.id,
        userAccountId: r.user_account_id,
        occurredAt: r.occurred_at,
        success: r.success,
        ipAddress: r.ip_address,
        pseudonymId: r.pseudonym_id,
      }));
    }

    // Accept either a user_accounts.id (UUID) or a pseudonym_id.
    // Validate input first to avoid passing non-UUID text into a UUID column query.
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    let accountId: string | null = null;

    if (uuidRegex.test(userId)) {
      // Treat as UUID
      const existsRes = await this.pool.query(
        `SELECT id FROM user_accounts WHERE id = $1`,
        [userId],
      );
      if (existsRes.rows.length === 0) return [];
      accountId = existsRes.rows[0].id;
    } else {
      // Treat as pseudonym_id
      const pseudoRes = await this.pool.query(
        `SELECT id FROM user_accounts WHERE pseudonym_id = $1`,
        [userId],
      );
      if (pseudoRes.rows.length === 0) return [];
      accountId = pseudoRes.rows[0].id;
    }

    const res = await this.pool.query(
      `SELECT ua.id, ua.user_account_id, ua.occurred_at, ua.success, ua.ip_address, acc.pseudonym_id
       FROM user_activity ua
       LEFT JOIN user_accounts acc ON acc.id = ua.user_account_id
       WHERE ua.user_account_id = $1
       ORDER BY ua.occurred_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, limit, offset],
    );

    return res.rows.map((r) => ({
      id: r.id,
      userAccountId: r.user_account_id,
      occurredAt: r.occurred_at,
      success: r.success,
      ipAddress: r.ip_address,
      pseudonymId: r.pseudonym_id,
    }));
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, dateOfBirth, identityType } =
      registerDto;

    // Check if user already exists
    const existingUser = await this.pool.query(
      "SELECT id FROM user_accounts WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new UnauthorizedException("Email already exists");
    }

    // Hash password (bcrypt includes salt in the hash)
    const passwordHash = await bcrypt.hash(password, 10);
    const passwordSalt = "bcrypt"; // bcrypt embeds salt in hash

    // Generate pseudonym ID
    const pseudonymId = `PSY-${identityType.toUpperCase()}-${this.generateRandomId()}`;

    // Start transaction
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Insert into appropriate identity table
      let identityResult;

      switch (identityType) {
        case "player":
          identityResult = await client.query(
            `INSERT INTO player_identities 
             (pseudonym_id, neo4j_player_id, first_name, last_name, date_of_birth, email, is_active, gdpr_consent_given, gdpr_consent_date)
             VALUES ($1, $2, $3, $4, $5, $6, true, true, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
              pseudonymId,
              `PLAYER-${this.generateRandomId()}`,
              firstName,
              lastName,
              dateOfBirth,
              email,
            ],
          );
          break;
        case "coach":
          identityResult = await client.query(
            `INSERT INTO coach_identities 
             (pseudonym_id, neo4j_coach_id, first_name, last_name, email, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
            [
              pseudonymId,
              `COACH-${this.generateRandomId()}`,
              firstName,
              lastName,
              email,
            ],
          );
          break;
        case "admin":
          identityResult = await client.query(
            `INSERT INTO admin_identities 
             (pseudonym_id, neo4j_admin_id, first_name, last_name, email, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
            [
              pseudonymId,
              `ADMIN-${this.generateRandomId()}`,
              firstName,
              lastName,
              email,
            ],
          );
          break;
        case "parent":
          identityResult = await client.query(
            `INSERT INTO parent_identities 
             (pseudonym_id, first_name, last_name, email, created_at, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING parent_id as id`,
            [pseudonymId, firstName, lastName, email],
          );
          break;
        default:
          throw new Error("Invalid identity type");
      }

      // Insert into user_accounts
      const userResult = await client.query(
        `INSERT INTO user_accounts 
         (email, password_hash, password_salt, identity_type, pseudonym_id, identity_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [
          email,
          passwordHash,
          passwordSalt,
          identityType,
          pseudonymId,
          identityResult.rows[0].id,
        ],
      );

      await client.query("COMMIT");

      // Generate JWT token
      const payload = {
        sub: userResult.rows[0].id,
        email,
        identityType,
        pseudonymId,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: userResult.rows[0].id,
          email,
          identityType,
          pseudonymId,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async adminResetPassword(pseudonymId: string) {
    const accountRes = await this.pool.query(
      `SELECT id, email FROM user_accounts WHERE pseudonym_id = $1 LIMIT 1`,
      [pseudonymId],
    );

    if (accountRes.rows.length === 0) {
      throw new NotFoundException(`User account ${pseudonymId} not found`);
    }

    const account = accountRes.rows[0];

    // 24-ish chars, URL-safe, high entropy
    const temporaryPassword = randomBytes(18).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await this.pool.query(
      `UPDATE user_accounts
       SET password_hash = $1,
           password_salt = $2,
           password_changed_at = CURRENT_TIMESTAMP,
           is_locked = false,
           lock_reason = NULL,
           failed_login_attempts = 0,
           last_failed_login = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [passwordHash, "bcrypt", account.id],
    );

    return {
      message: `Temporary password generated for ${account.email}`,
      temporaryPassword,
    };
  }

  async validateUser(userId: string): Promise<any> {
    const result = await this.pool.query(
      `SELECT id, email, identity_type, pseudonym_id, is_active, is_locked
       FROM user_accounts
       WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    if (!user.is_active || user.is_locked) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      identityType: user.identity_type,
      pseudonymId: user.pseudonym_id,
      pseudonym: user.pseudonym_id,
    };
  }

  async getUserManagementStats() {
    const identityTypes = ["coach", "parent", "player"];

    const totalsResult = await this.pool.query(
      `SELECT
         identity_type,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE is_active = true)::int AS active,
         COUNT(*) FILTER (WHERE is_active = false)::int AS invited
       FROM user_accounts
       WHERE identity_type = ANY($1)
       GROUP BY identity_type`,
      [identityTypes],
    );

    const pendingParentInvitesResult = await this.pool.query(
      `SELECT COUNT(*)::int AS pending
       FROM parent_invitations
       WHERE accepted = false`,
    );

    const statsMap = {
      coach: { total: 0, invited: 0, active: 0 },
      parent: { total: 0, invited: 0, active: 0 },
      player: { total: 0, invited: 0, active: 0 },
    };

    for (const row of totalsResult.rows) {
      const identityType = row.identity_type as keyof typeof statsMap;
      if (statsMap[identityType]) {
        statsMap[identityType] = {
          total: Number(row.total),
          invited: Number(row.invited),
          active: Number(row.active),
        };
      }
    }

    // Parent invitations can exist before user_accounts rows are created.
    statsMap.parent.invited += Number(
      pendingParentInvitesResult.rows[0]?.pending || 0,
    );

    return {
      coaches: statsMap.coach,
      parents: statsMap.parent,
      players: statsMap.player,
    };
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
