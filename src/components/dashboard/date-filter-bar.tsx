"use client";

import React from "react";
import {
  Calendar,
  Filter,
  Plus,
  Search,
  RotateCcw,
  Users,
  CreditCard,
} from "lucide-react";
import { Team } from "@/types/payroll";
import { getCurrentMonthBounds } from "@/lib/utils/formatters";

interface DateFilterBarProps {
  startDate: string;
  endDate: string;
  selectedTeam: string;
  selectedMethod: string;
  searchQuery: string;
  teams: Team[];
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onTeamChange: (val: string) => void;
  onMethodChange: (val: string) => void;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
  onOpenNewPayment: () => void;
  onOpenActivities?: () => void;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  startDate,
  endDate,
  selectedTeam,
  selectedMethod,
  searchQuery,
  teams,
  onStartDateChange,
  onEndDateChange,
  onTeamChange,
  onMethodChange,
  onSearchChange,
  onResetFilters,
  onOpenNewPayment,
  onOpenActivities,
}) => {
  const bounds = getCurrentMonthBounds();

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5DED5] shadow-card space-y-4">
      {/* Barre supérieure : Titre de section, Bouton Activités & Bouton Nouveau Paiement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE3]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-6 rounded-full bg-[#C25E34]" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Paiements de Quinzaine & Journaliers
            </h2>
            <p className="text-xs text-slate-600">
              Registre d&apos;émargement des salaires (2 500 FCFA/j), quinzaines et avances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenActivities && (
            <button
              onClick={onOpenActivities}
              className="touch-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider border border-emerald-300 transition-all active:scale-95"
              id="btn-manage-activities"
              title="Configurer les activités et parcelles"
            >
              <Filter className="w-4 h-4 text-emerald-700" />
              <span>ACTIVITÉS & TÂCHES</span>
            </button>
          )}

          <button
            onClick={onOpenNewPayment}
            className="touch-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
            id="btn-new-income-style"
          >
            <Plus className="w-4 h-4" />
            <span>PAYER LA QUINZAINE</span>
          </button>
        </div>
      </div>

      {/* 1. Ligne Période Quinzaine & Sélecteurs de Dates aérés (Zero coupure) */}
      <div className="p-3 rounded-xl bg-sand-50/70 border border-[#E5DED5] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Raccourcis Quinzaine */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 shrink-0">
            <Calendar className="w-4 h-4 text-emerald-800" />
            <span>Période Quinzaine :</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onStartDateChange(bounds.q1Start);
                onEndDateChange(bounds.q1End);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                startDate === bounds.q1Start && endDate === bounds.q1End
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-emerald-50 border border-[#D5C7B8]"
              }`}
            >
              1ère Quinzaine (01–15)
            </button>

            <button
              type="button"
              onClick={() => {
                onStartDateChange(bounds.q2Start);
                onEndDateChange(bounds.q2End);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                startDate === bounds.q2Start && endDate === bounds.q2End
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-emerald-50 border border-[#D5C7B8]"
              }`}
            >
              2ème Quinzaine (16–{bounds.lastDayStr})
            </button>

            <button
              type="button"
              onClick={() => {
                onStartDateChange(bounds.monthStart);
                onEndDateChange(bounds.monthEnd);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                startDate === bounds.monthStart && endDate === bounds.monthEnd
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-emerald-50 border border-[#D5C7B8]"
              }`}
            >
              Tout le mois
            </button>
          </div>
        </div>

        {/* Sélecteurs Date Début et Date Fin avec largeur garantie (min 150px) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Du :</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="min-w-[150px] px-3 py-1.5 text-xs font-bold rounded-lg border border-[#D5C7B8] bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Au :</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="min-w-[150px] px-3 py-1.5 text-xs font-bold rounded-lg border border-[#D5C7B8] bg-white text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* 2. Ligne Critères & Recherche : Équipe, Mode de Règlement et Recherche */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        {/* Filtre Équipe / Parcelle */}
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Équipe / Parcelle
          </label>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => onTeamChange(e.target.value)}
              className="w-full appearance-none px-3 py-2 text-xs font-semibold rounded-lg border border-[#D5C7B8] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 pr-8 shadow-2xs"
            >
              <option value="all">Toutes les équipes (4 parcelles)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.workerCount} ouvriers)
                </option>
              ))}
            </select>
            <Users className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Filtre Moyen de Paiement */}
        <div className="sm:col-span-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Mode de Règlement
          </label>
          <div className="relative">
            <select
              value={selectedMethod}
              onChange={(e) => onMethodChange(e.target.value)}
              className="w-full appearance-none px-3 py-2 text-xs font-semibold rounded-lg border border-[#D5C7B8] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 pr-8 shadow-2xs"
            >
              <option value="all">Tous modes de paiement</option>
              <option value="wave">Wave (Sénégal/CI)</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="cash">Espèces (Cash)</option>
            </select>
            <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Recherche rapide par nom d'ouvrier ou réf */}
        <div className="sm:col-span-5 flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Recherche Ouvrier ou Réf.
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, fonction, réf..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-lg border border-[#D5C7B8] bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
              />
            </div>
          </div>

          <button
            onClick={onResetFilters}
            title="Réinitialiser tous les filtres"
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-[#D5C7B8] bg-white transition-colors shadow-2xs shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
