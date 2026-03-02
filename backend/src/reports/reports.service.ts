import { Injectable, Inject } from '@nestjs/common';
import { ReportQueryDto } from './dto/report-query.dto';
import { Driver } from 'neo4j-driver';

@Injectable()
export class ReportsService {
  constructor(@Inject('NEO4J_DRIVER') private readonly neo4jDriver: Driver) {}

  async generateReport(dto: ReportQueryDto) {
    // Minimal implementation: return counts and a simple CSV/JSON placeholder
    const session = this.neo4jDriver.session();
    try {
      const cypher = `
        MATCH (i:Injury)
        WHERE ($fromDate IS NULL OR i.injuryDate >= datetime($fromDate))
          AND ($toDate IS NULL OR i.injuryDate <= datetime($toDate))
        RETURN count(i) AS injuryCount
      `;

      const res = await session.run(cypher, { fromDate: dto.fromDate || null, toDate: dto.toDate || null });
      const count = res.records[0].get('injuryCount').toNumber ? res.records[0].get('injuryCount').toNumber() : res.records[0].get('injuryCount');

      if (dto.exportFormat === 'csv') {
        const csv = `injuryCount\n${count}\n`;
        return { format: 'csv', data: csv };
      }

      return { format: 'json', data: { injuryCount: count } };
    } finally {
      await session.close();
    }
  }
}
