import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('POSTGRES_POOL') private readonly pool: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Query user account
    const result = await this.pool.query(
      `SELECT ua.id, ua.email, ua.password_hash, ua.password_salt, ua.identity_type, ua.pseudonym_id, ua.is_active, ua.is_locked
       FROM user_accounts ua
       WHERE ua.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.rows[0];

    // Check if account is active and not locked
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.is_locked) {
      throw new UnauthorizedException('Account is locked');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.pool.query(
        `UPDATE user_accounts 
         SET failed_login_attempts = failed_login_attempts + 1,
             is_locked = CASE WHEN failed_login_attempts >= 4 THEN true ELSE false END
         WHERE id = $1`,
        [user.id],
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and reset failed attempts
    await this.pool.query(
      `UPDATE user_accounts 
       SET last_login_at = CURRENT_TIMESTAMP,
           failed_login_attempts = 0
       WHERE id = $1`,
      [user.id],
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

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, dateOfBirth, identityType } = registerDto;

    // Check if user already exists
    const existingUser = await this.pool.query(
      'SELECT id FROM user_accounts WHERE email = $1',
      [email],
    );

    if (existingUser.rows.length > 0) {
      throw new UnauthorizedException('Email already exists');
    }

    // Hash password (bcrypt includes salt in the hash)
    const passwordHash = await bcrypt.hash(password, 10);
    const passwordSalt = 'bcrypt'; // bcrypt embeds salt in hash

    // Generate pseudonym ID
    const pseudonymId = `PSY-${identityType.toUpperCase()}-${this.generateRandomId()}`;

    // Start transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert into appropriate identity table
      let identityTable: string;
      let identityResult;

      switch (identityType) {
        case 'player':
          identityTable = 'player_identities';
          identityResult = await client.query(
            `INSERT INTO player_identities 
             (pseudonym_id, neo4j_player_id, first_name, last_name, date_of_birth, email, is_active, gdpr_consent_given, gdpr_consent_date)
             VALUES ($1, $2, $3, $4, $5, $6, true, true, CURRENT_TIMESTAMP)
             RETURNING id`,
            [pseudonymId, `PLAYER-${this.generateRandomId()}`, firstName, lastName, dateOfBirth, email],
          );
          break;
        case 'coach':
          identityTable = 'coach_identities';
          identityResult = await client.query(
            `INSERT INTO coach_identities 
             (pseudonym_id, neo4j_coach_id, first_name, last_name, email, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
            [pseudonymId, `COACH-${this.generateRandomId()}`, firstName, lastName, email],
          );
          break;
        case 'admin':
          identityTable = 'admin_identities';
          identityResult = await client.query(
            `INSERT INTO admin_identities 
             (pseudonym_id, first_name, last_name, email, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING id`,
            [pseudonymId, firstName, lastName, email],
          );
          break;
        default:
          throw new Error('Invalid identity type');
      }

      // Insert into user_accounts
      const userResult = await client.query(
        `INSERT INTO user_accounts 
         (email, password_hash, password_salt, identity_type, pseudonym_id, identity_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [email, passwordHash, passwordSalt, identityType, pseudonymId, identityResult.rows[0].id],
      );

      await client.query('COMMIT');

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
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
