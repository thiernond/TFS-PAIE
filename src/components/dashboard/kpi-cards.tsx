"use client";

import React from "react";
import {
  Users,
  CalendarCheck,
  Coins,
  CreditCard,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { DashboardKPIs } from "@/types/payroll";

interface KPICardsProps {
  kpis: DashboardKPIs;
  onFilterPresent?: () => void;
  onViewAdvances?: () => void;
  onViewPayroll?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  kpis,
  onFilterPresent,
  onViewAdvances,
  onViewPayroll,
}) => {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
      {/* 1. Journaliers Actifs */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5DED5] shadow-2xs hover:shadow-md hover:border-emerald-400/60 transition-all duration-150 flex flex-col justify-between group">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Journaliers Actifs
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/50">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {kpis.totalActiveWorkers}
          </span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-300/50">
            4 Équipes
          </span>
        </div>

        <div className="pt-2 border-t border-[#F2ECE4] text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between">
          <span className="truncate">Toutes parcelles</span>
          <span className="text-emerald-700 font-semibold shrink-0">100% fiches</span>
        </div>
      </div>

      {/* 2. Présents Aujourd'hui */}
      <div
        onClick={onFilterPresent}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5DED5] shadow-2xs hover:shadow-md hover:border-green-500/70 cursor-pointer transition-all duration-150 flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-green-800 transition-colors truncate">
            Présents Ce Jour
          </span>
          <div className="w-7 h-7 rounded-lg bg-green-50 text-green-800 flex items-center justify-center shrink-0 border border-green-200/50">
            <CalendarCheck className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
            {kpis.presentToday}
          </span>
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300/50">
            90% taux
          </span>
        </div>

        <div className="pt-2 border-t border-[#F2ECE4] text-[10px] sm:text-[11px] flex items-center justify-between">
          <span className="text-amber-800 font-semibold">{kpis.halfDayToday} demi-j</span>
          <span className="text-rose-600 font-semibold">{kpis.absentToday} absents</span>
        </div>
      </div>

      {/* 3. À Payer (Période) */}
      <div
        onClick={onViewPayroll}
        className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5DED5] shadow-2xs hover:shadow-md hover:border-amber-400/60 cursor-pointer transition-all duration-150 flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-800 transition-colors truncate">
            À Payer (Période)
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200/50">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline whitespace-nowrap overflow-hidden">
          <span className="text-base sm:text-lg lg:text-[17px] xl:text-lg font-black text-slate-900 tracking-tight truncate">
            {formatMoney(kpis.totalLaborCostPeriod)}
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 ml-1 uppercase shrink-0">
            F CFA
          </span>
        </div>

        <div className="pt-2 border-t border-[#F2ECE4] text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between">
          <span className="truncate">Quinzaine en cours</span>
          <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
            À valider
          </span>
        </div>
      </div>

      {/* 4. Payé Ce Mois */}
      <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5DED5] shadow-2xs hover:shadow-md hover:border-sky-400/60 transition-all duration-150 flex flex-col justify-between group">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
            Payé Ce Mois
          </span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-800 flex items-center justify-center shrink-0 border border-sky-200/50">
            <Coins className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline whitespace-nowrap overflow-hidden">
          <span className="text-base sm:text-lg lg:text-[17px] xl:text-lg font-black text-slate-900 tracking-tight truncate">
            {formatMoney(kpis.totalPaidThisMonth)}
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 ml-1 uppercase shrink-0">
            F CFA
          </span>
        </div>

        <div className="pt-2 border-t border-[#F2ECE4] text-[10px] sm:text-[11px] flex items-center justify-between">
          <span className="text-sky-800 font-semibold truncate">Wave & OM 90%</span>
          <span className="text-slate-500 shrink-0">Espèces 10%</span>
        </div>
      </div>

      {/* 5. Avances en Cours */}
      <div
        onClick={onViewAdvances}
        className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3 sm:p-3.5 border border-[#E5DED5] shadow-2xs hover:shadow-md hover:border-[#C25E34]/50 cursor-pointer transition-all duration-150 flex flex-col justify-between group"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#C25E34] transition-colors truncate">
            Avances en Cours
          </span>
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#C25E34] flex items-center justify-center shrink-0 border border-orange-200/50">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline whitespace-nowrap overflow-hidden">
          <span className="text-base sm:text-lg lg:text-[17px] xl:text-lg font-black text-[#C25E34] tracking-tight truncate">
            {formatMoney(kpis.totalPendingAdvances)}
          </span>
          <span className="text-[10px] font-extrabold text-slate-400 ml-1 uppercase shrink-0">
            F CFA
          </span>
        </div>

        <div className="pt-2 border-t border-[#F2ECE4] text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between">
          <span className="truncate">Retenue auto paie</span>
          <span className="text-orange-800 font-bold bg-orange-50 px-1.5 py-0.2 rounded border border-orange-200 shrink-0">
            Solde actif
          </span>
        </div>
      </div>
    </div>
  );
};
