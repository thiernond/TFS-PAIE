"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Worker,
  Team,
  FarmDomain,
  Activity,
  DailyPaymentRecord,
  CompanySettings,
  AttendanceType,
  PaymentMethod,
} from "@/types/payroll";

const DEFAULT_FARM_ID = "a0000000-0000-0000-0000-000000000001";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidUuid(val?: string | null): boolean {
  return Boolean(val && UUID_REGEX.test(val));
}

// ==============================================================================
// 1. CHARGEMENT COMPLET DES DONNÉES DEPUIS SUPABASE
// ==============================================================================

export async function fetchFarmInitialData() {
  try {
    const supabase = createAdminClient();

    // A. Récupération de la ferme (et test de connectivité rapide)
    const { data: farmData, error: farmError } = await supabase
      .from("farms")
      .select("*")
      .eq("id", DEFAULT_FARM_ID)
      .single();

    if (farmError) {
      const errMsg = `${farmError.message || ""} ${farmError.details || ""}`;
      if (
        errMsg.includes("fetch failed") ||
        errMsg.includes("ENOTFOUND") ||
        errMsg.includes("AbortError") ||
        errMsg.includes("timeout")
      ) {
        return {
          success: false,
          offline: true,
          error: "Instance Supabase hors-ligne ou non joignable (Mode Local actif)",
        };
      }
      if (farmError.code !== "PGRST116") {
        console.error("Erreur lors de la récupération de la ferme:", farmError);
      }
    }

    // B à G. Récupération parallèle des tables liées
    const [
      { data: teamsData, error: teamsError },
      { data: domainsData, error: domainsError },
      { data: activitiesData, error: activitiesError },
      { data: workersData, error: workersError },
      { data: paymentsData, error: paymentsError },
      { data: closuresData },
    ] = await Promise.all([
      supabase.from("teams").select("id, name, created_at").eq("farm_id", DEFAULT_FARM_ID),
      supabase.from("farm_domains").select("*").eq("farm_id", DEFAULT_FARM_ID),
      supabase.from("activities").select("*").eq("farm_id", DEFAULT_FARM_ID),
      supabase
        .from("workers")
        .select("*")
        .eq("farm_id", DEFAULT_FARM_ID)
        .order("created_at", { ascending: true }),
      supabase
        .from("payments")
        .select("*")
        .eq("farm_id", DEFAULT_FARM_ID)
        .order("payment_date", { ascending: false })
        .limit(50),
      supabase
        .from("daily_attendance_closures")
        .select("closure_date, is_locked")
        .eq("farm_id", DEFAULT_FARM_ID),
    ]);

    if (teamsError) console.error("Erreur équipes:", teamsError);
    if (domainsError) console.error("Erreur domaines:", domainsError);
    if (activitiesError) console.error("Erreur activités:", activitiesError);
    if (workersError) console.error("Erreur journaliers:", workersError);
    if (paymentsError) console.error("Erreur paiements:", paymentsError);

    // Transformation des équipes avec décompte
    const workersList = workersData || [];
    const teams: Team[] = (teamsData || []).map((t) => ({
      id: t.id,
      name: t.name,
      supervisorName: "Superviseur Assigné",
      workerCount: workersList.filter((w) => w.team_id === t.id).length,
    }));

    // Mappage des journaliers
    const workers: Worker[] = workersList.map((w) => {
      const team = teams.find((t) => t.id === w.team_id);
      return {
        id: w.id,
        firstName: w.first_name,
        lastName: w.last_name,
        phone: w.phone || "",
        teamId: w.team_id || "",
        teamName: team ? team.name : "Équipe Générale",
        functionTitle: w.function_title,
        domain: w.domain,
        momoOperator: w.momo_operator as PaymentMethod,
        momoNumber: w.momo_number || "",
        dailyRate: Number(w.daily_rate || 2500),
        status: w.status,
        avatarUrl: w.avatar_url || undefined,
        hiredAt: w.hired_at,
        unpaidAdvances: Number(w.unpaid_advances || 0),
      };
    });

    // Mappage des activités
    const activities: Activity[] = (activitiesData || []).map((a) => ({
      id: a.id,
      name: a.name,
      domain: a.domain_name,
      isPieceRate: Boolean(a.is_piece_rate),
      unitName: a.unit_name || "Jour",
      defaultUnitRate: Number(a.default_unit_rate || 2500),
      isActive: Boolean(a.is_active),
    }));

    // Mappage des domaines
    const domains: FarmDomain[] = (domainsData || []).map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description || "",
      surfaceArea: d.surface_area || "",
      colorBadge: d.color_badge || "#15803D",
      createdAt: d.created_at,
    }));

    // Mappage des paiements
    const payments: DailyPaymentRecord[] = (paymentsData || []).map((p) => {
      const worker = workers.find((w) => w.id === p.worker_id);
      return {
        id: p.id,
        workerId: p.worker_id,
        workerName: worker ? `${worker.firstName} ${worker.lastName}` : "Journalier",
        functionTitle: worker?.functionTitle,
        avatarUrl: worker?.avatarUrl,
        teamName: worker?.teamName || "Équipe",
        domain: worker?.domain || "Maraîchage",
        activityName: "Règlement Quinzaine",
        amount: Number(p.amount),
        paymentMethod: p.payment_method as PaymentMethod,
        transactionRef: p.transaction_ref,
        date: p.payment_date,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        daysWorked: 15,
        dailyRate: 2500,
        advanceDeducted: 0,
        status: p.status,
        type: p.payment_type,
      };
    });

    // Mappage des paramètres entreprise
    let companySettings: CompanySettings | undefined = undefined;
    if (farmData) {
      companySettings = {
        companyName: farmData.name,
        legalForm: farmData.legal_form || "Société Civile Agricole (SCA)",
        registrationNumber: farmData.registration_number || "",
        managerName: farmData.manager_name || "",
        country: farmData.country || "Sénégal",
        region: farmData.region || "Thiès / Niayes",
        address: farmData.address || "Route Nationale 2, Sébikotane",
        phone: farmData.phone || "+221 77 452 10 99",
        email: farmData.email || "direction@domaineniayes.sn",
        currency: farmData.currency || "Franc CFA (XOF)",
        standardDailyRate: Number(farmData.standard_daily_rate || 2500),
        payrollCycle: "quinzaine",
        activeOperators: farmData.active_operators || ["wave", "orange_money", "mtn_momo", "cash"],
        logoUrl: farmData.logo_url || undefined,
      };
    }

    return {
      success: true,
      workers,
      teams,
      domains,
      activities,
      payments,
      companySettings,
      closures: closuresData || [],
    };
  } catch (error: any) {
    console.error("Erreur fetchFarmInitialData:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ==============================================================================
// 2. ENREGISTREMENT D'UN NOUVEAU JOURNALIER (AVEC VALIDATION ZOD)
// ==============================================================================

const CreateWorkerSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom est requis").max(80),
  lastName: z.string().trim().min(2, "Le nom est requis").max(80),
  phone: z.string().trim().max(30).optional(),
  teamId: z.string().optional(),
  functionTitle: z.string().trim().min(2, "La fonction est obligatoire").max(100),
  domain: z.string().trim().min(2, "Le domaine est obligatoire").max(100),
  momoOperator: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
  momoNumber: z.string().trim().max(30).optional(),
  dailyRate: z.number().int().min(500, "Le taux doit être d'au moins 500 F CFA").max(500000),
  hiredAt: z.string().optional(),
});

