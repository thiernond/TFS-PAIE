"use client";

import React, { useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { HeaderBar } from "@/components/layout/header-bar";
import { FarmBanner } from "@/components/dashboard/farm-banner";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { DateFilterBar } from "@/components/dashboard/date-filter-bar";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { TodoTasks } from "@/components/dashboard/todo-tasks";
import { CostBreakdown } from "@/components/dashboard/cost-breakdown";
import { WorkersView } from "@/components/journaliers/workers-view";
import { ImportWorkersModal } from "@/components/journaliers/import-workers-modal";
import { NewPaymentModal } from "@/components/dashboard/new-payment-modal";
import { NewWorkerModal } from "@/components/dashboard/new-worker-modal";
import { ReceiptModal } from "@/components/dashboard/receipt-modal";
import { QuickAttendanceDrawer } from "@/components/dashboard/quick-attendance-drawer";
import { ActivityModal } from "@/components/activities/activity-modal";
import { ActivitiesDomainsView } from "@/components/activities/activities-domains-view";
import { SettingsView } from "@/components/settings/settings-view";
import { PointageView } from "@/components/pointage/pointage-view";
import { AvancesView } from "@/components/avances/avances-view";
import {
  mockKPIs,
  mockTeams,
  mockActivities,
  mockDomains,
  mockActivityCosts,
  mockTasks,
  mockRecentPayments,
  mockWorkersList,
  mockUsers,
  mockCompanySettings,
} from "@/lib/mock-data";
import {
  DailyPaymentRecord,
  Worker,
  AttendanceType,
  Activity,
  FarmDomain,
  AppUser,
  CompanySettings,
  PaymentMethod,
} from "@/types/payroll";
import {
  fetchFarmInitialData,
  createWorkerAction,
  updateWorkerAction,
  importWorkersBatchAction,
  deleteWorkerAction,
  saveAttendanceBatchAction,
  lockAttendanceDayAction,
  unlockAttendanceDayAction,
  grantAdvanceAction,
  settleAdvanceAction,
  recordPaymentAction,
  deletePaymentAction,
  saveActivityAction,
  deleteActivityAction,
  saveDomainAction,
  deleteDomainAction,
  updateCompanySettingsAction,
} from "@/lib/actions/farm-actions";
import { formatFCFA, getCurrentMonthBounds, getTodayISO } from "@/lib/utils/formatters";
import { exportWorkersToCsv, exportPaymentsToCsv } from "@/lib/utils/csv-export";
import { CheckCircle2, Download, PlusCircle, Wallet, Coins } from "lucide-react";

export default function AppLayout() {
  const initialBounds = getCurrentMonthBounds();
  const initialToday = getTodayISO();

  // Navigation active : "dashboard" | "journaliers" | "activites" | "paiements" | "avances" | "parametres"
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // État de connexion Supabase
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // State des données
  const [payments, setPayments] = useState<DailyPaymentRecord[]>(mockRecentPayments);
  const [workers, setWorkers] = useState<Worker[]>(mockWorkersList);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [domains, setDomains] = useState<FarmDomain[]>(mockDomains);
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(mockCompanySettings);
  const [kpis, setKpis] = useState(mockKPIs);
  const [tasks, setTasks] = useState(mockTasks);

  // State du Pointage Journalier (Taux standard 2 500 F CFA/j)
  const [attendanceDate, setAttendanceDate] = useState(initialToday);
  const [isAttendanceLocked, setIsAttendanceLocked] = useState(false);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceType>>(() => {
    const initial: Record<string, AttendanceType> = {};
    mockWorkersList.forEach((w, idx) => {
      // Distribuer statuts cohérents avec mockKPIs
      if (idx === 10 || idx === 11) {
        initial[w.id] = "half_day";
      } else if (idx === 12) {
        initial[w.id] = "absent";
      } else {
        initial[w.id] = "full_day";
      }
    });
    return initial;
  });

  // Chargement et synchronisation avec Supabase (avec fallback transparent sur localStorage)
  React.useEffect(() => {
    let isMounted = true;

    async function initSupabaseData() {
      setIsSyncing(true);
      try {
        const result = await fetchFarmInitialData();
        if (!isMounted) return;

        if (result.success) {
          setIsSupabaseConnected(true);

          if (result.workers && result.workers.length > 0) {
            setWorkers((prev) => {
              const existingIds = new Set(result.workers.map((w: Worker) => w.id));
              const localUnsynced = prev.filter((w) => !existingIds.has(w.id));
              const merged = [...result.workers, ...localUnsynced];
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("tfs_paie_workers", JSON.stringify(merged));
                } catch (e) {}
              }
              return merged;
            });
            setKpis((prev) => ({
              ...prev,
              totalActiveWorkers: result.workers.length,
            }));
          }

          if (result.domains && result.domains.length > 0) {
            setDomains(result.domains);
          }

          if (result.activities && result.activities.length > 0) {
            setActivities(result.activities);
          }

          if (result.payments && result.payments.length > 0) {
            setPayments(result.payments);
          }

          if (result.companySettings) {
            setCompanySettings(result.companySettings);
          }
        } else {
          setIsSupabaseConnected(false);
        }
      } catch (err) {
        console.warn("Connexion initiale Supabase : utilisation du cache local", err);
        if (isMounted) setIsSupabaseConnected(false);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    }

    // 1. D'abord hydrater le cache local pour un chargement instantané sans écran blanc
    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("tfs_paie_company_settings");
        if (savedCompany) {
          const parsedCompany = JSON.parse(savedCompany);
          if (parsedCompany && parsedCompany.companyName) setCompanySettings(parsedCompany);
        }

        const savedUsers = localStorage.getItem("tfs_paie_app_users");
        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0) setUsers(parsedUsers);
        }

        const savedDomains = localStorage.getItem("tfs_paie_farm_domains");
        if (savedDomains) {
          const parsedDomains = JSON.parse(savedDomains);
          if (Array.isArray(parsedDomains) && parsedDomains.length > 0) setDomains(parsedDomains);
        }

        const savedActivities = localStorage.getItem("tfs_paie_activities");
        if (savedActivities) {
          const parsedActivities = JSON.parse(savedActivities);
          if (Array.isArray(parsedActivities) && parsedActivities.length > 0) setActivities(parsedActivities);
        }

        const savedWorkers = localStorage.getItem("tfs_paie_workers");
        if (savedWorkers) {
          const parsedWorkers = JSON.parse(savedWorkers);
          if (Array.isArray(parsedWorkers) && parsedWorkers.length > 0) {
            setWorkers(parsedWorkers);
            setKpis((prev) => ({
              ...prev,
              totalActiveWorkers: parsedWorkers.length,
            }));
          }
        }

        const savedPayments = localStorage.getItem("tfs_paie_payments");
        if (savedPayments) {
          const parsedPayments = JSON.parse(savedPayments);
          if (Array.isArray(parsedPayments) && parsedPayments.length > 0) {
            setPayments(parsedPayments);
          }
        }
      } catch (e) {
        console.error("Erreur de chargement localStorage:", e);
      }
    }

    // 2. Synchroniser les données réelles de Supabase en arrière-plan
    initSupabaseData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtres
  const [startDate, setStartDate] = useState(initialBounds.monthStart);
  const [endDate, setEndDate] = useState(initialBounds.monthEnd);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modales
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isNewWorkerOpen, setIsNewWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isImportWorkersOpen, setIsImportWorkersOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);
  const [isQuickAttendanceOpen, setIsQuickAttendanceOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<DailyPaymentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtrage réactif des paiements
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;
      if (selectedTeam !== "all" && item.teamName !== selectedTeam) return false;
      if (selectedMethod !== "all" && item.paymentMethod !== selectedMethod) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = item.workerName.toLowerCase().includes(query);
        const matchesRef = item.transactionRef.toLowerCase().includes(query);
        const matchesFunction = item.functionTitle?.toLowerCase().includes(query);
        const matchesDomain = item.domain?.toLowerCase().includes(query);
        const matchesActivity = item.activityName.toLowerCase().includes(query);
        if (!matchesName && !matchesRef && !matchesFunction && !matchesDomain && !matchesActivity) {
          return false;
        }
      }

      return true;
    });
  }, [payments, startDate, endDate, selectedTeam, selectedMethod, searchQuery]);

  // Actions Paiements (Connecté à Supabase + Cache Local)
  const handleAddPayment = async (newPayment: DailyPaymentRecord) => {
    setPayments((prev) => {
      const next = [newPayment, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_payments", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (newPayment.advanceDeducted && newPayment.advanceDeducted > 0) {
      setWorkers((prev) => {
        const next = prev.map((w) =>
          w.id === newPayment.workerId
            ? { ...w, unpaidAdvances: Math.max(0, (w.unpaidAdvances || 0) - newPayment.advanceDeducted!) }
            : w
        );
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
          } catch (e) {}
        }
        return next;
      });
      setKpis((prev) => ({
        ...prev,
        totalPendingAdvances: Math.max(0, prev.totalPendingAdvances - newPayment.advanceDeducted!),
      }));
    }

    setKpis((prev) => ({
      ...prev,
      totalPaidThisMonth: prev.totalPaidThisMonth + newPayment.amount,
      totalLaborCostPeriod: prev.totalLaborCostPeriod + newPayment.amount,
    }));
    showToast(`Règlement de ${formatFCFA(newPayment.amount)} enregistré pour ${newPayment.workerName}`);

    if (isSupabaseConnected && newPayment.workerId && newPayment.workerId.includes("-")) {
      try {
        const res = await recordPaymentAction({
          workerId: newPayment.workerId,
          amount: newPayment.amount,
          paymentMethod: newPayment.paymentMethod,
          transactionRef: newPayment.transactionRef,
          periodStart: newPayment.periodStart,
          periodEnd: newPayment.periodEnd,
          paymentType: newPayment.type,
        });
        if (res.success && res.payment) {
          setPayments((prev) => prev.map((p) => (p.id === newPayment.id ? { ...p, id: res.payment.id } : p)));
          showToast(`✅ Paiement synchronisé sur Supabase (${newPayment.transactionRef}) !`);
        }
      } catch (err: any) {
        console.error("Erreur sync paiement Supabase:", err);
      }
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    const deleted = payments.find((p) => p.id === paymentId);
    setPayments((prev) => {
      const next = prev.filter((p) => p.id !== paymentId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_payments", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    if (deleted) {
      setKpis((prev) => ({
        ...prev,
        totalPaidThisMonth: Math.max(0, prev.totalPaidThisMonth - deleted.amount),
      }));
      showToast(`Paiement N° ${deleted.id} supprimé`);
    }

    if (isSupabaseConnected && paymentId.includes("-")) {
      await deletePaymentAction(paymentId);
    }
  };

  // Actions Journaliers (Connecté à Supabase + Cache Local)
  const handleAddWorker = async (newWorker: Worker) => {
    const isExisting = workers.some((w) => w.id === newWorker.id);

    setWorkers((prev) => {
      const next = isExisting
        ? prev.map((w) => (w.id === newWorker.id ? newWorker : w))
        : [newWorker, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    if (!isExisting) {
      setKpis((prev) => ({
        ...prev,
        totalActiveWorkers: prev.totalActiveWorkers + 1,
      }));
    }

    if (isExisting) {
      showToast(`Fiche de ${newWorker.firstName} ${newWorker.lastName} mise à jour !`);
      if (isSupabaseConnected && newWorker.id.includes("-")) {
        await updateWorkerAction(newWorker.id, {
          firstName: newWorker.firstName,
          lastName: newWorker.lastName,
          phone: newWorker.phone,
          teamId: newWorker.teamId,
          functionTitle: newWorker.functionTitle,
          domain: newWorker.domain,
          momoOperator: newWorker.momoOperator,
          momoNumber: newWorker.momoNumber,
          dailyRate: newWorker.dailyRate,
          hiredAt: newWorker.hiredAt,
        });
      }
      return;
    }

    if (!isSupabaseConnected) {
      showToast(`Journalier ${newWorker.firstName} ${newWorker.lastName} enregistré dans le registre !`);
      return;
    }

    showToast(`Création de ${newWorker.firstName} ${newWorker.lastName} en cours...`);
    try {
      const res = await createWorkerAction({
        firstName: newWorker.firstName,
        lastName: newWorker.lastName,
        phone: newWorker.phone,
        teamId: newWorker.teamId,
        functionTitle: newWorker.functionTitle,
        domain: newWorker.domain,
        momoOperator: newWorker.momoOperator,
        momoNumber: newWorker.momoNumber,
        dailyRate: newWorker.dailyRate,
        hiredAt: newWorker.hiredAt,
      });

      if (res.success && res.data) {
        setWorkers((prev) => {
          const next = prev.map((w) => (w.id === newWorker.id ? { ...w, id: res.data.id } : w));
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        });
        showToast(`✅ Journalier ${newWorker.firstName} ${newWorker.lastName} enregistré dans Supabase !`);
      } else {
        showToast(`Journalier enregistré localement`);
      }
    } catch (e: any) {
      showToast(`Journalier enregistré localement`);
    }
  };

  const handleDeleteWorker = async (workerId: string) => {
    const deleted = workers.find((w) => w.id === workerId);
    setWorkers((prev) => {
      const next = prev.filter((w) => w.id !== workerId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    setKpis((prev) => ({
      ...prev,
      totalActiveWorkers: Math.max(0, prev.totalActiveWorkers - 1),
    }));
    showToast(`Journalier ${deleted?.firstName} ${deleted?.lastName} archivé`);

    if (isSupabaseConnected && workerId.includes("-")) {
      await deleteWorkerAction(workerId);
    }
  };

  const handleImportWorkers = async (importedWorkers: Worker[]) => {
    setWorkers((prev) => {
      const next = [...importedWorkers, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    setKpis((prev) => ({
      ...prev,
      totalActiveWorkers: prev.totalActiveWorkers + importedWorkers.length,
    }));
    showToast(`${importedWorkers.length} journaliers importés avec succès dans le registre !`);

    if (isSupabaseConnected && importedWorkers.length > 0) {
      const res = await importWorkersBatchAction(importedWorkers);
      if (res.success) {
        showToast(`✅ ${importedWorkers.length} journaliers synchronisés dans Supabase !`);
      }
    }
  };

  const handleExportWorkers = () => {
    exportWorkersToCsv(workers, ";");
    showToast(`Export clair & détaillé de ${workers.length} journaliers téléchargé pour Excel !`);
  };

  // Actions Activités (Connecté à Supabase + Cache Local)
  const handleSaveActivity = async (activity: Activity) => {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id);
      const next = exists
        ? prev.map((a) => (a.id === activity.id ? activity : a))
        : [activity, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_activities", JSON.stringify(next));
        } catch (e) {}
      }
      showToast(
        exists
          ? `Activité "${activity.name}" modifiée avec succès`
          : `Nouvelle activité "${activity.name}" ajoutée au domaine ${activity.domain}`
      );
      return next;
    });

    if (isSupabaseConnected) {
      await saveActivityAction({
        id: activity.id,
        name: activity.name,
        domain: activity.domain,
        isPieceRate: activity.isPieceRate,
        unitName: activity.unitName,
        defaultUnitRate: activity.defaultUnitRate,
        isActive: activity.isActive,
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setActivities((prev) => {
      const next = prev.filter((a) => a.id !== activityId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_activities", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast("Activité retirée du catalogue");

    if (isSupabaseConnected && activityId.includes("-")) {
      await deleteActivityAction(activityId);
    }
  };

  // Actions Domaines (Connecté à Supabase + Cache Local)
  const handleSaveDomain = async (domain: FarmDomain) => {
    setDomains((prev) => {
      const exists = prev.some((d) => d.id === domain.id);
      const next = exists
        ? prev.map((d) => (d.id === domain.id ? domain : d))
        : [...prev, domain];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_farm_domains", JSON.stringify(next));
        } catch (e) {}
      }
      showToast(
        exists
          ? `Domaine "${domain.name}" mis à jour avec succès`
          : `Nouveau domaine agricole "${domain.name}" ajouté`
      );
      return next;
    });

    if (isSupabaseConnected) {
      await saveDomainAction({
        id: domain.id,
        name: domain.name,
        code: domain.code,
        description: domain.description,
        surfaceArea: domain.surfaceArea,
        colorBadge: domain.colorBadge,
      });
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    const deleted = domains.find((d) => d.id === domainId);
    setDomains((prev) => {
      const next = prev.filter((d) => d.id !== domainId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_farm_domains", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast(`Domaine "${deleted?.name || ''}" supprimé`);

    if (isSupabaseConnected && domainId.includes("-")) {
      await deleteDomainAction(domainId);
    }
  };

  // Actions Utilisateurs (Paramètres)
  const handleAddUser = (newUser: AppUser) => {
    setUsers((prev) => {
      const next = [newUser, ...prev];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_app_users", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast(`Utilisateur ${newUser.firstName} ${newUser.lastName} créé avec le rôle ${newUser.role}`);
  };

  const handleUpdateUser = (updatedUser: AppUser) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_app_users", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast(`Profil de ${updatedUser.firstName} ${updatedUser.lastName} mis à jour`);
  };

  const handleDeleteUser = (userId: string) => {
    const deleted = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_app_users", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
    showToast(`Utilisateur ${deleted?.firstName} ${deleted?.lastName} supprimé`);
  };

  // Actions Entreprise / Société (Connecté à Supabase)
  const handleSaveCompanySettings = async (updated: CompanySettings) => {
    const cloned = { ...updated };
    setCompanySettings(cloned);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tfs_paie_company_settings", JSON.stringify(cloned));
      } catch (e) {
        console.error("Erreur sauvegarde localStorage:", e);
      }
    }
    showToast(`Paramètres de l'entreprise "${cloned.companyName}" enregistrés.`);

    if (isSupabaseConnected) {
      try {
        const res = await updateCompanySettingsAction(cloned);
        if (res.success) {
          showToast(`✅ Paramètres de "${cloned.companyName}" synchronisés sur Supabase !`);
        }
      } catch (err: any) {
        console.error("Erreur sync société Supabase:", err);
      }
    }
  };

  // Actions Avances sur Salaire (Connecté à Supabase + Cache Local)
  const handleGrantAdvance = async (
    workerId: string,
    amount: number,
    motif: string,
    method: PaymentMethod
  ) => {
    const target = workers.find((w) => w.id === workerId);
    if (!target) return;

    setWorkers((prev) => {
      const next = prev.map((w) =>
        w.id === workerId
          ? { ...w, unpaidAdvances: (w.unpaidAdvances || 0) + amount }
          : w
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    setKpis((prev) => ({
      ...prev,
      totalPendingAdvances: prev.totalPendingAdvances + amount,
    }));

    showToast(
      `Avance de ${formatFCFA(amount)} accordée à ${target.firstName} ${target.lastName} (${motif})`
    );

    if (isSupabaseConnected && workerId && workerId.includes("-")) {
      try {
        const res = await grantAdvanceAction({
          workerId,
          amount,
          motif,
          method,
        });
        if (res.success) {
          showToast(`✅ Avance de ${formatFCFA(amount)} synchronisée sur Supabase !`);
        }
      } catch (err: any) {
        console.error("Erreur sync avance Supabase:", err);
      }
    }
  };

  const handleSettleAdvance = async (workerId: string, amountToSettle: number) => {
    const target = workers.find((w) => w.id === workerId);
    if (!target) return;

    setWorkers((prev) => {
      const next = prev.map((w) =>
        w.id === workerId
          ? {
              ...w,
              unpaidAdvances: Math.max(0, (w.unpaidAdvances || 0) - amountToSettle),
            }
          : w
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("tfs_paie_workers", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });

    setKpis((prev) => ({
      ...prev,
      totalPendingAdvances: Math.max(0, prev.totalPendingAdvances - amountToSettle),
    }));

    showToast(
      `Remboursement de ${formatFCFA(amountToSettle)} enregistré pour ${target.firstName} ${target.lastName}`
    );

    if (isSupabaseConnected && workerId.includes("-")) {
      await settleAdvanceAction(workerId, amountToSettle);
    }
  };

  // Pointage (taux 2 500 FCFA/j)
  const handleUpdateSingleAttendance = (workerId: string, status: AttendanceType) => {
    setAttendanceState((prev) => {
      const next = { ...prev, [workerId]: status };
      const present = Object.values(next).filter((s) => s === "full_day").length;
      const half = Object.values(next).filter((s) => s === "half_day").length;
      const absent = Object.values(next).filter((s) => s === "absent").length;
      setKpis((kpiPrev) => ({
        ...kpiPrev,
        presentToday: present,
        halfDayToday: half,
        absentToday: absent,
      }));
      return next;
    });
  };

  const handleBatchUpdateAttendance = (updates: Record<string, AttendanceType>) => {
    setAttendanceState((prev) => {
      const next = { ...prev, ...updates };
      const present = Object.values(next).filter((s) => s === "full_day").length;
      const half = Object.values(next).filter((s) => s === "half_day").length;
      const absent = Object.values(next).filter((s) => s === "absent").length;
      setKpis((kpiPrev) => ({
        ...kpiPrev,
        presentToday: present,
        halfDayToday: half,
        absentToday: absent,
      }));
      return next;
    });
    showToast(`${Object.keys(updates).length} présences mises à jour avec succès !`);
  };

  // Pointage (Connecté à Supabase via synchronisation par lots)
  const handleSaveAttendanceView = async () => {
    const present = Object.values(attendanceState).filter((s) => s === "full_day").length;
    const half = Object.values(attendanceState).filter((s) => s === "half_day").length;
    const totalDayWage = present * 2500 + half * 1250;

    if (isSupabaseConnected) {
      showToast(`Enregistrement du pointage en cours...`);
      const batch = Object.entries(attendanceState)
        .filter(([workerId]) => workerId.includes("-"))
        .map(([workerId, type]) => ({
          workerId,
          type,
        }));

      if (batch.length > 0) {
        try {
          const res = await saveAttendanceBatchAction({
            date: attendanceDate,
            attendances: batch,
          });

          if (res.success) {
            showToast(`✅ ${res.count} pointages synchronisés avec succès sur Supabase (${formatFCFA(totalDayWage)}) !`);
            return;
          } else {
            showToast(`⚠️ ${res.error}`);
          }
        } catch (err: any) {
          console.error("Erreur sync pointage:", err);
        }
      }
    }

    showToast(`Feuille de pointage enregistrée : ${present} présents (${formatFCFA(present * 2500)}). Total : ${formatFCFA(totalDayWage)}.`);
  };

  // Verrouillage de Journée (Connecté à Supabase avec Audit Log)
  const handleToggleAttendanceLock = async () => {
    const nextLocked = !isAttendanceLocked;
    setIsAttendanceLocked(nextLocked);

    if (isSupabaseConnected) {
      try {
        if (nextLocked) {
          const res = await lockAttendanceDayAction(attendanceDate);
          if (res.success) {
            showToast(`🔒 Journée du ${attendanceDate} CLÔTURÉE sur Supabase (Piste d'audit enregistrée)`);
            return;
          }
        } else {
          const res = await unlockAttendanceDayAction(attendanceDate, "Réouverture exceptionnelle par le gestionnaire");
          if (res.success) {
            showToast(`🔓 Journée du ${attendanceDate} DÉVERROUILLÉE sur Supabase`);
            return;
          }
        }
      } catch (err: any) {
        console.error("Erreur clôture/déverrouillage Supabase:", err);
      }
    }

    showToast(nextLocked ? `🔒 Journée du ${attendanceDate} clôturée` : `🔓 Journée du ${attendanceDate} déverrouillée`);
  };

  const handleExecuteTask = (taskId: string) => {
    if (taskId === "task-1") {
      setActiveView("pointage");
    } else if (taskId === "task-2") {
      setActiveView("paiements");
      setIsNewPaymentOpen(true);
    } else if (taskId === "task-3") {
      setActiveView("avances");
      showToast("Dossiers d'avances ouverts pour examen du gérant.");
    }
  };

  const handleExportPaymentsBatch = () => {
    exportPaymentsToCsv(filteredPayments, workers, ";");
    showToast("Export clair & détaillé des paiements téléchargé pour Excel (Wave, Orange Money, Cash) !");
  };

  const handleResetFilters = () => {
    setStartDate(initialBounds.monthStart);
    setEndDate(initialBounds.monthEnd);
    setSelectedTeam("all");
    setSelectedMethod("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* 1. BARRE LATÉRALE GAUCHE (Organise tous les onglets élégamment sur le côté) */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        workerCount={workers.length}
        activityCount={activities.length}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQuickAttendance={() => setActiveView("pointage")}
        onOpenActivities={() => setActiveView("activites")}
        companySettings={companySettings}
      />

      {/* 2. ZONE PRINCIPALE DE L'APPLICATION (Décalée de la largeur de la sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-200">
        {/* Barre d'en-tête épurée avec statut Supabase */}
        <HeaderBar
          activeView={activeView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickAttendance={() => setActiveView("pointage")}
          onOpenNewPayment={() => setIsNewPaymentOpen(true)}
          companySettings={companySettings}
          isSupabaseConnected={isSupabaseConnected}
          isSyncing={isSyncing}
        />

        {/* Toast de Notification Réactif */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#103423] text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Contenu Dynamique selon l'onglet choisi dans la barre latérale */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
          {activeView === "dashboard" ? (
            /* VUE TABLEAU DE BORD */
            <div className="space-y-6">
              {/* Bannière de Ferme */}
              <FarmBanner
                onOpenQuickAttendance={() => setActiveView("pointage")}
                onOpenNewPayment={() => setIsNewPaymentOpen(true)}
                onOpenNewWorker={() => setIsNewWorkerOpen(true)}
                onOpenActivities={() => setActiveView("activites")}
                onExportBatch={handleExportPaymentsBatch}
                companySettings={companySettings}
              />

              {/* Cartes de Synthèse KPI */}
              <KPICards
                kpis={kpis}
                onFilterPresent={() => setActiveView("pointage")}
                onViewAdvances={() => setActiveView("avances")}
                onViewPayroll={() => setActiveView("paiements")}
              />

              {/* Grille Principale : Table des Paiements + Tâches et Coûts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                <div className="lg:col-span-8 min-w-0 space-y-4">
                  <DateFilterBar
                    startDate={startDate}
                    endDate={endDate}
                    selectedTeam={selectedTeam}
                    selectedMethod={selectedMethod}
                    searchQuery={searchQuery}
                    teams={mockTeams}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onTeamChange={setSelectedTeam}
                    onMethodChange={setSelectedMethod}
                    onSearchChange={setSearchQuery}
                    onResetFilters={handleResetFilters}
                    onOpenNewPayment={() => setIsNewPaymentOpen(true)}
                    onOpenActivities={() => setActiveView("activites")}
                  />

                  <PaymentsTable
                    payments={filteredPayments}
                    onEditPayment={(payment) => {
                      showToast(`Édition du règlement de ${payment.workerName}`);
                      setIsNewPaymentOpen(true);
                    }}
                    onDeletePayment={handleDeletePayment}
                    onViewReceipt={(payment) => setActiveReceipt(payment)}
                  />
                </div>

                <div className="lg:col-span-4 min-w-0 space-y-4">
                  <TodoTasks tasks={tasks} onExecuteTask={handleExecuteTask} />
                  <CostBreakdown
                    activityCosts={mockActivityCosts}
                    onViewDetail={() => setActiveView("activites")}
                  />
                </div>
              </div>
            </div>
          ) : activeView === "pointage" ? (
            /* VUE POINTAGE TERRAIN (Plein écran dédié, sans tableau de bord en arrière-plan) */
            <PointageView
              workers={workers}
              teams={mockTeams}
              domains={domains}
              attendanceState={attendanceState}
              onUpdateAttendance={handleUpdateSingleAttendance}
              onBatchUpdateAttendance={handleBatchUpdateAttendance}
              onSaveAttendance={handleSaveAttendanceView}
              isLocked={isAttendanceLocked}
              onToggleLock={handleToggleAttendanceLock}
              currentDate={attendanceDate}
              onDateChange={setAttendanceDate}
            />
          ) : activeView === "journaliers" ? (
            /* VUE RÉPERTOIRE DES JOURNALIERS (avec onglet Importer & Exporter) */
            <WorkersView
              workers={workers}
              teams={mockTeams}
              onOpenNewWorker={() => {
                setEditingWorker(null);
                setIsNewWorkerOpen(true);
              }}
              onOpenImport={() => setIsImportWorkersOpen(true)}
              onExportWorkers={handleExportWorkers}
              onDeleteWorker={handleDeleteWorker}
              onEditWorker={(w) => {
                setEditingWorker(w);
                setIsNewWorkerOpen(true);
              }}
            />
          ) : activeView === "activites" ? (
            /* VUE ACTIVITÉS ET DOMAINES (Avec onglet Activités et onglet Domaines) */
            <ActivitiesDomainsView
              activities={activities}
              domains={domains}
              workers={workers}
              onSaveActivity={handleSaveActivity}
              onDeleteActivity={handleDeleteActivity}
              onSaveDomain={handleSaveDomain}
              onDeleteDomain={handleDeleteDomain}
            />
          ) : activeView === "parametres" ? (
            /* VUE PARAMÈTRES (Utilisateurs, Entreprise, Règles RLS) */
            <SettingsView
              users={users}
              companySettings={companySettings}
              teams={mockTeams}
              onSaveCompanySettings={handleSaveCompanySettings}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          ) : activeView === "avances" ? (
            /* VUE AVANCES SUR SALAIRE (Dédiée, soldes et octroi) */
            <AvancesView
              workers={workers}
              teams={mockTeams}
              onGrantAdvance={handleGrantAdvance}
              onSettleAdvance={handleSettleAdvance}
            />
          ) : (
            /* VUE PAIEMENTS QUINZAINE */
            <div className="space-y-5">
              {/* Cartouche d'en-tête de la Quinzaine avec actions */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DED5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      Cycle Quinzaine (15 jours)
                    </span>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      Taux standard : 2 500 F CFA/jour (½ j : 1 250 F)
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                    Registre des Règlements de Quinzaine
                  </h2>
                  <p className="text-xs text-slate-500">
                    Déduction automatique des acomptes, émargement et quittances certifiées pour Mobile Money & Espèces
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    onClick={handleExportPaymentsBatch}
                    className="touch-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider border border-[#D5C7B8] shadow-2xs transition-transform active:scale-95"
                    id="btn-export-batch-page"
                    title="Télécharger le fichier de décaissement Wave Mass Payout et Orange Money"
                  >
                    <Download className="w-4 h-4 text-emerald-800" />
                    <span>Exporter Lot (CSV)</span>
                  </button>

                  <button
                    onClick={() => setIsNewPaymentOpen(true)}
                    className="touch-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95"
                    id="btn-new-payment-page"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Payer Quinzaine</span>
                  </button>
                </div>
              </div>

              {/* 3 Cartes de Synthèse de la Quinzaine */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Net Payé (Période)
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-800 mt-1 block">
                    {formatFCFA(filteredPayments.reduce((acc, p) => acc + p.amount, 0))}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Décaissements émargés</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Avances Récupérées sur Paie
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#C25E34] mt-1 block">
                    {formatFCFA(filteredPayments.reduce((acc, p) => acc + (p.advanceDeducted || 0), 0))}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">Remboursements immédiats</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Bulletins & Règlements
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
                    {filteredPayments.length}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Quittances générées</span>
                </div>
              </div>

              {/* Barre de Filtres Complète */}
              <DateFilterBar
                startDate={startDate}
                endDate={endDate}
                selectedTeam={selectedTeam}
                selectedMethod={selectedMethod}
                searchQuery={searchQuery}
                teams={mockTeams}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onTeamChange={setSelectedTeam}
                onMethodChange={setSelectedMethod}
                onSearchChange={setSearchQuery}
                onResetFilters={handleResetFilters}
                onOpenNewPayment={() => setIsNewPaymentOpen(true)}
                onOpenActivities={() => setActiveView("activites")}
              />

              {/* Tableau des Règlements */}
              <PaymentsTable
                payments={filteredPayments}
                onEditPayment={(payment) => {
                  showToast(`Édition du paiement ${payment.id}`);
                  setIsNewPaymentOpen(true);
                }}
                onDeletePayment={handleDeletePayment}
                onViewReceipt={(payment) => setActiveReceipt(payment)}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-5 border-t border-[#E5DED5] bg-white text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">
            TFS PAIE — Gestion & Paiement des Journaliers Agricoles (Taux standard: 2 500 FCFA/j • Quinzaine 15j)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {companySettings.companyName} ({companySettings.legalForm}) • Sécurité Supabase RLS & Mode Hors Ligne
          </p>
        </footer>
      </div>

      {/* Modales Interactives */}
      <ImportWorkersModal
        isOpen={isImportWorkersOpen}
        onClose={() => setIsImportWorkersOpen(false)}
        onImportWorkers={handleImportWorkers}
      />

      <NewPaymentModal
        isOpen={isNewPaymentOpen}
        onClose={() => setIsNewPaymentOpen(false)}
        workers={workers}
        onAddPayment={handleAddPayment}
      />

      <NewWorkerModal
        isOpen={isNewWorkerOpen}
        onClose={() => {
          setIsNewWorkerOpen(false);
          setEditingWorker(null);
        }}
        teams={mockTeams}
        activities={activities}
        onAddWorker={handleAddWorker}
        initialWorker={editingWorker}
      />

      <ActivityModal
        isOpen={isActivitiesOpen}
        onClose={() => setIsActivitiesOpen(false)}
        activities={activities}
        onSaveActivity={handleSaveActivity}
        onDeleteActivity={handleDeleteActivity}
      />

      <QuickAttendanceDrawer
        isOpen={isQuickAttendanceOpen}
        onClose={() => setIsQuickAttendanceOpen(false)}
        workers={workers}
        teams={mockTeams}
        onSaveAttendance={(attendances) => {
          handleBatchUpdateAttendance(attendances);
          setIsQuickAttendanceOpen(false);
        }}
      />

      <ReceiptModal
        payment={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        companySettings={companySettings}
      />
    </div>
  );
}
