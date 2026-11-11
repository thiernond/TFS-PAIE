"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Phone,
  Download,
  Users,
  Calendar,
  Wallet,
  ArrowDownLeft,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Worker, Team, PaymentMethod } from "@/types/payroll";
import { formatFCFA, getOperatorInfo } from "@/lib/utils/formatters";
import { exportAdvancesToCsv } from "@/lib/utils/csv-export";

interface AdvanceRecord {
  id: string;
  workerId: string;
  workerName: string;
  functionTitle: string;
  domain: string;
  teamName: string;
  amount: number; // en FCFA
  motif: string;
  dateGranted: string;
  disbursementMethod: PaymentMethod;
  status: "pending" | "deducted" | "partial";
  deductedAmount: number;
}

interface AvancesViewProps {
  workers: Worker[];
  teams: Team[];
  onGrantAdvance: (workerId: string, amount: number, motif: string, method: PaymentMethod) => void;
  onSettleAdvance: (workerId: string, amountToSettle: number) => void;
}

export const AvancesView: React.FC<AvancesViewProps> = ({
  workers,
  teams,
  onGrantAdvance,
  onSettleAdvance,
}) => {
  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [filterBalanceOnly, setFilterBalanceOnly] = useState(true);

  // Modale d'octroi d'avance
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(workers[0]?.id || "");
  const [advanceAmount, setAdvanceAmount] = useState<number>(5000);
  const [advanceMotif, setAdvanceMotif] = useState<string>("Urgence médicale / santé");
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>("wave");

  // Modale de remboursement partiel / manuel
  const [settleWorker, setSettleWorker] = useState<Worker | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // Ouvriers filtrés
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (filterBalanceOnly && (!w.unpaidAdvances || w.unpaidAdvances <= 0)) {
        return false;
      }
      if (selectedTeam !== "all" && w.teamName !== selectedTeam && w.teamId !== selectedTeam) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const fullName = `${w.firstName} ${w.lastName}`.toLowerCase();
        const phone = w.phone.toLowerCase();
        const func = (w.functionTitle || "").toLowerCase();
        if (!fullName.includes(q) && !phone.includes(q) && !func.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [workers, filterBalanceOnly, selectedTeam, searchQuery]);

  // Statistiques globales
  const totalPendingAdvances = useMemo(() => {
    return workers.reduce((acc, w) => acc + (w.unpaidAdvances || 0), 0);
  }, [workers]);

  const workersWithAdvancesCount = useMemo(() => {
    return workers.filter((w) => (w.unpaidAdvances || 0) > 0).length;
  }, [workers]);

  const handleOpenGrantModal = () => {
    if (workers.length > 0) {
      setSelectedWorkerId(workers[0].id);
      setAdvanceAmount(5000);
      setAdvanceMotif("Urgence médicale / ordonnance");
      setAdvanceMethod("wave");
      setIsGrantModalOpen(true);
    }
  };

  const handleSubmitGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || advanceAmount <= 0) return;
    onGrantAdvance(selectedWorkerId, advanceAmount, advanceMotif, advanceMethod);
    setIsGrantModalOpen(false);
  };

  const handleOpenSettleModal = (worker: Worker) => {
    setSettleWorker(worker);
    setSettleAmount(worker.unpaidAdvances || 0);
  };

  const handleSubmitSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleWorker || settleAmount <= 0) return;
    onSettleAdvance(settleWorker.id, Math.min(settleAmount, settleWorker.unpaidAdvances));
    setSettleWorker(null);
  };

  // Export CSV clair et détaillé du registre des avances
  const handleExportCSV = () => {
    exportAdvancesToCsv(workers, ";");
  };

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. CARTOUCHE D'EN-TÊTE : CONTEXTE & OCTROI RAPIDE */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5DED5] shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#C25E34] flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 text-[#C25E34]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Registre des Avances sur Salaire
              </h2>
              <p className="text-xs text-slate-500">
                Acomptes accordés • Déduction automatique intégrale dès la prochaine quinzaine de paie
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="touch-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sand-50 hover:bg-sand-100 text-slate-700 font-bold text-xs border border-[#D5C7B8] transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-800" />
              <span>Exporter État (CSV)</span>
            </button>

            <button
              onClick={handleOpenGrantModal}
              className="touch-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs shadow-md transition-transform active:scale-95 uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>+ Octroyer une Avance</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIS SPÉCIFIQUES AUX AVANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Solde Restant Dû */}
        <div className="bg-white p-4 rounded-xl border border-[#E5DED5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Solde des Avances en Cours
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 block mt-0.5">
              {formatFCFA(totalPendingAdvances)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              À prélever sur les prochaines quinzaines
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Journaliers Concernés */}
        <div className="bg-white p-4 rounded-xl border border-[#E5DED5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Journaliers Débiteurs
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {workersWithAdvancesCount}
              </span>
              <span className="text-xs text-slate-500">/ {workers.length} ouvriers</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Actuellement détenteurs d&apos;un solde d&apos;avance
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Règle de Recouvrement Immuable */}
        <div className="bg-gradient-to-br from-emerald-50 to-sand-50 p-4 rounded-xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
              Règle d&apos;Amortissement Paie
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
              Remboursement Intégral Immédiat
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
              Déduit automatiquement lors du calcul de la quinzaine (Net = Brut - Avance)
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. BARRE DE FILTRAGE DES AVANCES */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone ou fonction..."
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

          <div className="w-full sm:w-56">
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

          <button
            type="button"
            onClick={() => setFilterBalanceOnly(!filterBalanceOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
              filterBalanceOnly
                ? "bg-rose-50 border-rose-300 text-rose-800"
                : "bg-sand-50 border-[#D5C7B8] text-slate-700"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Soldes Débiteurs Uniquement ({workersWithAdvancesCount})</span>
          </button>
        </div>
      </div>

      {/* 4. TABLEAU DU SUIVI DES AVANCES */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5DED5] bg-sand-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Journalier Agricole</th>
                <th className="py-3 px-4">Fonction & Domaine</th>
                <th className="py-3 px-4">Équipe</th>
                <th className="py-3 px-4">Moyen Prévu</th>
                <th className="py-3 px-4 text-right">Solde Avance Dû</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE3]">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Aucune avance en cours pour cette sélection</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tous les journaliers sélectionnés sont à jour sur leurs acomptes.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => {
                  const hasAdvance = (w.unpaidAdvances || 0) > 0;
                  const opInfo = getOperatorInfo(w.momoOperator);

                  return (
                    <tr key={w.id} className="hover:bg-sand-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {w.firstName.charAt(0)}
                            {w.lastName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {w.firstName} {w.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {w.id} • {w.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] block w-fit">
                          {w.functionTitle || "Journalier Polyvalent"}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {w.domain}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {w.teamName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${opInfo.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${opInfo.dotColor}`} />
                          <span>{opInfo.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {hasAdvance ? (
                          <span className="font-black text-rose-700 text-sm">
                            {formatFCFA(w.unpaidAdvances)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">— (0 F CFA)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedWorkerId(w.id);
                              setAdvanceAmount(5000);
                              setIsGrantModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#C25E34] text-[11px] font-bold border border-orange-200 transition-colors"
                            title="Accorder une avance supplémentaire"
                          >
                            + Avance
                          </button>

                          {hasAdvance && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettleModal(w)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors"
                              title="Enregistrer un remboursement direct en espèces/MoMo"
                            >
                              Régler
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE D'OCTROI D'AVANCE SUR SALAIRE */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C25E34] flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-[#C25E34]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Octroyer une Avance sur Salaire
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Déduction intégrale sur la prochaine paie de quinzaine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitGrant} className="p-5 space-y-4 text-xs">
              {/* Choix de l'ouvrier */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Journalier Bénéficiaire *
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50/50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName} ({w.teamName} • Solde actuel : {formatFCFA(w.unpaidAdvances || 0)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorker && selectedWorker.unpaidAdvances > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Attention : Cet ouvrier a déjà un solde impayé de <strong>{formatFCFA(selectedWorker.unpaidAdvances)}</strong>.
                  </span>
                </div>
              )}

              {/* Montant de l'avance */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Montant Accordé (en FCFA strict) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={500}
                    min={500}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[11px] text-slate-500">
                    F CFA
                  </span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[2500, 5000, 10000, 15000, 20000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setAdvanceAmount(quick)}
                      className="px-2 py-0.5 rounded-md bg-sand-100 hover:bg-sand-200 text-[10px] font-bold text-slate-700 border border-[#D5C7B8]"
                    >
                      {quick.toLocaleString("fr-FR")} F
                    </button>
                  ))}
                </div>
              </div>

              {/* Motif de l'avance */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motif / Justification
                </label>
                <input
                  type="text"
                  value={advanceMotif}
                  onChange={(e) => setAdvanceMotif(e.target.value)}
                  placeholder="Ex: Urgence médicale, transport, frais scolaires..."
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50/50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Mode de versement */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mode de Décaissement de l&apos;Acompte
                </label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50/50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="wave">Wave (Transfert instantané)</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cash">Espèces (Caisse ferme)</option>
                  <option value="mtn_momo">MTN Mobile Money</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#F0EBE3] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95"
                >
                  Confirmer l&apos;Avance ({formatFCFA(advanceAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE RÈGLEMENT DIRECT / MANUEL D'UNE AVANCE */}
      {settleWorker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Régler le Solde de l&apos;Avance
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {settleWorker.firstName} {settleWorker.lastName} ({settleWorker.teamName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettleWorker(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSettle} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-sand-50 border border-[#D5C7B8] flex items-center justify-between">
                <span className="font-bold text-slate-700">Solde Débiteur Actuel :</span>
                <span className="text-base font-black text-rose-700 font-mono">
                  {formatFCFA(settleWorker.unpaidAdvances || 0)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Montant à Rembourser / Régler *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    max={settleWorker.unpaidAdvances || 0}
                    min={500}
                    step={500}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-[#D5C7B8] font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[11px] text-slate-500">
                    F CFA
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EBE3] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSettleWorker(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-transform active:scale-95"
                >
                  Enregistrer Remboursement ({formatFCFA(settleAmount)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
