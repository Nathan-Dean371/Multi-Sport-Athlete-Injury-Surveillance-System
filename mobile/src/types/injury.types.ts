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

export interface CreateInjuryDto {
  playerId: string;
  injuryType: InjuryType;
  bodyPart: BodyPart;
  side: Side;
  severity: Severity;
  injuryDate: string;
  mechanism?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  expectedReturnDate?: string;
  notes?: string;
}

export interface UpdateInjuryDto {
  injuryType?: InjuryType;
  bodyPart?: BodyPart;
  side?: Side;
  severity?: Severity;
  status?: InjuryStatus;
  statusNote?: string;
  mechanism?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  notes?: string;
}

export interface ResolveInjuryDto {
  actualReturnDate: string;
  notes?: string;
}

export interface InjuryDto {
  injuryId: string;
  injuryType: InjuryType;
  bodyPart: BodyPart;
  side: Side;
  severity: Severity;
  status: InjuryStatus;
  injuryDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  mechanism?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  diagnosedDate?: string;
  reportedBy?: string;
}

export interface InjuryDetailDto {
  injuryId: string;
  injuryType: InjuryType;
  bodyPart: BodyPart;
  side: Side;
  severity: Severity;
  status: InjuryStatus;
  injuryDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  mechanism?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  player?: {
    playerId: string;
    pseudonymId: string;
    firstName?: string;
    lastName?: string;
    diagnosedDate: string;
    reportedBy: string;
  };
  statusUpdates?: Array<{
    updateId: string;
    status: string;
    notes?: string;
    recordedBy: string;
    recordedAt: string;
  }>;
}

export interface PaginatedInjuriesDto {
  data: InjuryDetailDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface QueryInjuriesDto {
  playerId?: string;
  status?: InjuryStatus;
  severity?: Severity;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PlayerInjuriesDto {
  playerId: string;
  playerName: string;
  injuries: InjuryDto[];
  total: number;
}