export async function createWorkerAction(payload: z.infer<typeof CreateWorkerSchema>) {
  try {
    const validated = CreateWorkerSchema.parse(payload);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("workers")
      .insert({
        farm_id: DEFAULT_FARM_ID,
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone || "",
        team_id: isValidUuid(validated.teamId) ? validated.teamId : null,
        function_title: validated.functionTitle,
        domain: validated.domain,
        momo_operator: validated.momoOperator,
        momo_number: validated.momoNumber || "",
        daily_rate: validated.dailyRate,
        hired_at: validated.hiredAt && DATE_ISO_REGEX.test(validated.hiredAt) ? validated.hiredAt : new Date().toISOString().split("T")[0],
        status: "active",
        unpaid_advances: 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Journal d'audit
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "IMPORT_WORKERS",
      entity_type: "worker",
      entity_id: data.id,
      details: { name: `${validated.firstName} ${validated.lastName}`, role: validated.functionTitle },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur createWorkerAction:", error);
    return { success: false, error: "Impossible d'enregistrer le journalier sur le serveur." };
  }
}

export async function updateWorkerAction(
  workerId: string,
  payload: z.infer<typeof CreateWorkerSchema>
) {
  try {
    if (!isValidUuid(workerId)) return { success: false, error: "ID local" };
    const validated = CreateWorkerSchema.parse(payload);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("workers")
      .update({
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone || "",
        team_id: isValidUuid(validated.teamId) ? validated.teamId : null,
        function_title: validated.functionTitle,
        domain: validated.domain,
        momo_operator: validated.momoOperator,
        momo_number: validated.momoNumber || validated.phone || "",
        daily_rate: validated.dailyRate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workerId)
      .eq("farm_id", DEFAULT_FARM_ID)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur updateWorkerAction:", error);
    return { success: false, error: "Impossible de mettre à jour la fiche journalier." };
  }
}

// ==============================================================================
// 3. SAUVEGARDE DES POINTAGES QUOTIDIENS (SYNCHRONISATION IDEMPOTENTE)
// ==============================================================================

const AttendanceItemSchema = z.object({
  workerId: z.string().uuid(),
  type: z.enum(["full_day", "half_day", "absent", "task_piece", "overtime"]),
  activityId: z.string().optional(),
  pieceQuantity: z.number().optional(),
  pieceUnitRate: z.number().int().optional(),
  overtimeHours: z.number().optional(),
});

const SaveAttendanceBatchSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  attendances: z.array(AttendanceItemSchema),
});

export async function saveAttendanceBatchAction(payload: z.infer<typeof SaveAttendanceBatchSchema>) {
  try {
    const validated = SaveAttendanceBatchSchema.parse(payload);
    const supabase = createAdminClient();

    // 1. Vérifier si la journée est clôturée
    const { data: closure } = await supabase
      .from("daily_attendance_closures")
      .select("is_locked")
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("closure_date", validated.date)
      .maybeSingle();

    if (closure && closure.is_locked) {
      throw new Error(`La journée du ${validated.date} est clôturée. Seul le propriétaire peut la déverrouiller.`);
    }

    // 2. Préparation du lot d'upsert
    const rows = validated.attendances.map((item) => ({
      farm_id: DEFAULT_FARM_ID,
      worker_id: item.workerId,
      attendance_date: validated.date,
      attendance_type: item.type,
      activity_id: item.activityId || null,
      piece_quantity: item.pieceQuantity || 0,
      piece_unit_rate: item.pieceUnitRate || 0,
      overtime_hours: item.overtimeHours || 0,
      is_locked: false,
    }));

    const { data, error } = await supabase
      .from("attendances")
      .upsert(rows, { onConflict: "worker_id, attendance_date" })
      .select();

    if (error) throw error;

    return { success: true, count: data?.length || 0 };
  } catch (error: any) {
    console.error("Erreur saveAttendanceBatchAction:", error);
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 4. CLÔTURE ET RÉOUVERTURE DE JOURNÉE (VERROU TERRAIN & AUDIT)
// ==============================================================================

const ClosureDateSchema = z.string().regex(DATE_ISO_REGEX, "Format de date invalide (YYYY-MM-DD)");

export async function lockAttendanceDayAction(closureDate: string) {
  try {
    const validDate = ClosureDateSchema.parse(closureDate);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("daily_attendance_closures")
      .upsert({
        farm_id: DEFAULT_FARM_ID,
        closure_date: validDate,
        is_locked: true,
        locked_at: new Date().toISOString(),
      }, { onConflict: "farm_id, closure_date" })
      .select()
      .single();

    if (error) throw error;

    // Verrouiller tous les pointages de la date
    await supabase
      .from("attendances")
      .update({ is_locked: true })
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("attendance_date", validDate);

    // Audit log
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "LOCK_ATTENDANCE",
      entity_type: "closure",
      entity_id: validDate,
      details: { lockedDate: validDate },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur lockAttendanceDayAction:", error);
    return { success: false, error: "Impossible de clôturer la journée." };
  }
}

export async function unlockAttendanceDayAction(closureDate: string, reason: string) {
  try {
    const validDate = ClosureDateSchema.parse(closureDate);
    const validReason = z.string().trim().min(3).max(300).parse(reason);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("daily_attendance_closures")
      .update({
        is_locked: false,
        unlocked_at: new Date().toISOString(),
        unlock_reason: validReason,
      })
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("closure_date", validDate)
      .select()
      .single();

    if (error) throw error;

    // Déverrouiller les pointages
    await supabase
      .from("attendances")
      .update({ is_locked: false })
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("attendance_date", validDate);

    // Audit log
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "UNLOCK_ATTENDANCE",
      entity_type: "closure",
      entity_id: validDate,
      details: { unlockedDate: validDate, reason: validReason },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur unlockAttendanceDayAction:", error);
    return { success: false, error: "Impossible de déverrouiller la journée." };
  }
}

// ==============================================================================
// 5. OCTROI D'AVANCE SUR SALAIRE
// ==============================================================================

const GrantAdvanceSchema = z.object({
  workerId: z.string().uuid(),
  amount: z.number().int().positive("Le montant d'avance doit être supérieur à zéro").max(5000000),
  motif: z.string().trim().max(200).default("Avance sur salaire"),
  method: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
});

export async function grantAdvanceAction(payload: z.infer<typeof GrantAdvanceSchema>) {
  try {
    if (!isValidUuid(payload.workerId)) return { success: false, error: "ID local" };
    const validated = GrantAdvanceSchema.parse(payload);
    const supabase = createAdminClient();

    // 1. Insertion de l'avance
    const { data: advance, error: advError } = await supabase
      .from("advances")
      .insert({
        farm_id: DEFAULT_FARM_ID,
        worker_id: validated.workerId,
        amount: validated.amount,
        deducted_amount: 0,
        motif: validated.motif,
        disbursement_method: validated.method,
        status: "pending",
      })
      .select()
      .single();

    if (advError) throw advError;

    // 2. Mise à jour du solde d'avance de l'ouvrier (isolée par farm_id)
    const { data: worker } = await supabase
      .from("workers")
      .select("unpaid_advances")
      .eq("id", validated.workerId)
      .eq("farm_id", DEFAULT_FARM_ID)
      .single();

    const currentBalance = Number(worker?.unpaid_advances || 0);
    const newBalance = currentBalance + validated.amount;

    await supabase
      .from("workers")
      .update({ unpaid_advances: newBalance, updated_at: new Date().toISOString() })
      .eq("id", validated.workerId)
      .eq("farm_id", DEFAULT_FARM_ID);

    // 3. Piste d'audit
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "GRANT_ADVANCE",
      entity_type: "advance",
      entity_id: advance.id,
      details: { amount: validated.amount, workerId: validated.workerId },
    });

    return { success: true, advance, newBalance };
  } catch (error: any) {
    console.error("Erreur grantAdvanceAction:", error);
    return { success: false, error: "Impossible d'enregistrer l'avance sur le serveur." };
  }
}

// ==============================================================================
// 6. ENREGISTREMENT D'UN PAIEMENT
// ==============================================================================

const RecordPaymentSchema = z.object({
  workerId: z.string().uuid(),
  amount: z.number().int().min(0).max(50000000),
  advanceDeducted: z.number().int().min(0).max(50000000).optional(),
  paymentMethod: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
  transactionRef: z.string().trim().min(1).max(100),
  periodStart: z.string().regex(DATE_ISO_REGEX),
  periodEnd: z.string().regex(DATE_ISO_REGEX),
  paymentType: z.enum(["daily_wage", "piece_rate", "advance_payout", "payroll_settlement"]),
});

export async function recordPaymentAction(payload: z.infer<typeof RecordPaymentSchema>) {
  try {
    if (!isValidUuid(payload.workerId)) return { success: false, error: "ID local" };
    const validated = RecordPaymentSchema.parse(payload);
    const supabase = createAdminClient();

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        farm_id: DEFAULT_FARM_ID,
        worker_id: validated.workerId,
        amount: validated.amount,
        payment_method: validated.paymentMethod,
        transaction_ref: validated.transactionRef,
        period_start: validated.periodStart,
        period_end: validated.periodEnd,
        payment_type: validated.paymentType,
        status: "paid",
      })
      .select()
      .single();

    if (error) throw error;

    // Si une avance a été déduite sur cette paie, mettre à jour le solde de l'ouvrier dans Supabase
    if (validated.advanceDeducted && validated.advanceDeducted > 0) {
      const { data: worker } = await supabase
        .from("workers")
        .select("unpaid_advances")
        .eq("id", validated.workerId)
        .eq("farm_id", DEFAULT_FARM_ID)
        .single();

      const currentBalance = Number(worker?.unpaid_advances || 0);
      const nextBalance = Math.max(0, currentBalance - validated.advanceDeducted);

      await supabase
        .from("workers")
        .update({ unpaid_advances: nextBalance, updated_at: new Date().toISOString() })
        .eq("id", validated.workerId)
        .eq("farm_id", DEFAULT_FARM_ID);
    }

    // Piste d'audit
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "PAYMENT_RECORDED",
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        amount: validated.amount,
        advanceDeducted: validated.advanceDeducted || 0,
        method: validated.paymentMethod,
        tx: validated.transactionRef,
      },
    });

    return { success: true, payment };
  } catch (error: any) {
    console.error("Erreur recordPaymentAction:", error);
    return { success: false, error: "Impossible d'enregistrer le paiement sur le serveur." };
  }
}

