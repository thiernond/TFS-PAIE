"use client";

import React from "react";
import {
  Clock,
  ArrowRight,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import { ActionableTask } from "@/types/payroll";

interface TodoTasksProps {
  tasks: ActionableTask[];
  onExecuteTask: (taskId: string) => void;
}

export const TodoTasks: React.FC<TodoTasksProps> = ({
  tasks,
  onExecuteTask,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DED5] shadow-card space-y-4 overflow-hidden">
      {/* En-tête de section */}
      <div className="flex items-center justify-between gap-2 border-b border-[#F0EBE3] pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 border border-amber-200/60">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider leading-tight truncate">
              À Faire & Clôtures
            </h3>
            <p className="text-[11px] text-slate-500 truncate">
              Actions de gestion prioritaires pour l&apos;exploitation
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80 shrink-0 whitespace-nowrap">
          {tasks.length} urgences
        </span>
      </div>

      {/* Cartes de tâches structurées verticalement sans aucun risque de décalage */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isHigh = task.urgency === "high";

          return (
            <div
              key={task.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-2xs space-y-2.5 overflow-hidden ${
                isHigh
                  ? "bg-[#FFFBF5] border-amber-200/90 hover:border-amber-400 hover:bg-white"
                  : "bg-sand-50/50 border-[#E5DED5] hover:border-emerald-300 hover:bg-white"
              }`}
            >
              {/* Ligne 1 : Titre sur toute la largeur + Badge de priorité */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                      isHigh ? "bg-amber-500 ring-2 ring-amber-200" : "bg-emerald-500"
                    }`}
                  />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-snug break-words">
                    {task.title}
                  </h4>
                </div>

                {isHigh ? (
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 shrink-0 whitespace-nowrap">
                    Prioritaire
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0 whitespace-nowrap">
                    À traiter
                  </span>
                )}
              </div>

              {/* Ligne 2 : Description complète et aérée sans coupure de mots */}
              <p className="text-xs text-slate-600 leading-relaxed pl-4">
                {task.description}
              </p>

              {/* Ligne 3 : Bouton d'action pleine largeur (w-full) - Zéro décalage, alignement impeccable */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onExecuteTask(task.id)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-transform active:scale-[0.98]"
                >
                  <span>{task.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
