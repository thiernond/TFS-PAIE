"use client";

import React from "react";
import {
  CalendarCheck,
  UserPlus,
  PlusCircle,
  FileDown,
  Calendar,
  Layers,
  MapPin,
} from "lucide-react";
import { CompanySettings } from "@/types/payroll";
import { formatFullTodayFR } from "@/lib/utils/formatters";

interface FarmBannerProps {
  onOpenQuickAttendance: () => void;
  onOpenNewPayment: () => void;
  onOpenNewWorker: () => void;
  onOpenActivities?: () => void;
  onExportBatch: () => void;
  companySettings?: CompanySettings;
}

export const FarmBanner: React.FC<FarmBannerProps> = ({
  onOpenQuickAttendance,
  onOpenNewPayment,
  onOpenNewWorker,
  onOpenActivities,
  onExportBatch,
  companySettings,
}) => {
  const todayLabel = formatFullTodayFR();
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#123825] via-[#0E2F1E] to-[#081F14] text-white shadow-lifted border border-emerald-900/40 p-5 sm:p-7">
      {/* Motifs géométriques décoratifs légers rappelant les parcelles agricoles */}
      <div className="absolute right-0 top-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -mb-12 w-56 h-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Titre et badges contextuels à gauche avec aération */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <MapPin className="w-3.5 h-3.5" />
              {companySettings?.address ? `${companySettings.address} • ${companySettings.region}` : "Route Nationale 2, Km 45 • Thiès"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-white/10 text-slate-200">
              <Calendar className="w-3.5 h-3.5" />
              {todayLabel}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {companySettings?.logoUrl && (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-lg border border-white/20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                {companySettings?.companyName || "Tableau de Bord des Paiements & Journaliers"}
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Suivi quotidien des présences, du travail à la tâche, des avances sur salaire et des décaissements Mobile Money (Wave, Orange Money, Espèces) pour <strong className="text-white font-semibold">120 ouvriers</strong> répartis sur 4 parcelles.
          </p>
        </div>

        {/* Bloc d'Actions Rapides Réorganisé & Équilibré (Pas de débordement, labels complets) */}
        <div className="w-full lg:w-auto shrink-0 flex flex-col gap-2.5 sm:min-w-[340px]">
          {/* Ligne 1 : Les 2 actions majeures du terrain */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onOpenQuickAttendance}
              className="touch-btn inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              id="btn-quick-attendance"
            >
              <CalendarCheck className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Pointer Aujourd&apos;hui</span>
            </button>

            <button
              onClick={onOpenNewPayment}
              className="touch-btn inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              id="btn-new-payment"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Payer Quinzaine</span>
            </button>
          </div>

          {/* Ligne 2 : Actions complémentaires organisées (Nouveau Journalier, Activités, Export) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onOpenNewWorker}
              className="touch-btn inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
              id="btn-new-worker"
              title="Ajouter un nouveau journalier"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span className="truncate">+ Journalier</span>
            </button>

            {onOpenActivities && (
              <button
                onClick={onOpenActivities}
                className="touch-btn inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
                id="btn-manage-activities-banner"
                title="Gérer les activités et barèmes"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span className="truncate">Activités</span>
              </button>
            )}

            <button
              onClick={onExportBatch}
              className="touch-btn inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
              id="btn-export-batch"
              title="Exporter le lot pour Wave Mass Payout ou Orange Money"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
              <span className="truncate">Exporter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
