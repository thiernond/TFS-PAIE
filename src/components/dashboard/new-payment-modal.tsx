"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  CreditCard,
  Calendar,
  Layers,
  Calculator,
  AlertCircle,
} from "lucide-react";
import { DailyPaymentRecord, PaymentMethod, Worker } from "@/types/payroll";
import { formatFCFA, getCurrentMonthBounds, getTodayISO } from "@/lib/utils/formatters";
import { computePayslip } from "@/lib/payroll-engine";

interface NewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onAddPayment: (payment: DailyPaymentRecord) => void;
  initialPayment?: DailyPaymentRecord | null;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({
  isOpen,
  onClose,
  workers,
  onAddPayment,
  initialPayment,
}) => {
  const bounds = getCurrentMonthBounds();
  const todayStr = getTodayISO();

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || "");
  const [paymentType, setPaymentType] = useState<DailyPaymentRecord["type"]>("payroll_settlement");

  // Quinzaine (15 jours)
  const [periodPreset, setPeriodPreset] = useState("q1"); // q1 = 01-15, q2 = 16-30/31, custom
  const [periodStart, setPeriodStart] = useState(bounds.q1Start);
  const [periodEnd, setPeriodEnd] = useState(bounds.q1End);
  const [daysWorked, setDaysWorked] = useState("14"); // 14 jours travaillés par défaut
  const [dailyRate, setDailyRate] = useState("2500"); // 2 500 F CFA par jour

  // Paiement & Transaction
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wave");
  const [transactionRef, setTransactionRef] = useState(`WAV-${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [paymentDate, setPaymentDate] = useState(todayStr);

  React.useEffect(() => {
    if (initialPayment) {
      setSelectedWorkerId(initialPayment.workerId);
      setPaymentType(initialPayment.type || "payroll_settlement");
      setPeriodPreset("custom");
      setPeriodStart(initialPayment.periodStart || bounds.q1Start);
      setPeriodEnd(initialPayment.periodEnd || bounds.q1End);
      setDaysWorked(String(initialPayment.daysWorked || 14));
      setDailyRate(String(initialPayment.dailyRate || 2500));
      setPaymentMethod(initialPayment.paymentMethod || "wave");
      setTransactionRef(initialPayment.transactionRef || "");
      setPaymentDate(initialPayment.date || todayStr);
    } else if (isOpen) {
      setSelectedWorkerId(workers[0]?.id || "");
      setPaymentType("payroll_settlement");
      setPeriodPreset("q1");
      setPeriodStart(bounds.q1Start);
      setPeriodEnd(bounds.q1End);
      setDaysWorked("14");
      setDailyRate(String(workers[0]?.dailyRate || 2500));
      setPaymentMethod(workers[0]?.momoOperator || "wave");
      setTransactionRef(`WAV-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setPaymentDate(todayStr);
    }
  }, [initialPayment, isOpen, workers, bounds.q1Start, bounds.q1End, todayStr]);

  if (!isOpen) return null;

  const currentWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0];
  const unpaidAdvance = currentWorker?.unpaidAdvances || 0;

  // Calculs financiers stricts via le moteur pur computePayslip (GEMINI.md)
  const parsedDays = parseFloat(daysWorked) || 0;
  const parsedRate = parseInt(dailyRate, 10) || 2500;
  const isFullDay = parsedDays >= 1;
  const wholeDays = Math.floor(parsedDays);
  const hasHalfDay = parsedDays - wholeDays >= 0.5 ? 1 : 0;

  const payslip = computePayslip({
    daysWorked: wholeDays,
    halfDaysWorked: hasHalfDay,
    dailyRate: parsedRate,
    currentAdvanceBalance: paymentType === "payroll_settlement" ? unpaidAdvance : 0,
  });

  const grossAmount = payslip.grossAmount;
  const advanceDeduction = payslip.advanceDeduction;
  const netPayable = payslip.netPayable;

  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset === "q1") {
      setPeriodStart(bounds.q1Start);
      setPeriodEnd(bounds.q1End);
      setDaysWorked("14");
    } else if (preset === "q2") {
      setPeriodStart(bounds.q2Start);
      setPeriodEnd(bounds.q2End);
      setDaysWorked("14");
    } else if (preset === "day") {
      setPeriodStart(todayStr);
      setPeriodEnd(todayStr);
      setDaysWorked("1");
    }
  };

  const handleWorkerChange = (wId: string) => {
    setSelectedWorkerId(wId);
    const w = workers.find((item) => item.id === wId);
    if (w) {
      setDailyRate(w.dailyRate ? w.dailyRate.toString() : "2500");
      setPaymentMethod(w.momoOperator || "wave");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorker) return;

    const newRecord: DailyPaymentRecord = {
      id: initialPayment ? initialPayment.id : `PAY-Q-${Date.now().toString().slice(-6)}`,
      workerId: currentWorker.id,
      workerName: `${currentWorker.firstName} ${currentWorker.lastName}`,
      functionTitle: currentWorker.functionTitle,
      teamName: currentWorker.teamName,
      domain: currentWorker.domain || "Général",
      activityName: `${currentWorker.functionTitle} (Quinzaine du ${periodStart.slice(8)}/${periodStart.slice(5, 7)} au ${periodEnd.slice(8)}/${periodEnd.slice(5, 7)})`,
      amount: netPayable,
      paymentMethod,
      transactionRef: transactionRef || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      date: paymentDate,
      periodStart,
      periodEnd,
      daysWorked: parsedDays,
      dailyRate: parsedRate,
      advanceDeducted: advanceDeduction,
      status: "paid",
      type: paymentType,
    };

    onAddPayment(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête Fixe (Toujours visible en haut) */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C25E34] flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 text-[#C25E34]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                {initialPayment ? `Modifier le Règlement (${initialPayment.id})` : "Règlement de Quinzaine (15 jours)"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Taux standard 2 500 FCFA/j • Déduction automatique des avances
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

        {/* Formulaire complet avec corps défilant et pied fixe */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Corps défilant interne */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
            {/* Sélection de l'ouvrier avec sa fonction et son domaine */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Journalier Bénéficiaire *
              </label>
              <select
                value={selectedWorkerId}
                onChange={(e) => handleWorkerChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                required
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.firstName} {w.lastName} — {w.functionTitle} ({w.teamName} • {w.domain})
                  </option>
                ))}
              </select>
            </div>

            {/* Section Période de Quinzaine */}
            <div className="p-3 rounded-xl bg-sand-50/70 border border-[#E5DED5] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-800" />
                  <span>Période Couverte (Quinzaine 15 jours)</span>
                </span>

                {/* Raccourcis Quinzaine */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePresetChange("q1")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      periodPreset === "q1"
                        ? "bg-emerald-800 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    1ère Quinzaine (01–15)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange("q2")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                      periodPreset === "q2"
                        ? "bg-emerald-800 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    2ème Quinzaine (16–31)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date début de quinzaine *
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => {
                      setPeriodStart(e.target.value);
                      setPeriodPreset("custom");
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B8] bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Date fin de quinzaine *
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => {
                      setPeriodEnd(e.target.value);
                      setPeriodPreset("custom");
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B8] bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Jours travaillés & Taux journalier */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jours travaillés sur la période *
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="16"
                    step="0.5"
                    value={daysWorked}
                    onChange={(e) => setDaysWorked(e.target.value)}
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-slate-900 rounded-lg border border-[#D5C7B8] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Taux Journalier Appliqué *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-mono font-bold text-slate-900 rounded-lg border border-[#D5C7B8] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                      required
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[10px]">
                      FCFA/j
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Synthèse de Calcul Automatique & Déduction de l'Avance */}
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">
                  Salaire Brut ({daysWorked} jours × {dailyRate} FCFA) :
                </span>
                <strong className="font-mono text-slate-900">{formatFCFA(grossAmount)}</strong>
              </div>

              {unpaidAdvance > 0 && (
                <div className="flex justify-between text-xs text-orange-800">
                  <span>
                    Solde Avance due ({formatFCFA(unpaidAdvance)}) — Retenue immédiate :
                  </span>
                  <strong className="font-mono font-bold text-[#C25E34]">
                    - {formatFCFA(advanceDeduction)}
                  </strong>
                </div>
              )}

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                  Net Total à Payer au Journalier :
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-900">
                  {formatFCFA(netPayable)}
                </span>
              </div>
            </div>

            {/* Mode de Paiement et Référence */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mode de Paiement *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const m = e.target.value as PaymentMethod;
                    setPaymentMethod(m);
                    if (m === "wave") setTransactionRef(`WAV-${Math.floor(1000000 + Math.random() * 9000000)}`);
                    else if (m === "orange_money") setTransactionRef(`OM-${Math.floor(1000000 + Math.random() * 9000000)}`);
                    else if (m === "mtn_momo") setTransactionRef(`MTN-${Math.floor(1000000 + Math.random() * 9000000)}`);
                    else setTransactionRef(`RECU-ESP-${Math.floor(100 + Math.random() * 900)}`);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                >
                  <option value="wave">Wave (Sénégal/CI)</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_momo">MTN MoMo</option>
                  <option value="cash">Espèces (Remise en mains propres)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Réf. Transaction / Quittance
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Date de versement & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Date d&apos;Émargement
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type d&apos;Écriture
                </label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as DailyPaymentRecord["type"])}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                >
                  <option value="payroll_settlement">Règlement de Quinzaine</option>
                  <option value="daily_wage">Paiement Journalier Isolé</option>
                  <option value="advance_payout">Versement d&apos;Avance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pied Fixe (Toujours visible au bas du modal - Zero coupure) */}
          <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Net à verser
              </span>
              <span className="font-mono font-black text-emerald-900 text-sm sm:text-base">
                {formatFCFA(netPayable)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Valider le Paiement</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
