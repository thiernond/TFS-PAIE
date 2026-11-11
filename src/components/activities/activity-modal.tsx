"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Layers,
  Sparkles,
  AlertCircle,
  Tag,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Activity } from "@/types/payroll";
import { formatFCFA } from "@/lib/utils/formatters";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: Activity[];
  onSaveActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activities,
  onSaveActivity,
  onDeleteActivity,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("Maraîchage");
  const [isPieceRate, setIsPieceRate] = useState(false);
  const [unitName, setUnitName] = useState("Journée");
  const [defaultUnitRate, setDefaultUnitRate] = useState("2500");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all");

  if (!isOpen) return null;

  const domainsList = [
    "Maraîchage",
    "Vergers & Manguiers",
    "Grandes Cultures",
    "Élevage & Bassins",
    "Transversal / Général",
  ];

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setDomain("Maraîchage");
    setIsPieceRate(false);
    setUnitName("Journée");
    setDefaultUnitRate("2500");
    setIsFormOpen(true);
  };

  const handleEdit = (act: Activity) => {
    setEditingId(act.id);
    setName(act.name);
    setDomain(act.domain || "Maraîchage");
    setIsPieceRate(act.isPieceRate);
    setUnitName(act.unitName || (act.isPieceRate ? "Caisse" : "Journée"));
    setDefaultUnitRate((act.defaultUnitRate || 2500).toString());
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedActivity: Activity = {
      id: editingId || `act-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      domain,
      isPieceRate,
      unitName: isPieceRate ? unitName : "Journée",
      defaultUnitRate: parseInt(defaultUnitRate, 10) || (isPieceRate ? 400 : 2500),
      isActive: true,
    };

    onSaveActivity(savedActivity);
    setIsFormOpen(false);
    setEditingId(null);
  };

  const filteredActivities =
    selectedDomainFilter === "all"
      ? activities
      : activities.filter((a) => a.domain === selectedDomainFilter);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Fixe */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Gestion des Activités & Domaines Agricoles
              </h3>
              <p className="text-[11px] text-slate-500">
                Créez, modifiez et configurez les tâches (au temps ou au rendement)
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

        {/* Corps Défilant */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs">
          {/* Bouton d'ajout et Filtres par Domaine */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sand-50 p-3 rounded-xl border border-[#E5DED5]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
              onClick={() => setSelectedDomainFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedDomainFilter === "all"
                  ? "bg-emerald-800 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tous ({activities.length})
            </button>
            {domainsList.map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomainFilter(dom)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedDomainFilter === dom
                    ? "bg-emerald-800 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {dom}
              </button>
            ))}
          </div>

          <button
            onClick={handleOpenNew}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#C25E34] hover:bg-[#A94F2B] text-white text-xs font-bold shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Activité</span>
          </button>
        </div>

        {/* Formulaire d'édition / création inline */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3.5 animate-in slide-in-from-top-2 text-xs"
          >
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-extrabold text-emerald-900 text-sm">
                {editingId ? "Modifier l'Activité" : "Créer une Nouvelle Activité"}
              </span>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nom de l&apos;Activité *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Récolte Poivrons, Désherbage Lignes..."
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Domaine / Filière Agricole *
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Type de Rémunération
                </label>
                <select
                  value={isPieceRate ? "piece" : "daily"}
                  onChange={(e) => {
                    const isPiece = e.target.value === "piece";
                    setIsPieceRate(isPiece);
                    if (isPiece) {
                      setUnitName("Caisse");
                      setDefaultUnitRate("400");
                    } else {
                      setUnitName("Journée");
                      setDefaultUnitRate("2500");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="daily">Au temps (2 500 FCFA/jour)</option>
                  <option value="piece">Au Rendement / Tâche (kg, caisses...)</option>
                </select>
              </div>

              {isPieceRate && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Unité de Mesure
                  </label>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="Ex: Caisse, Sac 50kg, Ligne, Kg"
                    className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tarif Unitaire (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={defaultUnitRate}
                    onChange={(e) => setDefaultUnitRate(e.target.value)}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 rounded-lg border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[11px]">
                    FCFA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? "Enregistrer les Modifications" : "Créer l'Activité"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Liste des Activités */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-700">Aucune activité dans ce domaine</p>
              <p className="text-xs">Cliquez sur &quot;Nouvelle Activité&quot; pour en ajouter une.</p>
            </div>
          ) : (
            filteredActivities.map((act) => {
              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-[#E5DED5] bg-sand-50/50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-xs text-slate-900">
                        {act.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {act.domain}
                      </span>
                      {act.isPieceRate ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                          Rendement ({act.unitName})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Taux Journalier
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Tarif appliqué :{" "}
                      <strong className="text-slate-900 font-mono font-bold">
                        {formatFCFA(act.defaultUnitRate || 2500)}
                      </strong>{" "}
                      {act.isPieceRate ? `par ${act.unitName}` : "par jour"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleEdit(act)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200 transition-colors"
                      title="Modifier l'activité"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => onDeleteActivity(act.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Supprimer l'activité"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>

        {/* Footer Fixe */}
        <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
          >
            Fermer le Catalogue
          </button>
        </div>
      </div>
    </div>
  );
};
