import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ReportQueryDto } from "./dto/report-query.dto";
import {
  ReportConfigDto,
  ReportResponseDto,
  SaveReportDto,
  SavedReportDto,
} from "./dto/report-builder.dto";

@ApiTags("reports")
@ApiBearerAuth("JWT-auth")
@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Post("build")
  @Roles("admin", "coach")
  @ApiOperation({
    summary: "Build a custom report",
    description:
      "Generate a dynamic report based on selected metrics, filters, and aggregate functions",
  })
  @ApiBody({ type: ReportConfigDto })
  @ApiResponse({
    status: 200,
    description: "Report generated successfully",
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid report configuration",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  async buildReport(
    @Body() config: ReportConfigDto,
  ): Promise<ReportResponseDto> {
    this.logger.log(`Building report with ${config.metrics.length} metrics`);
    const report = await this.reportsService.buildReport(config);

    // If CSV format requested, convert to CSV
    if (config.exportFormat === "csv") {
      const csvData = this.reportsService.exportAsCSV(report);
      return {
        ...report,
        data: csvData as any,
      };
    }

    return report;
  }

  @Post("save")
  @Roles("admin", "coach")
  @ApiOperation({
    summary: "Save a report configuration",
    description: "Save a report configuration for later use",
  })
  @ApiBody({ type: SaveReportDto })
  @ApiResponse({
    status: 201,
    description: "Report configuration saved successfully",
  })
  @HttpCode(HttpStatus.CREATED)
  saveReport(@Body() dto: SaveReportDto, @Req() req: any): SavedReportDto {
    const userId = req.user?.userId || "unknown";
    this.logger.log(`Saving report "${dto.reportName}" for user ${userId}`);
    return this.reportsService.saveReport(dto, userId);
  }

  @Get("saved")
  @Roles("admin", "coach")
  @ApiOperation({
    summary: "Get all saved reports",
    description: "Retrieve all saved report configurations",
  })
  @ApiResponse({
    status: 200,
    description: "List of saved reports",
    type: [Object],
  })
  getSavedReports(): SavedReportDto[] {
    return this.reportsService.getSavedReports();
  }

  @Get("saved/:reportId")
  @Roles("admin", "coach")
  @ApiOperation({
    summary: "Get a saved report by ID",
    description: "Retrieve a specific saved report configuration",
  })
  @ApiParam({
    name: "reportId",
    description: "Report ID",
    example: "report-123",
  })
  @ApiResponse({
    status: 200,
    description: "Saved report found",
  })
  @ApiResponse({
    status: 404,
    description: "Report not found",
  })
  getSavedReport(@Param("reportId") reportId: string): SavedReportDto | null {
    return this.reportsService.getSavedReport(reportId);
  }

  @Post("saved/:reportId/generate")
  @Roles("admin", "coach")
  @ApiOperation({
    summary: "Generate report from saved configuration",
    description: "Run a saved report configuration to generate current data",
  })
  @ApiParam({
    name: "reportId",
    description: "Report ID",
    example: "report-123",
  })
  @ApiResponse({
    status: 200,
    description: "Report generated from saved configuration",
  })
  @ApiResponse({
    status: 404,
    description: "Saved report not found",
  })
  async generateFromSaved(
    @Param("reportId") reportId: string,
  ): Promise<ReportResponseDto> {
    const savedReport = this.reportsService.getSavedReport(reportId);

    if (!savedReport) {
      throw new Error(`Report ${reportId} not found`);
    }

    this.logger.log(
      `Generating report from saved config: ${savedReport.reportName}`,
    );
    const report = await this.reportsService.buildReport(savedReport.config);

    return {
      ...report,
      reportId: savedReport.reportId,
      reportName: savedReport.reportName,
    };
  }

  @Delete("saved/:reportId")
  @Roles("admin")
  @ApiOperation({
    summary: "Delete a saved report",
    description: "Remove a saved report configuration",
  })
  @ApiParam({
    name: "reportId",
    description: "Report ID",
    example: "report-123",
  })
  @ApiResponse({
    status: 200,
    description: "Report deleted successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Report not found",
  })
  @HttpCode(HttpStatus.OK)
  deleteReport(@Param("reportId") reportId: string): { deleted: boolean } {
    const deleted = this.reportsService.deleteReport(reportId);
    return { deleted };
  }

  // Legacy endpoint for backwards compatibility
  @Post("export")
  @Roles("admin")
  @ApiOperation({
    summary: "Export report (legacy)",
    description: "Legacy export endpoint - use /reports/build instead",
  })
  @ApiResponse({
    status: 200,
    description: "Report exported successfully",
  })
  export(@Body() dto: ReportQueryDto) {
    return this.reportsService.generateReport(dto);
  }
}
