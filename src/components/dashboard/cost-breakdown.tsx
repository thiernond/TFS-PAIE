"use client";

import React from "react";
import { PieChart, TrendingUp, ChevronRight } from "lucide-react";
import { ActivityCost } from "@/types/payroll";
import { formatFCFA } from "@/lib/utils/formatters";

interface CostBreakdownProps {
  activityCosts: ActivityCost[];
  onViewDetail?: () => void;
}

export const CostBreakdown: React.FC<CostBreakdownProps> = ({
  activityCosts,
  onViewDetail,
}) => {
  const totalCost = activityCosts.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5DED5] shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Coûts par Activité & Parcelle
            </h3>
            <p className="text-[11px] text-slate-500">
              Répartition analytique des dépenses de main-d&apos;œuvre
            </p>
          </div>
        </div>

        <button
          onClick={onViewDetail}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
        >
          <span>Détail</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5 pt-1">
        {activityCosts.map((act) => {
          return (
            <div key={act.activityId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{act.activityName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">
                    {formatFCFA(act.cost)}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 w-8 text-right">
                    {act.percentage}%
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full h-2 rounded-full bg-sand-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${act.percentage}%`,
                    backgroundColor: act.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-[#F0EBE3] flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-600">Total Analysé :</span>
        <span className="font-mono font-extrabold text-slate-900 text-sm">
          {formatFCFA(totalCost)}
        </span>
      </div>
    </div>
  );
};
