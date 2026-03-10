# Report Builder Feature

## Overview

The Report Builder is an MVP implementation inspired by the Ventrata reporting system. It provides a flexible, dynamic reporting interface for analyzing injury data in the Multi-Sport Athlete Injury Surveillance System.

![Report Builder Interface](../attachments/report-builder-example.png)

## Features

### 🎯 Core Capabilities

- **Dynamic Metric Selection**: Choose from 15+ injury-related metrics
- **Flexible Filtering**: Filter by status, severity, injury type, body part, date range, and more
- **Aggregate Functions**: Apply Count, Total, Average, Minimum, or Maximum functions
- **Data Breakdown**: View detailed breakdowns for categorical metrics
- **Export Options**: Export reports as JSON or CSV
- **Real-time Generation**: Generate reports on-demand with current data

### 📊 Available Metrics

#### Injury Counts

- Injury Count
- Active Injuries
- Recovered Injuries
- Chronic Injuries

#### Recovery Analysis

- Average Recovery Days
- Total Recovery Days
- Minimum Recovery Days
- Maximum Recovery Days

#### Severity Breakdown

- Minor Injuries Count
- Moderate Injuries Count
- Severe Injuries Count
- Critical Injuries Count

#### Distribution Analysis

- Injuries by Body Part (with breakdown)
- Injuries by Type (with breakdown)

#### Player & Treatment Metrics

- Players Affected
- Re-injury Rate
- Injuries with Treatment Plan

### 🔍 Filter Options

| Filter Type     | Options                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Active, Recovering, Recovered, Chronic, Re-injured                                                                      |
| **Severity**    | Minor, Moderate, Severe, Critical                                                                                       |
| **Injury Type** | Muscle Strain, Ligament Sprain, Tendon Injury, Fracture, Dislocation, Concussion, Contusion, Laceration, Overuse Injury |
| **Body Part**   | Knee, Ankle, Shoulder, Hip, Lower Back, Hamstring, Wrist, Elbow, and more                                               |
| **Date Range**  | From/To date filters                                                                                                    |
| **Options**     | Include/Exclude test data                                                                                               |

### ⚡ Aggregate Functions

- **Count**: Count the number of records
- **Total**: Sum of values
- **Average**: Mean value (rounded to 2 decimal places)
- **Minimum**: Smallest value
- **Maximum**: Largest value

## Architecture

### Backend Components

#### DTOs (`backend/src/reports/dto/report-builder.dto.ts`)

```typescript
// Key interfaces
- ReportConfigDto: Report configuration and filters
- ReportResponseDto: Generated report data
- SaveReportDto: Save report configurations
- SavedReportDto: Saved report metadata
- ReportMetric: Available metrics enum
- AggregateFunction: Available functions enum
```

#### Service (`backend/src/reports/reports.service.ts`)

Key methods:

- `buildReport(config)`: Generate a report based on configuration
- `calculateMetric()`: Calculate individual metrics with Neo4j queries
- `buildWhereConditions()`: Build dynamic query filters
- `exportAsCSV()`: Convert report to CSV format
- `saveReport()`: Save report configurations
- `getSavedReports()`: Retrieve saved reports

#### Controller (`backend/src/reports/reports.controller.ts`)

API endpoints:

- `POST /reports/build`: Generate a report
- `POST /reports/save`: Save a report configuration
- `GET /reports/saved`: List all saved reports
- `GET /reports/saved/:id`: Get a specific saved report
- `POST /reports/saved/:id/generate`: Run a saved report
- `DELETE /reports/saved/:id`: Delete a saved report

### Frontend Components

#### Report Builder Page (`web/admin-dashboard/app/dashboard/reports/page.tsx`)

- **Left Panel**: Filters and configuration
  - Status filters (multi-select buttons)
  - Severity filters (multi-select buttons)
  - Injury type filters (multi-select buttons)
  - Body part filters (multi-select buttons)
  - Date range picker
  - Include test data checkbox
  - Aggregate function radio buttons
  - Metric selection checkboxes

- **Right Panel**: Report results
  - Report metadata (total records, timestamp, function, metrics count)
  - Metric cards with values
  - Breakdown details for categorical metrics
  - Export to CSV button

#### API Client (`web/admin-dashboard/lib/api.ts`)

Methods:

- `buildReport(config)`: Generate report
- `saveReport(data)`: Save configuration
- `getSavedReports()`: List saved reports
- `generateFromSavedReport(id)`: Run saved report
- `deleteReport(id)`: Delete saved report

## Usage

### Accessing the Report Builder

1. Log in to the Admin Dashboard
2. Click the "📊 Report Builder" button in the header
3. Or navigate to `/dashboard/reports`

### Building a Report

#### Step 1: Select Filters (Optional)

Choose any combination of filters:

- Click status badges (e.g., Active, Recovering)
- Select severity levels
- Pick injury types
- Choose body parts
- Set date range
- Toggle "Include Test Data"

#### Step 2: Choose Aggregate Function

Select how to aggregate the data:

- **Count**: Most common, counts matching records
- **Average**: For time-based metrics (recovery days)
- **Total**: Sum of values
- **Minimum/Maximum**: For range analysis

#### Step 3: Select Metrics

Check one or more metrics to display:

- Simple counts (e.g., "Active Injuries")
- Time analysis (e.g., "Average Recovery Days")
- Categorical breakdowns (e.g., "Injuries by Body Part")

#### Step 4: Generate Report

Click "Generate Report" to run the analysis.

### Example Reports

#### Basic Injury Count

