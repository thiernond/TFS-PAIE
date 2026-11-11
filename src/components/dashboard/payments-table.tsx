"use client";

import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { DailyPaymentRecord } from "@/types/payroll";
import { formatFCFA, formatDateFR, getOperatorInfo } from "@/lib/utils/formatters";

interface PaymentsTableProps {
  payments: DailyPaymentRecord[];
  onEditPayment: (payment: DailyPaymentRecord) => void;
  onDeletePayment: (paymentId: string) => void;
  onViewReceipt: (payment: DailyPaymentRecord) => void;
}

export const PaymentsTable: React.FC<PaymentsTableProps> = ({
  payments,
  onEditPayment,
  onDeletePayment,
  onViewReceipt,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Pagination calculation
  const totalItems = payments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onDeletePayment(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5DED5] shadow-card overflow-hidden">
      {/* Tableau responsive avec défilement horizontal fluide sur mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5DED5] bg-sand-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4 w-16">ID</th>
              <th className="py-3.5 px-4 min-w-[200px]">Journalier & Activité</th>
              <th className="py-3.5 px-4 min-w-[120px]">Moyen & Réf.</th>
              <th className="py-3.5 px-4 text-right min-w-[130px]">Montant</th>
              <th className="py-3.5 px-4 min-w-[110px]">Date</th>
              <th className="py-3.5 px-4 text-center min-w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3] text-xs">
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Aucun paiement trouvé</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Modifiez vos filtres de dates ou enregistrez un nouveau paiement.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((p, index) => {
                const opInfo = getOperatorInfo(p.paymentMethod);
                const displayId = startIndex + index + 1;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-sand-50/60 transition-colors group"
                  >
                    {/* ID (Identique à la capture) */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {displayId}
                    </td>

                    {/* Description : Journalier, Fonction, Domaine et Période Quinzaine */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-emerald-200">
                          {p.workerName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                              {p.workerName}
                            </p>
                            {p.functionTitle && (
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-sand-100 text-slate-700 border border-[#D5C7B8]">
                                {p.functionTitle}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                            <span className="font-medium text-emerald-700">{p.domain || p.teamName}</span>
                            <span>•</span>
                            <span className="font-medium text-amber-800 bg-amber-50 px-1 rounded border border-amber-200/60">
                              {p.periodStart && p.periodEnd && p.periodStart !== p.periodEnd
                                ? `Quinzaine ${formatDateFR(p.periodStart)} au ${formatDateFR(p.periodEnd)}`
                                : "Paiement journalier"}
                            </span>
                            {p.daysWorked && (
                              <span className="text-slate-500">
                                ({p.daysWorked}j @ {p.dailyRate || 2500} F)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Mode de règlement & Référence MoMo */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${opInfo.badgeBg} w-fit`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opInfo.dotColor}`} />
                          {opInfo.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-600">
                          {p.transactionRef}
                        </span>
                      </div>
                    </td>

                    {/* Montant (Formaté FCFA) */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-extrabold text-sm text-slate-900">
                        {formatFCFA(p.amount)}
                      </span>
                      {p.advanceDeducted ? (
                        <span className="block text-[10px] text-[#C25E34] font-medium">
                          Avance déduite: -{formatFCFA(p.advanceDeducted)}
                        </span>
                      ) : null}
                      {p.type === "piece_rate" && (
                        <span className="block text-[10px] text-sky-800 font-medium">
                          Rendement
                        </span>
                      )}
                      {p.type === "advance_payout" && (
                        <span className="block text-[10px] text-[#C25E34] font-medium">
                          Avance versée
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {formatDateFR(p.date)}
                    </td>

                    {/* Actions : Boutons bleus EDIT et rouges DELETE calqués sur la capture */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Bouton EDIT (Bleu roi identique à la capture) */}
                        <button
                          onClick={() => onEditPayment(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1976D2] hover:bg-[#1565C0] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition-transform active:scale-95"
                          title="Modifier ce paiement"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>EDIT</span>
                        </button>

                        {/* Bouton REÇU WHATSAPP (Spécificité terrain essentielle) */}
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition-transform active:scale-95"
                          title="Générer reçu / partager WhatsApp"
                        >
                          <Receipt className="w-3 h-3" />
                          <span className="hidden sm:inline">REÇU</span>
                        </button>

                        {/* Bouton DELETE (Rouge vif identique à la capture) */}
                        <button
                          onClick={() => handleDeleteClick(p.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#D32F2F] hover:bg-[#C62828] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs transition-transform active:scale-95"
                          title="Supprimer la transaction"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>DELETE</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (Calqué sur la capture : items per page, 1-10 of 700, navigation) */}
      <div className="p-3 sm:p-4 border-t border-[#E5DED5] bg-sand-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-slate-600">
            Lignes par page :
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded border border-[#D5C7B8] bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <span className="font-medium text-slate-700">
            {totalItems === 0
              ? "0 sur 0"
              : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalItems)} sur ${totalItems}`}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              title="Première page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-0.5 rounded bg-white border border-[#D5C7B8] font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-700"
              title="Dernière page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modale de Confirmation de Suppression Sécurisée */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Confirmer la suppression
                </h3>
                <p className="text-xs text-slate-500">
                  Cette action enregistrera une ligne d&apos;audit d&apos;annulation.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-sand-50 p-3 rounded-lg border border-[#E5DED5]">
              Êtes-vous certain de vouloir supprimer cette transaction de paiement ? Les écritures comptables et l&apos;historique de l&apos;ouvrier seront mis à jour.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-300"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#D32F2F] hover:bg-[#C62828] text-white shadow"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