// ==============================================================================
// 7. MISE À JOUR DES PARAMÈTRES EXPLOITATION (AVEC VALIDATION ZOD)
// ==============================================================================

const CompanySettingsSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  legalForm: z.string().trim().max(120),
  registrationNumber: z.string().trim().max(80),
  managerName: z.string().trim().max(100),
  country: z.string().trim().max(80),
  region: z.string().trim().max(100),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(120),
  currency: z.string().trim().max(40),
  standardDailyRate: z.number().int().min(500).max(500000),
  payrollCycle: z.enum(["quinzaine", "mensuel", "hebdomadaire"]),
  activeOperators: z.array(z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"])),
  logoUrl: z.string().max(2500000).optional(),
});

export async function updateCompanySettingsAction(settings: CompanySettings) {
  try {
    const validated = CompanySettingsSchema.parse(settings);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("farms")
      .update({
        name: validated.companyName,
        legal_form: validated.legalForm,
        registration_number: validated.registrationNumber,
        manager_name: validated.managerName,
        country: validated.country,
        region: validated.region,
        address: validated.address,
        phone: validated.phone,
        email: validated.email,
        currency: validated.currency,
        standard_daily_rate: validated.standardDailyRate,
        payroll_cycle: validated.payrollCycle,
        active_operators: validated.activeOperators,
        logo_url: validated.logoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", DEFAULT_FARM_ID)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "UPDATE_SETTINGS",
      entity_type: "farm",
      entity_id: DEFAULT_FARM_ID,
      details: { name: validated.companyName },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur updateCompanySettingsAction:", error);
    return { success: false, error: "Impossible de sauvegarder les paramètres sur le serveur." };
  }
}

// ==============================================================================
// 8. IMPORT EN LOT ET ARCHIVAGE DES JOURNALIERS
// ==============================================================================

const ImportWorkerItemSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80),
  phone: z.string().trim().max(30).optional(),
  teamId: z.string().optional(),
  functionTitle: z.string().trim().max(100).optional(),
  domain: z.string().trim().max(100).optional(),
  momoOperator: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]).optional(),
  momoNumber: z.string().trim().max(30).optional(),
  dailyRate: z.number().int().min(500).max(500000).optional(),
  hiredAt: z.string().optional(),
  unpaidAdvances: z.number().int().min(0).optional(),
});

