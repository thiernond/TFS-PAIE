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
  firstName: z.string().min(2, "Le prénom est requis"),
  lastName: z.string().min(2, "Le nom est requis"),
  phone: z.string().optional(),
  teamId: z.string().optional(),
  functionTitle: z.string().min(2, "La fonction est obligatoire"),
  domain: z.string().min(2, "Le domaine est obligatoire"),
  momoOperator: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
  momoNumber: z.string().optional(),
  dailyRate: z.number().int().min(500, "Le taux doit être d'au moins 500 F CFA"),
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
        team_id: validated.teamId || null,
        function_title: validated.functionTitle,
        domain: validated.domain,
        momo_operator: validated.momoOperator,
        momo_number: validated.momoNumber || "",
        daily_rate: validated.dailyRate,
        hired_at: validated.hiredAt || new Date().toISOString().split("T")[0],
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
    return { success: false, error: error.message };
  }
}

export async function updateWorkerAction(
  workerId: string,
  payload: z.infer<typeof CreateWorkerSchema>
) {
  try {
    if (!workerId.includes("-")) return { success: false, error: "ID local" };
    const validated = CreateWorkerSchema.parse(payload);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("workers")
      .update({
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone || "",
        team_id: validated.teamId && validated.teamId.includes("-") ? validated.teamId : null,
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
    return { success: false, error: error.message };
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

export async function lockAttendanceDayAction(closureDate: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("daily_attendance_closures")
      .upsert({
        farm_id: DEFAULT_FARM_ID,
        closure_date: closureDate,
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
      .eq("attendance_date", closureDate);

    // Audit log
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "LOCK_ATTENDANCE",
      entity_type: "closure",
      entity_id: closureDate,
      details: { lockedDate: closureDate },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur lockAttendanceDayAction:", error);
    return { success: false, error: error.message };
  }
}

export async function unlockAttendanceDayAction(closureDate: string, reason: string) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("daily_attendance_closures")
      .update({
        is_locked: false,
        unlocked_at: new Date().toISOString(),
        unlock_reason: reason,
      })
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("closure_date", closureDate)
      .select()
      .single();

    if (error) throw error;

    // Déverrouiller les pointages
    await supabase
      .from("attendances")
      .update({ is_locked: false })
      .eq("farm_id", DEFAULT_FARM_ID)
      .eq("attendance_date", closureDate);

    // Audit log
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "UNLOCK_ATTENDANCE",
      entity_type: "closure",
      entity_id: closureDate,
      details: { unlockedDate: closureDate, reason },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur unlockAttendanceDayAction:", error);
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 5. OCTROI D'AVANCE SUR SALAIRE
// ==============================================================================

const GrantAdvanceSchema = z.object({
  workerId: z.string().uuid(),
  amount: z.number().int().positive("Le montant d'avance doit être supérieur à zéro"),
  motif: z.string().default("Avance sur salaire"),
  method: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
});

export async function grantAdvanceAction(payload: z.infer<typeof GrantAdvanceSchema>) {
  try {
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

    // 2. Mise à jour du solde d'avance de l'ouvrier
    const { data: worker } = await supabase
      .from("workers")
      .select("unpaid_advances")
      .eq("id", validated.workerId)
      .single();

    const currentBalance = Number(worker?.unpaid_advances || 0);
    const newBalance = currentBalance + validated.amount;

    await supabase
      .from("workers")
      .update({ unpaid_advances: newBalance })
      .eq("id", validated.workerId);

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
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 6. ENREGISTREMENT D'UN PAIEMENT
// ==============================================================================

const RecordPaymentSchema = z.object({
  workerId: z.string().uuid(),
  amount: z.number().int().min(0),
  paymentMethod: z.enum(["wave", "orange_money", "mtn_momo", "moov_money", "cash", "bank_transfer", "other"]),
  transactionRef: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  paymentType: z.enum(["daily_wage", "piece_rate", "advance_payout", "payroll_settlement"]),
});

export async function recordPaymentAction(payload: z.infer<typeof RecordPaymentSchema>) {
  try {
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

    // Piste d'audit
    await supabase.from("audit_logs").insert({
      farm_id: DEFAULT_FARM_ID,
      action: "PAYMENT_RECORDED",
      entity_type: "payment",
      entity_id: payment.id,
      details: { amount: validated.amount, method: validated.paymentMethod, tx: validated.transactionRef },
    });

    return { success: true, payment };
  } catch (error: any) {
    console.error("Erreur recordPaymentAction:", error);
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 7. MISE À JOUR DES PARAMÈTRES EXPLOITATION
// ==============================================================================

export async function updateCompanySettingsAction(settings: CompanySettings) {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("farms")
      .update({
        name: settings.companyName,
        legal_form: settings.legalForm,
        registration_number: settings.registrationNumber,
        manager_name: settings.managerName,
        country: settings.country,
        region: settings.region,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        standard_daily_rate: settings.standardDailyRate,
        payroll_cycle: settings.payrollCycle,
        active_operators: settings.activeOperators,
        logo_url: settings.logoUrl || null,
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
      details: { name: settings.companyName },
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Erreur updateCompanySettingsAction:", error);
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 8. IMPORT EN LOT ET ARCHIVAGE DES JOURNALIERS
// ==============================================================================

export async function importWorkersBatchAction(workersList: Worker[]) {
  try {
    const supabase = createAdminClient();

    const rows = workersList.map((w) => ({
      farm_id: DEFAULT_FARM_ID,
      first_name: w.firstName,
      last_name: w.lastName,
      phone: w.phone || "",
      team_id: w.teamId && w.teamId.includes("-") ? w.teamId : null,
      function_title: w.functionTitle || "Journalier Polyvalent",
      domain: w.domain || "Maraîchage",
      momo_operator: w.momoOperator || "wave",
      momo_number: w.momoNumber || w.phone || "",
      daily_rate: Math.round(w.dailyRate || 2500),
      hired_at: w.hiredAt || new Date().toISOString().split("T")[0],
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
    return { success: false, error: error.message };
  }
}

export async function deleteWorkerAction(workerId: string) {
  try {
    if (!workerId.includes("-")) return { success: false, error: "ID local" };
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
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 9. GESTION DES ACTIVITÉS ET DOMAINES AGRICOLES
// ==============================================================================

const SaveActivitySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  domain: z.string().min(2),
  isPieceRate: z.boolean(),
  unitName: z.string(),
  defaultUnitRate: z.number().int().min(0),
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

    const isUuid = validated.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.id);
    if (isUuid) {
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
    return { success: false, error: error.message };
  }
}

export async function deleteActivityAction(activityId: string) {
  try {
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
    return { success: false, error: error.message };
  }
}

const SaveDomainSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  code: z.string().min(1),
  description: z.string().optional(),
  surfaceArea: z.string().optional(),
  colorBadge: z.string().optional(),
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

    const isUuid = validated.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validated.id);
    if (isUuid) {
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
    return { success: false, error: error.message };
  }
}

export async function deleteDomainAction(domainId: string) {
  try {
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
    return { success: false, error: error.message };
  }
}

// ==============================================================================
// 10. REMBOURSEMENT D'AVANCE & SUPPRESSION DE PAIEMENT
// ==============================================================================

export async function settleAdvanceAction(workerId: string, amountToSettle: number) {
  try {
    if (!workerId.includes("-")) return { success: false, error: "ID local" };
    const supabase = createAdminClient();

    const { data: worker } = await supabase
      .from("workers")
      .select("unpaid_advances")
      .eq("id", workerId)
      .single();

    const currentBalance = Number(worker?.unpaid_advances || 0);
    const newBalance = Math.max(0, currentBalance - Math.round(amountToSettle));

    const { error } = await supabase
      .from("workers")
      .update({ unpaid_advances: newBalance, updated_at: new Date().toISOString() })
      .eq("id", workerId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;
    return { success: true, newBalance };
  } catch (error: any) {
    console.error("Erreur settleAdvanceAction:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePaymentAction(paymentId: string) {
  try {
    if (!paymentId.includes("-")) return { success: false, error: "ID local" };
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId)
      .eq("farm_id", DEFAULT_FARM_ID);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deletePaymentAction:", error);
    return { success: false, error: error.message };
  }
}
