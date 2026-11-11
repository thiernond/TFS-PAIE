"use client";

import React, { useState } from "react";
import {
  X,
  CalendarCheck,
  Check,
  Clock,
  UserX,
  CheckCheck,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { Worker, AttendanceType, Team } from "@/types/payroll";
import { formatFCFA, formatDateFR, getTodayISO } from "@/lib/utils/formatters";

interface QuickAttendanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  teams: Team[];
  onSaveAttendance: (attendances: Record<string, AttendanceType>) => void;
}

export const QuickAttendanceDrawer: React.FC<QuickAttendanceDrawerProps> = ({
  isOpen,
  onClose,
  workers,
  teams,
  onSaveAttendance,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  // State for worker attendance: workerId -> status
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceType>>(() => {
    const initial: Record<string, AttendanceType> = {};
    workers.forEach((w) => {
      initial[w.id] = "full_day"; // Présent par défaut
    });
    return initial;
  });

  const [isLocked, setIsLocked] = useState(false);

  if (!isOpen) return null;

  const filteredWorkers =
    selectedTeamId === "all"
      ? workers
      : workers.filter((w) => w.teamId === selectedTeamId);

  // Cycle through states: full_day -> half_day -> absent -> full_day
  const handleTap = (workerId: string) => {
    if (isLocked) return;
    setAttendanceState((prev) => {
      const current = prev[workerId] || "full_day";
      let next: AttendanceType = "full_day";
      if (current === "full_day") next = "half_day";
      else if (current === "half_day") next = "absent";
      else if (current === "absent") next = "full_day";
      return { ...prev, [workerId]: next };
    });
  };

  // Bulk action: Mark all filtered present
  const handleMarkAllPresent = () => {
    if (isLocked) return;
    setAttendanceState((prev) => {
      const next = { ...prev };
      filteredWorkers.forEach((w) => {
        next[w.id] = "full_day";
      });
      return next;
    });
  };

  const handleSave = () => {
    onSaveAttendance(attendanceState);
    onClose();
  };

  // Stats calculation
  const presentCount = filteredWorkers.filter(
    (w) => (attendanceState[w.id] || "full_day") === "full_day"
  ).length;
  const halfDayCount = filteredWorkers.filter(
    (w) => attendanceState[w.id] === "half_day"
  ).length;
  const absentCount = filteredWorkers.filter(
    (w) => attendanceState[w.id] === "absent"
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête Fixe (Toujours visible en haut) */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  Pointage Rapide du Jour
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {formatDateFR(getTodayISO())}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                1-tap = Présent (2 500 F) • 2-taps = ½ Journée (1 250 F) • 3-taps = Absent
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Défilant (Défilement fluide interne) */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3.5 text-xs">
          {/* Barre de sélection d'équipe et action de masse */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-sand-50/80 p-2.5 sm:p-3 rounded-xl border border-[#E5DED5]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedTeamId("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedTeamId === "all"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                Toutes ({workers.length})
              </button>
              {teams.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedTeamId === t.id
                      ? "bg-emerald-800 text-white shadow-2xs"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tous Présents</span>
            </button>
          </div>

          {/* Compteurs de synthèse rapide */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 block">Présents (1.0)</span>
              <span className="text-xl font-black text-emerald-900">{presentCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] font-bold text-amber-800 block">½ Journées (0.5)</span>
              <span className="text-xl font-black text-amber-900">{halfDayCount}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block">Absents (0.0)</span>
              <span className="text-xl font-black text-slate-800">{absentCount}</span>
            </div>
          </div>

          {/* Liste tactile des ouvriers */}
          <div className="space-y-2">
            {filteredWorkers.map((w) => {
              const status = attendanceState[w.id] || "full_day";

              let bgClass = "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-50";
              let badgeText = "PRÉSENT";
              let badgeBg = "bg-emerald-700 text-white";
              let Icon = Check;

              if (status === "half_day") {
                bgClass = "bg-amber-50/70 border-amber-300 text-amber-950 hover:bg-amber-50";
                badgeText = "½ JOUR";
                badgeBg = "bg-amber-600 text-white";
                Icon = Clock;
              } else if (status === "absent") {
                bgClass = "bg-slate-100/80 border-slate-300 text-slate-500 opacity-70 hover:opacity-100";
                badgeText = "ABSENT";
                badgeBg = "bg-slate-400 text-white";
                Icon = UserX;
              }

              return (
                <div
                  key={w.id}
                  onClick={() => handleTap(w.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all active:scale-[0.99] shadow-2xs ${bgClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-white border border-current flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {w.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {w.firstName} {w.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-600 truncate">
                        <span className="font-semibold text-emerald-800">{w.functionTitle || w.teamName}</span> • Taux: {formatFCFA(w.dailyRate || 2500)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeBg}`}>
                      {badgeText}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-xs">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pied Fixe (Toujours visible en bas - Clôture & Sauvegarde) */}
        <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/95 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 self-start sm:self-center">
            <input
              type="checkbox"
              id="lock-day"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700"
            />
            <label htmlFor="lock-day" className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Clôturer et verrouiller la journée</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors flex-1 sm:flex-none text-center"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer le Pointage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