const ImportWorkersBatchSchema = z.array(ImportWorkerItemSchema).min(1).max(500);

export async function importWorkersBatchAction(workersList: Worker[]) {
  try {
    const validatedList = ImportWorkersBatchSchema.parse(workersList);
    const supabase = createAdminClient();

    const rows = validatedList.map((w) => ({
      farm_id: DEFAULT_FARM_ID,
      first_name: w.firstName,
      last_name: w.lastName,
      phone: w.phone || "",
      team_id: isValidUuid(w.teamId) ? w.teamId : null,
      function_title: w.functionTitle || "Journalier Polyvalent",
      domain: w.domain || "Maraîchage",
      momo_operator: w.momoOperator || "wave",
      momo_number: w.momoNumber || w.phone || "",
      daily_rate: Math.round(w.dailyRate || 2500),
      hired_at: w.hiredAt && DATE_ISO_REGEX.test(w.hiredAt) ? w.hiredAt : new Date().toISOString().split("T")[0],
      status: "active",
      unpaid_advances: Math.round(w.unpaidAdvances || 0),
    }));

    const { data, error } = await supabase
      .from("workers")
      .insert(rows)
      .select();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "IMPORT_WORKERS",
      entity_type: "worker_batch",
      entity_id: DEFAULT_FARM_ID,
      details: { importedCount: data?.length || 0 },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur importWorkersBatchAction:", error);
    return { success: false, error: "Impossible d'importer le lot sur le serveur." };
  }
}

