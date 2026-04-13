import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto, AuthResponseDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";
import { Roles } from "./roles.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("user-management-stats")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Get user management stats",
    description:
      "Returns total, invited, and active counts for coaches, parents, and players.",
  })
  @ApiResponse({ status: 200, description: "User management stats retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - admin only" })
  async getUserManagementStats() {
    return this.authService.getUserManagementStats();
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login user",
    description: "Authenticate user and return JWT token",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully authenticated",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
  ): Promise<AuthResponseDto> {
    const ip = req.ip || req.headers?.["x-forwarded-for"] || null;
    return this.authService.login(loginDto, ip);
  }

  @Get("user-activity")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Get user activity",
    description: "Retrieve login activity for a user",
  })
  async getUserActivity(
    @Query("userId") userId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const l = limit ? Number(limit) : 50;
    const o = offset ? Number(offset) : 0;
    return this.authService.getUserActivity({ userId, limit: l, offset: o });
  }

  // Backwards-compatible route supporting path param style: /auth/user-activity/:userId
  @Get("user-activity/:userId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async getUserActivityByParam(
    @Param("userId") userId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const l = limit ? Number(limit) : 50;
    const o = offset ? Number(offset) : 0;
    return this.authService.getUserActivity({ userId, limit: l, offset: o });
  }

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register new user",
    description: "Create a new user account and return JWT token",
  })
  @ApiResponse({
    status: 201,
    description: "User successfully created",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post("admin/users/:pseudonymId/reset-password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary: "Reset a user's password (Admin only)",
    description:
      "Generates a temporary password for the user identified by pseudonymId and updates their stored password hash.",
  })
  async adminResetPassword(@Param("pseudonymId") pseudonymId: string) {
    return this.authService.adminResetPassword(pseudonymId);
  }
}
