/**
 * Shared TypeScript types for injury management
 * Used across mobile, web, and backend applications
 */

// ===========================
// Enums
// ===========================

export enum InjuryType {
  MUSCLE_STRAIN = 'Muscle Strain',
  LIGAMENT_SPRAIN = 'Ligament Sprain',
  TENDON_INJURY = 'Tendon Injury',
  FRACTURE = 'Fracture',
  DISLOCATION = 'Dislocation',
  CONCUSSION = 'Concussion',
  CONTUSION = 'Contusion',
  LACERATION = 'Laceration',
  OVERUSE = 'Overuse Injury',
  OTHER = 'Other',
}

export enum BodyPart {
  HEAD = 'Head',
  NECK = 'Neck',
  SHOULDER = 'Shoulder',
  UPPER_ARM = 'Upper Arm',
  ELBOW = 'Elbow',
  FOREARM = 'Forearm',
  WRIST = 'Wrist',
  HAND = 'Hand',
  FINGER = 'Finger',
  CHEST = 'Chest',
  RIBS = 'Ribs',
  UPPER_BACK = 'Upper Back',
  LOWER_BACK = 'Lower Back',
  ABDOMEN = 'Abdomen',
  HIP = 'Hip',
  GROIN = 'Groin',
  THIGH = 'Thigh',
  KNEE = 'Knee',
  LOWER_LEG = 'Lower Leg',
  ANKLE = 'Ankle',
  FOOT = 'Foot',
  TOE = 'Toe',
}

export enum Side {
  LEFT = 'Left',
  RIGHT = 'Right',
  BILATERAL = 'Bilateral',
  CENTRAL = 'Central',
}

export enum Severity {
  MINOR = 'Minor',
  MODERATE = 'Moderate',
  SEVERE = 'Severe',
  CRITICAL = 'Critical',
}

export enum InjuryStatus {
  ACTIVE = 'Active',
  RECOVERING = 'Recovering',
  RECOVERED = 'Recovered',
  CHRONIC = 'Chronic',
  RE_INJURED = 'Re-injured',
}

export enum InjuryMechanism {
  CONTACT = 'Contact',
  NON_CONTACT = 'Non-Contact',
  OVERUSE = 'Overuse',
  ACUTE = 'Acute',
  TRAUMATIC = 'Traumatic',
}

// ===========================
// DTOs (Data Transfer Objects)
// ===========================

/**
 * DTO for creating a new injury report
 * Used by coaches to report injuries for players
 */
export interface CreateInjuryDto {
  playerId: string;
  injuryType: InjuryType | string;
  bodyPart: BodyPart | string;
  side: Side | string;
  severity: Severity | string;
  injuryDate: string; // ISO 8601 date string
  mechanism?: InjuryMechanism | string;
  diagnosis?: string;
  treatmentPlan?: string;
  expectedReturnDate?: string; // ISO 8601 date string
  notes?: string;
}

/**
 * DTO for updating an existing injury
 */
export interface UpdateInjuryDto {
  injuryType?: InjuryType | string;
  bodyPart?: BodyPart | string;
  side?: Side | string;
  severity?: Severity | string;
  status?: InjuryStatus | string;
  statusNote?: string;
  mechanism?: InjuryMechanism | string;
  diagnosis?: string;
  treatmentPlan?: string;
  expectedReturnDate?: string; // ISO 8601 date string
  actualReturnDate?: string; // ISO 8601 date string
  notes?: string;
}

/**
 * DTO for resolving/closing an injury
 */
export interface ResolveInjuryDto {
  returnToPlayDate: string; // ISO 8601 date string
  resolutionNotes?: string;
  medicalClearance?: string;
}

// ===========================
// Response DTOs
// ===========================

/**
 * Player information in injury context
 */
export interface InjuryPlayerDto {
  playerId: string;
  pseudonymId: string;
  firstName?: string;
  lastName?: string;
  diagnosedDate: string;
  reportedBy: string;
}

/**
 * Status update for an injury
 */
export interface InjuryStatusUpdate {
  updateId: string;
  status: InjuryStatus | string;
  notes?: string;
  recordedBy: string;
  recordedAt: string; // ISO 8601 timestamp
}

/**
 * Basic injury information
 */
export interface InjuryDto {
  injuryId: string;
  injuryType: InjuryType | string;
  bodyPart: BodyPart | string;
  side: Side | string;
  severity: Severity | string;
  status: InjuryStatus | string;
  injuryDate: string; // ISO 8601 date string
  expectedReturnDate?: string; // ISO 8601 date string
  actualReturnDate?: string; // ISO 8601 date string
  mechanism?: InjuryMechanism | string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  diagnosedDate?: string; // ISO 8601 timestamp
  reportedBy?: string;
}

/**
 * Detailed injury information with related data
 */
export interface InjuryDetailDto extends InjuryDto {
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  player?: InjuryPlayerDto;
  statusUpdates?: InjuryStatusUpdate[];
}

/**
 * Query parameters for filtering injuries
 */
export interface QueryInjuriesDto {
  page?: number;
  limit?: number;
  playerId?: string;
  status?: InjuryStatus | string;
  severity?: Severity | string;
  bodyPart?: string;
  fromDate?: string; // ISO 8601 date string
  toDate?: string; // ISO 8601 date string
  sortBy?: 'injuryDate' | 'createdAt' | 'severity' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated injuries response
 */
export interface PaginatedInjuriesDto {
  data: InjuryDetailDto[];
  pagination: PaginationMetadata;
}

/**
 * Player's injury history
 */
export interface PlayerInjuriesDto {
  playerId: string;
  playerName: string;
  injuries: InjuryDto[];
  total: number;
}

// ===========================
// Report Type Specific
// ===========================

/**
 * Quick injury report form data (minimal fields)
 * Used for fast pitch-side reporting
 */
export interface QuickInjuryReportDto {
  playerId: string;
  injuryType: InjuryType | string;
  bodyPart: BodyPart | string;
  side: Side | string;
  severity: Severity | string;
  injuryDate: string; // ISO 8601 date string
  notes?: string;
}

/**
 * Detailed injury report form data (comprehensive)
 * Used for full medical reporting
 */
export interface DetailedInjuryReportDto extends QuickInjuryReportDto {
  mechanism?: InjuryMechanism | string;
  diagnosis?: string;
  treatmentPlan?: string;
  expectedReturnDate?: string; // ISO 8601 date string
}

// ===========================
// Type Guards
// ===========================

/**
 * Check if a value is a valid InjuryType
 */
export function isInjuryType(value: any): value is InjuryType {
  return Object.values(InjuryType).includes(value);
}

/**
 * Check if a value is a valid BodyPart
 */
export function isBodyPart(value: any): value is BodyPart {
  return Object.values(BodyPart).includes(value);
}

/**
 * Check if a value is a valid Severity
 */
export function isSeverity(value: any): value is Severity {
  return Object.values(Severity).includes(value);
}

/**
 * Check if a value is a valid InjuryStatus
 */
export function isInjuryStatus(value: any): value is InjuryStatus {
  return Object.values(InjuryStatus).includes(value);
}