```typescript
Config: {
  metrics: ["Injury Count"],
  aggregateFunction: "Count",
  statusFilter: ["Active"],
  fromDate: "2024-01-01",
  toDate: "2024-12-31"
}
```

#### Recovery Time Analysis

```typescript
Config: {
  metrics: ["Average Recovery Days", "Min Recovery Days", "Max Recovery Days"],
  aggregateFunction: "Average",
  severityFilter: ["Moderate", "Severe"],
  statusFilter: ["Recovered"]
}
```

#### Body Part Distribution

```typescript
Config: {
  metrics: ["Injuries by Body Part"],
  aggregateFunction: "Count",
  fromDate: "2024-01-01"
}
```

### Exporting Reports

Once a report is generated:

1. **JSON Format**: Default format, view in browser
2. **CSV Export**: Click "Download CSV" to download a spreadsheet

CSV format includes:

- One row per metric
- Breakdown details as separate rows (e.g., "Injuries by Body Part - Knee")

## API Reference

### Build Report

```http
POST /reports/build
Authorization: Bearer <token>
Content-Type: application/json

{
  "metrics": ["Injury Count", "Average Recovery Days"],
  "aggregateFunction": "Count",
  "statusFilter": ["Active", "Recovering"],
  "severityFilter": ["Moderate", "Severe"],
  "fromDate": "2024-01-01",
  "toDate": "2024-12-31",
  "includeTestData": false,
  "exportFormat": "json"
}
```

Response:

```json
{
  "generatedAt": "2024-03-10T10:30:00.000Z",
  "filters": {
    "status": ["Active", "Recovering"],
    "severity": ["Moderate", "Severe"],
    "fromDate": "2024-01-01",
    "toDate": "2024-12-31"
  },
  "aggregateFunction": "Count",
  "data": [
    {
      "metric": "Injury Count",
      "value": 23
    },
    {
      "metric": "Average Recovery Days",
      "value": 14.5
    }
  ],
  "totalRecords": 23,
  "format": "json"
}
```

### Save Report Configuration

```http
POST /reports/save
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportName": "Monthly Active Injuries",
  "description": "Track active injuries each month",
  "metrics": ["Active Injuries", "Injuries by Type"],
  "aggregateFunction": "Count",
  "statusFilter": ["Active"]
}
```

### Get Saved Reports

```http
GET /reports/saved
Authorization: Bearer <token>
```

### Generate from Saved Report

```http
POST /reports/saved/:reportId/generate
Authorization: Bearer <token>
```

## Technical Details

### Database Queries

The service builds dynamic Neo4j Cypher queries based on filters:

```cypher
MATCH (i:Injury)
WHERE i.status IN ['Active', 'Recovering']
  AND i.severity IN ['Moderate', 'Severe']
  AND date(i.injuryDate) >= date('2024-01-01')
  AND date(i.injuryDate) <= date('2024-12-31')
  AND (i.isTestData IS NULL OR i.isTestData = false)
RETURN count(i) AS value
```

### Permissions

- **Admin**: Full access to all report features
- **Coach**: Can build and save reports
- **Player/Parent**: No access

### Storage

Currently, saved reports are stored in-memory. For production:

- Migrate to PostgreSQL or Neo4j for persistence
- Add user-specific report ownership
- Implement sharing permissions

## Future Enhancements

### Phase 2 Features

- [ ] Excel export with formatting
- [ ] Scheduled reports (daily, weekly, monthly)
- [ ] Email report delivery
- [ ] Report templates library
- [ ] Visual charts and graphs
- [ ] Comparative analysis (time periods)
- [ ] Custom calculated fields

### Phase 3 Features

- [ ] Dashboard widgets from saved reports
- [ ] Public report sharing links
- [ ] Report versioning
- [ ] Advanced filtering (AND/OR logic)
- [ ] Pivot table builder
- [ ] Print-optimized layouts

## Testing

### Manual Testing Checklist

- [ ] Generate report with single metric
- [ ] Generate report with multiple metrics
- [ ] Apply each filter type individually
- [ ] Apply multiple filters combined
- [ ] Test each aggregate function
- [ ] Export as CSV
- [ ] Save report configuration
- [ ] Load and run saved report
- [ ] Delete saved report
- [ ] Test with no data (empty result)
- [ ] Test with date range filters
- [ ] Verify breakdown data for categorical metrics

### Sample Test Data

Ensure your database has:

- Injuries with various statuses
- Injuries with different severities
- Injuries across multiple body parts
- Injuries of different types
- Some recovered injuries with return dates
- Test data flagged appropriately

## Troubleshooting

### "The report did not contain any data"

**Causes:**

- Filters too restrictive (no matching records)
- No injuries in database
- Date range excludes all data
- Test data excluded but only test data exists

**Solutions:**

- Remove some filters
- Check date range
- Enable "Include Test Data"
- Verify database has injury data

### Metrics showing 0 or unexpected values

**Check:**

- Are filters excluding data?
- Does the metric require specific fields? (e.g., Recovery Days needs actualReturnDate)
- Is the aggregate function appropriate for the metric?

### CSV export not working

- Ensure browser allows downloads
- Check popup blocker settings
- Verify backend returns CSV format correctly

## Contributing

When adding new metrics:

1. Add to `ReportMetric` enum in backend DTO
2. Implement calculation in `calculateMetric()` method
3. Add to frontend `availableMetrics` array
4. Update this documentation
5. Add test cases

## Support

For issues or questions:

- Check application logs (backend and frontend)
- Review Neo4j query logs
- Verify authentication and permissions
- Check network requests in browser DevTools

---

**Version**: 1.0.0 (MVP)  
**Last Updated**: March 10, 2026  
**Status**: Ready for Production
