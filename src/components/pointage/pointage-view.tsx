"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarCheck,
  Check,
  Clock,
  UserX,
  Search,
  Filter,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Unlock,
  CheckCheck,
  Calendar,
  Layers,
  MapPin,
  Users,
  Wallet,
  Sparkles,
  Phone,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Worker, AttendanceType, Team, FarmDomain } from "@/types/payroll";
import { formatFCFA } from "@/lib/utils/formatters";
import { exportAttendanceToCsv } from "@/lib/utils/csv-export";
import { ImportAttendanceModal } from "./import-attendance-modal";

interface PointageViewProps {
  workers: Worker[];
  teams: Team[];
  domains: FarmDomain[];
  attendanceState: Record<string, AttendanceType>;
  onUpdateAttendance: (workerId: string, status: AttendanceType) => void;
  onBatchUpdateAttendance: (updates: Record<string, AttendanceType>) => void;
  onSaveAttendance: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  currentDate: string;
  onDateChange?: (newDate: string) => void;
}

export const PointageView: React.FC<PointageViewProps> = ({
  workers,
  teams,
  domains,
  attendanceState,
  onUpdateAttendance,
  onBatchUpdateAttendance,
  onSaveAttendance,
  isLocked,
  onToggleLock,
  currentDate,
  onDateChange,
}) => {
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // "all" | "full_day" | "half_day" | "absent"

  // Modal d'import CSV
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filtrage des ouvriers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // 1. Filtre par Équipe
      if (selectedTeam !== "all" && w.teamName !== selectedTeam && w.teamId !== selectedTeam) {
        return false;
      }

      // 2. Filtre par Domaine / Parcelle
      if (selectedDomain !== "all" && w.domain !== selectedDomain) {
        return false;
      }

      // 3. Filtre par Statut de présence
      const status = attendanceState[w.id] || "full_day";
      if (selectedStatus !== "all" && status !== selectedStatus) {
        return false;
      }

      // 4. Recherche textuelle (Nom, Prénom, Téléphone, Fonction, Matricule)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const fullName = `${w.firstName} ${w.lastName}`.toLowerCase();
        const phone = (w.phone || "").toLowerCase();
        const func = (w.functionTitle || "").toLowerCase();
        const id = (w.id || "").toLowerCase();
        if (
          !fullName.includes(query) &&
          !phone.includes(query) &&
          !func.includes(query) &&
          !id.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [workers, selectedTeam, selectedDomain, selectedStatus, searchQuery, attendanceState]);

  // Statistiques globales du pointage
  const stats = useMemo(() => {
    let presentCount = 0;
    let halfDayCount = 0;
    let absentCount = 0;
    let totalPayrollFCFA = 0;

    workers.forEach((w) => {
      const status = attendanceState[w.id] || "full_day";
      const rate = w.dailyRate || 2500;
      if (status === "full_day") {
        presentCount++;
        totalPayrollFCFA += rate;
      } else if (status === "half_day") {
        halfDayCount++;
        totalPayrollFCFA += Math.floor(rate / 2);
      } else {
        absentCount++;
      }
    });

    const totalActive = workers.length;
    const ratePercent = totalActive > 0 ? Math.round(((presentCount + halfDayCount * 0.5) / totalActive) * 100) : 0;

    return {
      totalActive,
      presentCount,
      halfDayCount,
      absentCount,
      ratePercent,
      totalPayrollFCFA,
    };
  }, [workers, attendanceState]);

  // Cycle 1-tap/2-taps sur un ouvrier
  const handleToggleCycle = (workerId: string) => {
    if (isLocked) return;
    const current = attendanceState[workerId] || "full_day";
    let next: AttendanceType = "full_day";
    if (current === "full_day") next = "half_day";
    else if (current === "half_day") next = "absent";
    else if (current === "absent") next = "full_day";

    onUpdateAttendance(workerId, next);
  };

  // Actions groupées
  const handleMarkAllFilteredPresent = () => {
    if (isLocked) return;
    const updates: Record<string, AttendanceType> = {};
    filteredWorkers.forEach((w) => {
      updates[w.id] = "full_day";
    });
    onBatchUpdateAttendance(updates);
  };

  const handleMarkAllFilteredAbsent = () => {
    if (isLocked) return;
    const updates: Record<string, AttendanceType> = {};
    filteredWorkers.forEach((w) => {
      updates[w.id] = "absent";
    });
    onBatchUpdateAttendance(updates);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTeam("all");
    setSelectedDomain("all");
    setSelectedStatus("all");
  };

  // Export CSV du pointage clair et compatible Excel
  const handleExportCSV = () => {
    exportAttendanceToCsv(currentDate, filteredWorkers, attendanceState, ";");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. CARTOUCHE D'EN-TÊTE : CONTEXTE, DATE & ACTIONS GLOBALES */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identité & Date */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                Pointage Quotidien • 2 500 F CFA/jour
              </span>

              {isLocked ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Journée Clôturée
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  Émargement Ouvert
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-6 h-6 text-emerald-700" />
                Feuille de Pointage Terrain
              </h2>
            </div>

            <p className="text-xs text-slate-500">
              Pointer en 1-tap ou 2-taps • Rémunération : 2 500 F CFA la journée entière, 1 250 F CFA la demi-journée.
            </p>
          </div>

          {/* Outils Temporels & Import/Export */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sélecteur de date */}
            <div className="flex items-center gap-1.5 bg-sand-50 px-3 py-2 rounded-xl border border-[#D5C7B8]">
              <Calendar className="w-4 h-4 text-emerald-800" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => onDateChange && onDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Importer CSV */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              disabled={isLocked}
              className="touch-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#D5C7B8] hover:bg-sand-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
              title="Importer une liste de présences au format CSV"
            >
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Importer (CSV)</span>
            </button>

            {/* Exporter CSV */}
            <button
              onClick={handleExportCSV}
              className="touch-btn inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#D5C7B8] hover:bg-sand-50 text-slate-700 text-xs font-bold transition-all"
              title="Télécharger la feuille de pointage du jour en CSV"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Exporter (CSV)</span>
            </button>

            {/* Clôture de la journée */}
            <button
              onClick={onToggleLock}
              className={`touch-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs ${
                isLocked
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#103423] hover:bg-[#184630] text-white"
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Déverrouiller</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Clôturer Journée</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. BARRE DES STATISTIQUES EN TEMPS RÉEL DU JOUR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Ouvriers */}
        <div className="bg-white p-3 rounded-xl border border-[#E5DED5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Journaliers
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-900">{stats.totalActive}</span>
            <span className="text-[10px] text-slate-500">inscrits</span>
          </div>
        </div>

        {/* Présents (2 500 F) */}
        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              Présents (2 500 F)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-emerald-950">{stats.presentCount}</span>
            <span className="text-[10px] font-semibold text-emerald-800">
              ({formatFCFA(stats.presentCount * 2500)})
            </span>
          </div>
        </div>

        {/* Demi-Journées (1 250 F) */}
        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Demi-j (1 250 F)
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-black text-amber-950">{stats.halfDayCount}</span>
            <span className="text-[10px] font-semibold text-amber-800">
              ({formatFCFA(stats.halfDayCount * 1250)})
            </span>
          </div>
        </div>

        {/* Absents (0 F) */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Absents (0 F)
            </span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-slate-800">{stats.absentCount}</span>
            <span className="text-[10px] text-slate-500">absents</span>
          </div>
        </div>

        {/* Taux d'Assiduité */}
        <div className="bg-white p-3 rounded-xl border border-[#E5DED5] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Assiduité Jour
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-black text-emerald-800">{stats.ratePercent}%</span>
            <span className="text-[10px] text-slate-500">au champ</span>
          </div>
        </div>

        {/* Masse Salariale Totale Estimée du Jour */}
        <div className="bg-sand-50 p-3 rounded-xl border border-[#D5C7B8] shadow-xs col-span-2 sm:col-span-1 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
            Masse Salariale Jour
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-black text-slate-900 truncate">
              {formatFCFA(stats.totalPayrollFCFA)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. BARRE DE FILTRAGE COMPLÈTE SUR LA FORMULE DE POINTAGE */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Recherche textuelle */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone, fonction ou matricule..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D5C7B8] bg-sand-50/40 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtre Équipe */}
          <div className="w-full md:w-52">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-[#D5C7B8] bg-sand-50/40 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Toutes les équipes ({teams.length})</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Domaine / Parcelle */}
          <div className="w-full md:w-52">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl border border-[#D5C7B8] bg-sand-50/40 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les domaines ({domains.length})</option>
              {domains.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut de Présence */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-[#D5C7B8] bg-sand-50/40 focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="full_day">Présents uniquement (2 500 F)</option>
              <option value="half_day">Demi-journées uniquement (1 250 F)</option>
              <option value="absent">Absents uniquement (0 F)</option>
            </select>
          </div>
        </div>

        {/* Ligne d'actions rapides & indicateur de sélection */}
        <div className="pt-2 border-t border-[#F0EBE3] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-bold text-slate-900">
              {filteredWorkers.length} ouvrier{filteredWorkers.length > 1 ? "s" : ""} affiché{filteredWorkers.length > 1 ? "s" : ""}
            </span>
            {filteredWorkers.length < workers.length && (
              <span className="text-[11px] text-slate-500">
                sur {workers.length} au total
              </span>
            )}
            {(searchQuery || selectedTeam !== "all" || selectedDomain !== "all" || selectedStatus !== "all") && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline ml-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Boutons d'actions groupées */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllFilteredPresent}
              disabled={isLocked || filteredWorkers.length === 0}
              className="touch-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tout marquer Présent</span>
            </button>

            <button
              onClick={handleMarkAllFilteredAbsent}
              disabled={isLocked || filteredWorkers.length === 0}
              className="touch-btn inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors disabled:opacity-50"
            >
              <UserX className="w-3.5 h-3.5 text-slate-600" />
              <span>Tout marquer Absent</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. TABLEAU / GRILLE D'ÉMARGEMENT RAPIDE (1-TAP / 2-TAPS) */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] shadow-xs overflow-hidden">
        {filteredWorkers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              Aucun journalier ne correspond aux filtres appliqués
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vérifiez les critères d&apos;équipe, de domaine ou l&apos;orthographe dans la barre de recherche.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0EBE3]">
            {filteredWorkers.map((worker) => {
              const status = attendanceState[worker.id] || "full_day";
              const rate = worker.dailyRate || 2500;
              const dueToday =
                status === "full_day" ? rate : status === "half_day" ? Math.floor(rate / 2) : 0;

              return (
                <div
                  key={worker.id}
                  className={`p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    status === "full_day"
                      ? "bg-white hover:bg-emerald-50/20"
                      : status === "half_day"
                      ? "bg-amber-50/25 hover:bg-amber-50/40"
                      : "bg-slate-50/50 hover:bg-slate-100/50"
                  }`}
                >
                  {/* Colonne Gauche : Identité de l'Ouvrier */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    {/* Badge / Avatar avec 1-tap cycle */}
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleToggleCycle(worker.id)}
                      title="Cliquez pour faire défiler : Présent -> Demi-journée -> Absent"
                      className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 border transition-transform active:scale-90 cursor-pointer ${
                        status === "full_day"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : status === "half_day"
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                          : "bg-slate-200 text-slate-600 border-slate-300"
                      }`}
                    >
                      {status === "full_day" ? (
                        <Check className="w-6 h-6 stroke-[3]" />
                      ) : status === "half_day" ? (
                        <Clock className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <UserX className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>

                    {/* Informations textuelles */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {worker.firstName} {worker.lastName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-100 text-slate-600 border border-[#D5C7B8]">
                          {worker.id}
                        </span>
                        {worker.unpaidAdvances > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                            Avance : {formatFCFA(worker.unpaidAdvances)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                          {worker.functionTitle || "Journalier"}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-700">
                          {worker.domain}
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">{worker.teamName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{worker.phone}</span>
                        <span className="capitalize font-bold text-slate-700">
                          ({worker.momoOperator.replace("_", " ")})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Colonne Droite : Montant calculé & Boutons de Sélection Ergonomiques */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F0EBE3]">
                    {/* Montant Dû du Jour */}
                    <div className="text-left md:text-right pr-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Dû Aujourd&apos;hui
                      </span>
                      <span
                        className={`text-sm font-black ${
                          dueToday > 0 ? "text-emerald-800" : "text-slate-400 line-through"
                        }`}
                      >
                        {formatFCFA(dueToday)}
                      </span>
                    </div>

                    {/* Barre des 3 boutons de choix tactiles (>= 48px) */}
                    <div className="inline-flex items-center rounded-xl bg-sand-100/80 p-1 border border-[#D5C7B8] gap-1">
                      {/* 1. Présent 2 500 F */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onUpdateAttendance(worker.id, "full_day")}
                        className={`touch-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          status === "full_day"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-700 hover:bg-sand-50"
                        }`}
                        title="Journée Complète (2 500 F CFA)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Présent</span>
                        <span className="hidden sm:inline text-[10px] opacity-90">(2 500 F)</span>
                      </button>

                      {/* 2. Demi-Journée 1 250 F */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onUpdateAttendance(worker.id, "half_day")}
                        className={`touch-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          status === "half_day"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-700 hover:bg-sand-50"
                        }`}
                        title="Demi-journée (1 250 F CFA)"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>1/2 Jour</span>
                        <span className="hidden sm:inline text-[10px] opacity-90">(1 250 F)</span>
                      </button>

                      {/* 3. Absent 0 F */}
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => onUpdateAttendance(worker.id, "absent")}
                        className={`touch-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          status === "absent"
                            ? "bg-slate-600 text-white shadow-xs"
                            : "text-slate-700 hover:bg-sand-50"
                        }`}
                        title="Absent (0 F CFA)"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Absent</span>
                        <span className="hidden sm:inline text-[10px] opacity-90">(0 F)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. BARRE FLOTTANTE / PIED DE PAGE D'ACTION RAPIDE */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">
            {stats.presentCount} présents ({formatFCFA(stats.presentCount * 2500)}) + {stats.halfDayCount} demi-j ({formatFCFA(stats.halfDayCount * 1250)})
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">
            Total : <strong className="text-emerald-800">{formatFCFA(stats.totalPayrollFCFA)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#D5C7B8] hover:bg-sand-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Exporter</span>
          </button>

          <button
            type="button"
            onClick={onSaveAttendance}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95 flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Enregistrer le Pointage</span>
          </button>
        </div>
      </div>

      {/* Modale d'importation CSV de Pointage */}
      <ImportAttendanceModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workers={workers}
        dateStr={currentDate}
        onApplyAttendance={(updates) => {
          onBatchUpdateAttendance(updates);
        }}
      />
    </div>
  );
};