export async function deleteWorkerAction(workerId: string) {
  try {
    if (!isValidUuid(workerId)) return { success: false, error: "ID local" };
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("workers")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", workerId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteWorkerAction:", error);
    return { success: false, error: "Impossible d'archiver ce journalier." };
  }
}

// ==============================================================================
// 9. GESTION DES ACTIVITÉS ET DOMAINES AGRICOLES
// ==============================================================================

const SaveActivitySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  domain: z.string().trim().min(2).max(120),
  isPieceRate: z.boolean(),
  unitName: z.string().trim().max(60),
  defaultUnitRate: z.number().int().min(0).max(500000),
  isActive: z.boolean(),
});

export async function saveActivityAction(payload: z.infer<typeof SaveActivitySchema>) {
  try {
    const validated = SaveActivitySchema.parse(payload);
    const supabase = createAdminClient();

    const row: Record<string, any> = {
      farm_id: DEFAULT_FARM_ID,
      name: validated.name,
      domain_name: validated.domain,
      is_piece_rate: validated.isPieceRate,
      unit_name: validated.unitName,
      default_unit_rate: validated.defaultUnitRate,
      is_active: validated.isActive,
    };

    if (isValidUuid(validated.id)) {
      row.id = validated.id;
    }

    const { data, error } = await supabase
      .from("activities")
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur saveActivityAction:", error);
    return { success: false, error: "Impossible d'enregistrer l'activité." };
  }
}

