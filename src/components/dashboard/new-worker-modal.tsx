"use client";

import React, { useState } from "react";
import { X, UserPlus, Check, Briefcase, Layers } from "lucide-react";
import { Worker, PaymentMethod, Team, Activity, FarmDomain } from "@/types/payroll";

interface NewWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  activities: Activity[];
  domains?: FarmDomain[];
  onAddWorker: (worker: Worker) => void;
  initialWorker?: Worker | null;
}

export const NewWorkerModal: React.FC<NewWorkerModalProps> = ({
  isOpen,
  onClose,
  teams,
  activities,
  domains,
  onAddWorker,
  initialWorker,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [teamId, setTeamId] = useState(teams[0]?.id || "");
  const [functionTitle, setFunctionTitle] = useState("Récolteur & Triage");
  const [domain, setDomain] = useState("Maraîchage");
  const [momoOperator, setMomoOperator] = useState<PaymentMethod>("wave");
  const [momoNumber, setMomoNumber] = useState("");
  const [dailyRate, setDailyRate] = useState("2500"); // 2 500 F CFA standard

  React.useEffect(() => {
    if (initialWorker) {
      setFirstName(initialWorker.firstName);
      setLastName(initialWorker.lastName);
      setPhone(initialWorker.phone);
      setTeamId(initialWorker.teamId || teams[0]?.id || "");
      setFunctionTitle(initialWorker.functionTitle || "Journalier Polyvalent");
      setDomain(initialWorker.domain || "Maraîchage");
      setMomoOperator(initialWorker.momoOperator || "wave");
      setMomoNumber(initialWorker.momoNumber || initialWorker.phone || "");
      setDailyRate(String(initialWorker.dailyRate || 2500));
    } else if (isOpen) {
      setFirstName("");
      setLastName("");
      setPhone("");
      setTeamId(teams[0]?.id || "");
      setFunctionTitle("Récolteur & Triage");
      setDomain("Maraîchage");
      setMomoOperator("wave");
      setMomoNumber("");
      setDailyRate("2500");
    }
  }, [initialWorker, isOpen, teams]);

  if (!isOpen) return null;

  const domainsList =
    domains && domains.length > 0
      ? domains.map((d) => d.name)
      : [
          "Maraîchage",
          "Vergers & Manguiers",
          "Grandes Cultures",
          "Élevage & Bassins",
          "Général / Transversal",
        ];

  const suggestedFunctions = [
    "Récolteur & Triage",
    "Désherbeur Manuel",
    "Pépiniériste & Repiquage",
    "Arroseur & Goutte-à-goutte",
    "Chauffeur Tracteur",
    "Épandeur Engrais Organique",
    "Soigneur Bétail & Volaille",
    "Pisciculteur",
    "Magasinier & Stock",
    "Journalier Polyvalent",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    const team = teams.find((t) => t.id === teamId);

    const newWorker: Worker = {
      id: initialWorker ? initialWorker.id : `w-${Date.now().toString().slice(-4)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim() || "+221 ",
      teamId: team?.id || initialWorker?.teamId || "team-1",
      teamName: team?.name || initialWorker?.teamName || "Équipe Maraîchage",
      functionTitle: functionTitle.trim() || "Journalier Polyvalent",
      domain,
      momoOperator,
      momoNumber: momoNumber.trim() || phone.trim(),
      dailyRate: Math.min(500000, Math.max(500, parseInt(dailyRate, 10) || 2500)),
      status: initialWorker?.status || "active",
      hiredAt: initialWorker?.hiredAt || new Date().toISOString().split("T")[0],
      unpaidAdvances: initialWorker?.unpaidAdvances || 0,
    };

    onAddWorker(newWorker);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {initialWorker ? "Modifier la Fiche Journalier" : "Nouveau Journalier Agricole"}
              </h3>
              <p className="text-xs text-slate-500">
                {initialWorker
                  ? `Mise à jour de ${initialWorker.firstName} ${initialWorker.lastName}`
                  : "Enregistrement de la fiche avec fonction et domaine"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Ibrahima"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Diallo"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            {/* Fonction et Domaine (Demandé expressément par l'utilisateur) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div>
                <label className="block font-bold text-emerald-950 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Fonction / Poste *</span>
                </label>
                <input
                  type="text"
                  list="functions-list"
                  value={functionTitle}
                  onChange={(e) => setFunctionTitle(e.target.value)}
                  placeholder="Ex: Récolteur, Désherbeur..."
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
                <datalist id="functions-list">
                  {suggestedFunctions.map((fn) => (
                    <option key={fn} value={fn} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block font-bold text-emerald-950 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Domaine / Parcelle *</span>
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {domainsList.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Équipe et Taux Journalier (2 100 F CFA) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Équipe Affectée *
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Chef: {t.supervisorName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Taux Journalier Standard *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="500"
                    max="500000"
                    step="100"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 rounded-lg border border-[#D5C7B8] bg-sand-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[11px]">
                    FCFA / jour
                  </span>
                </div>
              </div>
            </div>

            {/* Moyen de Paiement et Téléphone Mobile Money */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Opérateur Mobile Money
                </label>
                <select
                  value={momoOperator}
                  onChange={(e) => setMomoOperator(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="wave">Wave (Sénégal/CI)</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="mtn_momo">MTN MoMo</option>
                  <option value="cash">Espèces uniquement</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Numéro Mobile Money / Tél.
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +221 77 123 45 67"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialWorker ? "Enregistrer les Modifications" : "Créer la Fiche Journalier"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
