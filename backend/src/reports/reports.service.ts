import { Injectable, Inject, Logger } from "@nestjs/common";
import { ReportQueryDto } from "./dto/report-query.dto";
import {
  ReportConfigDto,
  ReportResponseDto,
  ReportDataResult,
  ReportMetric,
  AggregateFunction,
  SaveReportDto,
  SavedReportDto,
} from "./dto/report-builder.dto";
import { Driver } from "neo4j-driver";

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  // In-memory storage for saved reports (in production, use a database)
  private savedReports: Map<string, SavedReportDto> = new Map();

  constructor(@Inject("NEO4J_DRIVER") private readonly neo4jDriver: Driver) {}

  /**
   * Generate a custom report based on the configuration
   */
  async buildReport(config: ReportConfigDto): Promise<ReportResponseDto> {
    const session = this.neo4jDriver.session();

    try {
      const data: ReportDataResult[] = [];
      let totalRecords = 0;

      // Build the base query with filters
      const whereConditions = this.buildWhereConditions(config);
      const baseQuery = `
        MATCH (i:Injury)
        ${whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""}
      `;

      // Get total records count
      const countResult = await session.run(
        `${baseQuery} RETURN count(i) AS total`,
        this.buildQueryParams(config),
      );
      totalRecords =
        countResult.records[0]?.get("total").toNumber?.() ||
        countResult.records[0]?.get("total") ||
        0;

      // Process each metric
      for (const metric of config.metrics) {
        const result = await this.calculateMetric(
          session,
          metric,
          config.aggregateFunction,
          baseQuery,
          this.buildQueryParams(config),
        );
        if (result) {
          data.push(result);
        }
      }

      return {
        generatedAt: new Date().toISOString(),
        filters: {
          status: config.statusFilter,
          severity: config.severityFilter,
          injuryType: config.injuryTypeFilter,
          bodyPart: config.bodyPartFilter,
          fromDate: config.fromDate,
          toDate: config.toDate,
          teamId: config.teamId,
        },
        aggregateFunction: config.aggregateFunction,
        data,
        totalRecords,
        format: config.exportFormat || "json",
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate a specific metric value
   */
  private async calculateMetric(
    session: any,
    metric: ReportMetric,
    aggregateFunction: AggregateFunction,
    baseQuery: string,
    params: Record<string, any>,
  ): Promise<ReportDataResult | null> {
    let query = "";
    let value: number | string = 0;
    let breakdown: Record<string, number> | undefined;

    switch (metric) {
      case ReportMetric.INJURY_COUNT:
        query = `${baseQuery} RETURN count(i) AS value`;
        break;

      case ReportMetric.ACTIVE_INJURIES:
        query = `${baseQuery} AND i.status = 'Active' RETURN count(i) AS value`;
        break;

      case ReportMetric.RECOVERED_INJURIES:
        query = `${baseQuery} AND i.status = 'Recovered' RETURN count(i) AS value`;
        break;

      case ReportMetric.CHRONIC_INJURIES:
        query = `${baseQuery} AND i.status = 'Chronic' RETURN count(i) AS value`;
        break;

      case ReportMetric.AVERAGE_RECOVERY_DAYS:
        query = `
          ${baseQuery}
          AND i.actualReturnDate IS NOT NULL AND i.injuryDate IS NOT NULL
          WITH i, duration.between(date(i.injuryDate), date(i.actualReturnDate)).days AS recoveryDays
          RETURN avg(recoveryDays) AS value
        `;
        break;

      case ReportMetric.TOTAL_RECOVERY_DAYS:
        query = `
          ${baseQuery}
          AND i.actualReturnDate IS NOT NULL AND i.injuryDate IS NOT NULL
          WITH i, duration.between(date(i.injuryDate), date(i.actualReturnDate)).days AS recoveryDays
          RETURN sum(recoveryDays) AS value
        `;
        break;

      case ReportMetric.MIN_RECOVERY_DAYS:
        query = `
          ${baseQuery}
          AND i.actualReturnDate IS NOT NULL AND i.injuryDate IS NOT NULL
          WITH i, duration.between(date(i.injuryDate), date(i.actualReturnDate)).days AS recoveryDays
          RETURN min(recoveryDays) AS value
        `;
        break;

      case ReportMetric.MAX_RECOVERY_DAYS:
        query = `
          ${baseQuery}
          AND i.actualReturnDate IS NOT NULL AND i.injuryDate IS NOT NULL
          WITH i, duration.between(date(i.injuryDate), date(i.actualReturnDate)).days AS recoveryDays
          RETURN max(recoveryDays) AS value
        `;
        break;

      case ReportMetric.MINOR_COUNT:
        query = `${baseQuery} AND i.severity = 'Minor' RETURN count(i) AS value`;
        break;

      case ReportMetric.MODERATE_COUNT:
        query = `${baseQuery} AND i.severity = 'Moderate' RETURN count(i) AS value`;
        break;

      case ReportMetric.SEVERE_COUNT:
        query = `${baseQuery} AND i.severity = 'Severe' RETURN count(i) AS value`;
        break;

      case ReportMetric.CRITICAL_COUNT:
        query = `${baseQuery} AND i.severity = 'Critical' RETURN count(i) AS value`;
        break;

      case ReportMetric.INJURIES_BY_BODY_PART:
        query = `
          ${baseQuery}
          RETURN i.bodyPart AS category, count(i) AS count
          ORDER BY count DESC
        `;
        const bodyPartResult = await session.run(query, params);
        breakdown = {};
        bodyPartResult.records.forEach((record) => {
          const category = record.get("category");
          const count = record.get("count").toNumber?.() || record.get("count");
          if (category) breakdown![category] = count;
        });
        value = Object.keys(breakdown).length;
        return { metric, value, breakdown };

      case ReportMetric.INJURIES_BY_TYPE:
        query = `
          ${baseQuery}
          RETURN i.injuryType AS category, count(i) AS count
          ORDER BY count DESC
        `;
        const typeResult = await session.run(query, params);
        breakdown = {};
        typeResult.records.forEach((record) => {
          const category = record.get("category");
          const count = record.get("count").toNumber?.() || record.get("count");
          if (category) breakdown![category] = count;
        });
        value = Object.keys(breakdown).length;
        return { metric, value, breakdown };

      case ReportMetric.PLAYERS_AFFECTED:
        query = `
          ${baseQuery}
          MATCH (i)-[:AFFECTS]->(p:Player)
          RETURN count(DISTINCT p) AS value
        `;
        break;

      case ReportMetric.REINJURY_RATE:
        query = `
          ${baseQuery}
          WITH count(i) AS total
          MATCH (ri:Injury)
          WHERE ri.status = 'Re-injured'
          ${this.buildWhereConditions({ ...params } as any).length > 0 ? "AND " + this.buildWhereConditions({ ...params } as any).join(" AND ") : ""}
          WITH total, count(ri) AS reinjured
          RETURN CASE WHEN total > 0 THEN (toFloat(reinjured) / total) * 100 ELSE 0 END AS value
        `;
        break;

      case ReportMetric.INJURIES_WITH_TREATMENT_PLAN:
        query = `
          ${baseQuery}
          AND i.treatmentPlan IS NOT NULL AND i.treatmentPlan <> ''
          RETURN count(i) AS value
        `;
        break;

      default:
        this.logger.warn(`Unsupported metric: ${metric}`);
        return null;
    }

    // Execute query for simple metrics
    if (query) {
      const result = await session.run(query, params);
      if (result.records.length > 0) {
        const rawValue = result.records[0].get("value");
        value = rawValue?.toNumber?.() || rawValue || 0;

        // Round average values to 2 decimal places
        if (metric.includes("Average") && typeof value === "number") {
          value = Math.round(value * 100) / 100;
        }
      }
    }

    return { metric, value, breakdown };
  }

  /**
   * Build WHERE conditions based on filters
   */
  private buildWhereConditions(config: ReportConfigDto): string[] {
    const conditions: string[] = [];

    if (config.statusFilter && config.statusFilter.length > 0) {
      conditions.push("i.status IN $statusFilter");
    }

    if (config.severityFilter && config.severityFilter.length > 0) {
      conditions.push("i.severity IN $severityFilter");
    }

    if (config.injuryTypeFilter && config.injuryTypeFilter.length > 0) {
      conditions.push("i.injuryType IN $injuryTypeFilter");
    }

    if (config.bodyPartFilter && config.bodyPartFilter.length > 0) {
      conditions.push("i.bodyPart IN $bodyPartFilter");
    }

    if (config.fromDate) {
      conditions.push("date(i.injuryDate) >= date($fromDate)");
    }

    if (config.toDate) {
      conditions.push("date(i.injuryDate) <= date($toDate)");
    }

    if (config.teamId) {
      conditions.push(
        "(i)-[:AFFECTS]->(:Player)-[:PLAYS_FOR]->(:Team {teamId: $teamId})",
      );
    }

    if (!config.includeTestData) {
      conditions.push("(i.isTestData IS NULL OR i.isTestData = false)");
    }

    return conditions;
  }

  /**
   * Build query parameters object
   */
  private buildQueryParams(config: ReportConfigDto): Record<string, any> {
    const params: Record<string, any> = {};

    if (config.statusFilter && config.statusFilter.length > 0) {
      params.statusFilter = config.statusFilter;
    }

    if (config.severityFilter && config.severityFilter.length > 0) {
      params.severityFilter = config.severityFilter;
    }

    if (config.injuryTypeFilter && config.injuryTypeFilter.length > 0) {
      params.injuryTypeFilter = config.injuryTypeFilter;
    }

    if (config.bodyPartFilter && config.bodyPartFilter.length > 0) {
      params.bodyPartFilter = config.bodyPartFilter;
    }

    if (config.fromDate) {
      params.fromDate = config.fromDate;
    }

    if (config.toDate) {
      params.toDate = config.toDate;
    }

    if (config.teamId) {
      params.teamId = config.teamId;
    }

    return params;
  }

  /**
   * Format report data as CSV
   */
  async exportAsCSV(report: ReportResponseDto): Promise<string> {
    let csv = "Metric,Value\n";

    report.data.forEach((item) => {
      if (item.breakdown) {
        // Add breakdown details
        Object.entries(item.breakdown).forEach(([key, val]) => {
          csv += `"${item.metric} - ${key}",${val}\n`;
        });
      } else {
        csv += `"${item.metric}",${item.value}\n`;
      }
    });

    return csv;
  }

  /**
   * Save a report configuration
   */
  async saveReport(
    dto: SaveReportDto,
    userId: string,
  ): Promise<SavedReportDto> {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const savedReport: SavedReportDto = {
      reportId,
      reportName: dto.reportName,
      description: dto.description,
      config: dto,
      createdBy: userId,
      createdAt: now,
      lastModified: now,
    };

    this.savedReports.set(reportId, savedReport);
    this.logger.log(`Report saved: ${reportId} by user ${userId}`);

    return savedReport;
  }

  /**
   * Get all saved reports
   */
  async getSavedReports(): Promise<SavedReportDto[]> {
    return Array.from(this.savedReports.values());
  }

  /**
   * Get a specific saved report
   */
  async getSavedReport(reportId: string): Promise<SavedReportDto | null> {
    return this.savedReports.get(reportId) || null;
  }

  /**
   * Delete a saved report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    return this.savedReports.delete(reportId);
  }

  /**
   * Legacy method for backwards compatibility
   */
  async generateReport(dto: ReportQueryDto) {
    const session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (i:Injury)
        WHERE ($fromDate IS NULL OR i.injuryDate >= datetime($fromDate))
          AND ($toDate IS NULL OR i.injuryDate <= datetime($toDate))
        RETURN count(i) AS injuryCount
      `;

      const res = await session.run(cypher, {
        fromDate: dto.fromDate || null,
        toDate: dto.toDate || null,
      });
      const count = res.records[0].get("injuryCount").toNumber
        ? res.records[0].get("injuryCount").toNumber()
        : res.records[0].get("injuryCount");

      if (dto.exportFormat === "csv") {
        const csv = `injuryCount\n${count}\n`;
        return { format: "csv", data: csv };
      }

      return { format: "json", data: { injuryCount: count } };
    } finally {
      await session.close();
    }
  }
}
