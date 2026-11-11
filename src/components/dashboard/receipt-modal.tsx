"use client";

import React from "react";
import { X, Printer, Share2, CheckCircle2, Sprout } from "lucide-react";
import { DailyPaymentRecord, CompanySettings } from "@/types/payroll";
import { formatFCFA, formatDateFR, getOperatorInfo } from "@/lib/utils/formatters";

interface ReceiptModalProps {
  payment: DailyPaymentRecord | null;
  onClose: () => void;
  companySettings?: CompanySettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ payment, onClose, companySettings }) => {
  if (!payment) return null;

  const opInfo = getOperatorInfo(payment.paymentMethod);

  const isQuinzaine = payment.periodStart && payment.periodEnd && payment.periodStart !== payment.periodEnd;
  const periodLabel = isQuinzaine
    ? `Quinzaine du ${formatDateFR(payment.periodStart)} au ${formatDateFR(payment.periodEnd)}`
    : `Journée du ${formatDateFR(payment.date)}`;

  const companyName = companySettings?.companyName || "Domaine Agricole des Niayes";
  const registration = companySettings?.registrationNumber ? ` (NINEA: ${companySettings.registrationNumber})` : "";

  const handleShareWhatsApp = () => {
    const text = `*REÇU DE PAIE TFS PAIE*\n${companyName}${registration}\n--------------------------\n*Journalier :* ${payment.workerName}\n*Fonction :* ${payment.functionTitle || "Ouvrier agricole"}\n*Domaine :* ${payment.domain || payment.teamName}\n*Période :* ${periodLabel}\n*Prestation :* ${payment.daysWorked ? `${payment.daysWorked} jours @ ${formatFCFA(payment.dailyRate || 2500)}/j` : "Forfait journalier"}\n${payment.advanceDeducted ? `*Avance déduite :* -${formatFCFA(payment.advanceDeducted)}\n` : ""}*Net Payé :* ${formatFCFA(payment.amount)}\n*Règlement :* ${opInfo.label} (Réf: ${payment.transactionRef})\n*Date paiement :* ${formatDateFR(payment.date)}\n--------------------------\nQuittance de paie certifiée & émargée.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête Fixe */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Bulletin / Reçu de Quinzaine
              </h3>
              <p className="text-[11px] text-slate-500">Justificatif d&apos;émargement de salaire</p>
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

        {/* Corps Défilant */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
          {/* Fiche reçu format quittance propre */}
          <div className="bg-sand-50 rounded-xl p-4 sm:p-5 border border-[#E5DED5] space-y-3.5 font-sans print:border-none print:shadow-none">
          {/* Logo et Société */}
          <div className="text-center pb-3 border-b border-dashed border-[#D5C7B8] space-y-1">
            {companySettings?.logoUrl ? (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white p-1 border border-[#E5DED5] shadow-2xs mb-1 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-800 text-white mb-1">
                <Sprout className="w-5 h-5" />
              </div>
            )}
            <h4 className="font-extrabold text-sm text-slate-900 tracking-wide uppercase">
              {companySettings?.companyName || "DOMAINE AGRICOLE DES NIAYES"}
            </h4>
            <p className="text-[11px] text-slate-600">
              {companySettings?.address || "Route Nationale 2"} • {companySettings?.region || "Thiès"}
            </p>
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-[#E5DED5]">
              N° {payment.id}
            </span>
          </div>

          {/* Détails du Paiement & de la Quinzaine */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Journalier :</span>
              <strong className="text-slate-900">{payment.workerName}</strong>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Fonction / Poste :</span>
              <span className="font-bold text-emerald-800">{payment.functionTitle || "Journalier"}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Domaine / Parcelle :</span>
              <span className="text-slate-800 font-medium">{payment.domain || payment.teamName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Période Couverte :</span>
              <span className="font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                {periodLabel}
              </span>
            </div>

            {payment.daysWorked && (
              <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
                <span className="text-slate-500">Jours travaillés :</span>
                <span className="font-mono font-medium text-slate-800">
                  {payment.daysWorked} jours × {formatFCFA(payment.dailyRate || 2500)}/j
                </span>
              </div>
            )}

            {payment.advanceDeducted ? (
              <div className="flex justify-between py-1 border-b border-[#F0EBE3] text-[#C25E34]">
                <span>Remboursement d&apos;avance déduit :</span>
                <span className="font-mono font-bold">
                  -{formatFCFA(payment.advanceDeducted)}
                </span>
              </div>
            ) : null}

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Règlement :</span>
              <span className="font-bold text-slate-800">{opInfo.label}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Réf. Transaction :</span>
              <span className="font-mono text-[11px] font-bold text-slate-800">
                {payment.transactionRef}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#F0EBE3]">
              <span className="text-slate-500">Date d&apos;Émargement :</span>
              <span className="text-slate-800">{formatDateFR(payment.date)}</span>
            </div>
          </div>

          {/* Montant Net Payé */}
          <div className="pt-2 text-center bg-white rounded-lg p-3 border border-emerald-200">
            <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">
              Net Perçu par le Journalier
            </span>
            <div className="text-2xl font-black font-mono text-emerald-900 mt-0.5">
              {formatFCFA(payment.amount)}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">
              Quinzaine acquittée • Quittance libératoire
            </span>
            </div>
          </div>
        </div>

        {/* Boutons d'Action Fixes */}
        <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Partager WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-2 px-3 rounded-xl text-slate-600 hover:bg-slate-200/70 text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
