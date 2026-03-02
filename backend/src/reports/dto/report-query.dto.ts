export class ReportQueryDto {
  fromDate?: string;
  toDate?: string;
  teamId?: string;
  exportFormat?: 'csv' | 'json';
}
