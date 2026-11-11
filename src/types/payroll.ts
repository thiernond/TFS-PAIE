export type PaymentMethod =
  | "wave"
  | "orange_money"
  | "mtn_momo"
  | "moov_money"
  | "cash"
  | "bank_transfer"
  | "other";

export type WorkerStatus = "active" | "inactive" | "archived";

export type AttendanceType =
  | "full_day"
  | "half_day"
  | "absent"
  | "task_piece"
  | "overtime";

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  teamId: string;
  teamName: string;
  functionTitle: string; // Ex: Récolteur, Désherbeur, Pépiniériste, Arroseur, Chauffeur, Magasinier
  domain: string; // Ex: Maraîchage, Vergers / Manguiers, Grandes Cultures, Élevage
  momoOperator: PaymentMethod;
  momoNumber: string;
  dailyRate: number; // en FCFA (par défaut 2 500 FCFA)
  status: WorkerStatus;
  avatarUrl?: string;
  hiredAt: string;
  unpaidAdvances: number; // en FCFA
}

export interface Team {
  id: string;
  name: string;
  supervisorName: string;
  workerCount: number;
}

export interface Activity {
  id: string;
  name: string;
  domain: string; // Maraîchage, Vergers, Grandes Cultures, Élevage, Général
  isPieceRate: boolean;
  unitName?: string; // ex: Caisse, Sac 50kg, Ligne, Jour
  defaultUnitRate?: number; // en FCFA
  isActive: boolean;
}

export interface FarmDomain {
  id: string;
  name: string;
  code: string;
  description?: string;
  surfaceArea?: string;
  colorBadge?: string;
  createdAt?: string;
}

export interface DailyPaymentRecord {
  id: string;
  workerId: string;
  workerName: string;
  functionTitle?: string;
  avatarUrl?: string;
  teamName: string;
  domain: string;
  activityName: string;
  amount: number; // en FCFA net payé
  paymentMethod: PaymentMethod;
  transactionRef: string;
  date: string; // Date du versement (YYYY-MM-DD)
  // Prise en charge de la Quinzaine (15 jours)
  periodStart: string; // Début de la quinzaine (ex: 2026-10-01)
  periodEnd: string; // Fin de la quinzaine (ex: 2026-10-15)
  daysWorked?: number; // Nombre de jours travaillés sur la quinzaine
  dailyRate?: number; // Taux journalier appliqué (ex: 2 100 FCFA)
  advanceDeducted?: number; // Montant de l'avance déduite (en FCFA)
  status: "paid" | "pending" | "failed";
  type: "daily_wage" | "piece_rate" | "advance_payout" | "payroll_settlement";
}

export interface DashboardKPIs {
  totalActiveWorkers: number;
  presentToday: number;
  halfDayToday: number;
  absentToday: number;
  totalLaborCostPeriod: number; // en FCFA
  totalPaidThisMonth: number; // en FCFA
  totalPendingAdvances: number; // en FCFA
  daysWorkedTodayPercent: number;
}

export interface ActivityCost {
  activityId: string;
  activityName: string;
  cost: number;
  percentage: number;
  color: string;
}

export interface ActionableTask {
  id: string;
  title: string;
  description: string;
  category: "attendance" | "payroll" | "advance";
  urgency: "high" | "medium" | "low";
  actionLabel: string;
  count?: number;
}

export type UserRole = "owner" | "supervisor" | "cashier";

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface CompanySettings {
  companyName: string;
  legalForm: string;
  registrationNumber: string; // NINEA / RCCM
  managerName: string;
  country: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  standardDailyRate: number; // 2500 FCFA
  payrollCycle: "quinzaine"; // Toujours la Quinzaine
  activeOperators: PaymentMethod[];
  logoUrl?: string; // Logo officiel de l'entreprise (Data URL Base64 ou URL)
}