export async function deleteActivityAction(activityId: string) {
  try {
    if (!isValidUuid(activityId)) return { success: false, error: "ID local" };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteActivityAction:", error);
    return { success: false, error: "Impossible de supprimer l'activité." };
  }
}

const SaveDomainSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(1).max(20),
  description: z.string().trim().max(300).optional(),
  surfaceArea: z.string().trim().max(50).optional(),
  colorBadge: z.string().trim().max(30).optional(),
});

export async function saveDomainAction(payload: z.infer<typeof SaveDomainSchema>) {
  try {
    const validated = SaveDomainSchema.parse(payload);
    const supabase = createAdminClient();

    const row: Record<string, any> = {
      farm_id: DEFAULT_FARM_ID,
      name: validated.name,
      code: validated.code,
      description: validated.description || "",
      surface_area: validated.surfaceArea || "",
      color_badge: validated.colorBadge || "#15803D",
    };

    if (isValidUuid(validated.id)) {
      row.id = validated.id;
    }

    const { data, error } = await supabase
      .from("farm_domains")
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur saveDomainAction:", error);
    return { success: false, error: "Impossible d'enregistrer le domaine agricole." };
  }
}

export async function deleteDomainAction(domainId: string) {
  try {
    if (!isValidUuid(domainId)) return { success: false, error: "ID local" };
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("farm_domains")
      .delete()
      .eq("id", domainId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteDomainAction:", error);
    return { success: false, error: "Impossible de supprimer le domaine agricole." };
  }
}

// ==============================================================================
// 10. REMBOURSEMENT D'AVANCE & SUPPRESSION DE PAIEMENT
// ==============================================================================

const SettleAdvanceSchema = z.object({
  workerId: z.string().uuid(),
  amountToSettle: z.number().int().positive().max(50000000),
});

export async function settleAdvanceAction(workerId: string, amountToSettle: number) {
  try {
    if (!isValidUuid(workerId)) return { success: false, error: "ID local" };
    const validated = SettleAdvanceSchema.parse({ workerId, amountToSettle: Math.round(amountToSettle) });
    const supabase = createAdminClient();

    const { data: worker } = await supabase
      .from("workers")
      .select("unpaid_advances")
      .eq("id", validated.workerId)
      .eq("farm_id", DEFAULT_FARM_ID)
      .single();

    const currentBalance = Number(worker?.unpaid_advances || 0);
    const newBalance = Math.max(0, currentBalance - validated.amountToSettle);

    const { error } = await supabase
      .from("workers")
      .update({ unpaid_advances: newBalance, updated_at: new Date().toISOString() })
      .eq("id", validated.workerId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "ADJUST_PAYSLIP",
      entity_type: "advance_settlement",
      entity_id: validated.workerId,
      details: { settledAmount: validated.amountToSettle, newBalance },
    });

    return { success: true, newBalance };
  } catch (error: any) {
    console.error("Erreur settleAdvanceAction:", error);
    return { success: false, error: "Impossible d'enregistrer le remboursement d'avance." };
  }
}

export async function deletePaymentAction(paymentId: string) {
  try {
    if (!isValidUuid(paymentId)) return { success: false, error: "ID local" };
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "PAYMENT_RECORDED",
      entity_type: "payment_deleted",
      entity_id: paymentId,
      details: { deletedPaymentId: paymentId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erreur deletePaymentAction:", error);
    return { success: false, error: "Impossible de supprimer ce paiement." };
  }
}
