"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Sprout,
  Plus,
  Pencil,
  Trash2,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Coins,
  Scale,
  Calendar,
  X,
  MapPin,
  Users,
  Briefcase,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Activity, FarmDomain, Worker } from "@/types/payroll";
import { formatFCFA } from "@/lib/utils/formatters";

interface ActivitiesDomainsViewProps {
  activities: Activity[];
  domains: FarmDomain[];
  workers: Worker[];
  onSaveActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onSaveDomain: (domain: FarmDomain) => void;
  onDeleteDomain: (domainId: string) => void;
}

export const ActivitiesDomainsView: React.FC<ActivitiesDomainsViewProps> = ({
  activities,
  domains,
  workers,
  onSaveActivity,
  onDeleteActivity,
  onSaveDomain,
  onDeleteDomain,
}) => {
  // Navigation entre les 2 onglets : "activities" | "domains"
  const [activeTab, setActiveTab] = useState<"activities" | "domains">("activities");

  // Filtres et Recherche pour Activités
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("all");
  const [selectedRateType, setSelectedRateType] = useState<"all" | "time" | "piece">("all");

  // Modales
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<FarmDomain | null>(null);

  // Formulaire Activité
  const [actName, setActName] = useState("");
  const [actDomain, setActDomain] = useState(domains[0]?.name || "Maraîchage");
  const [actIsPieceRate, setActIsPieceRate] = useState(false);
  const [actUnitName, setActUnitName] = useState("Journée");
  const [actDefaultRate, setActDefaultRate] = useState("2500");

  // Formulaire Domaine
  const [domName, setDomName] = useState("");
  const [domCode, setDomCode] = useState("");
  const [domDescription, setDomDescription] = useState("");
  const [domSurface, setDomSurface] = useState("");
  const [domColor, setDomColor] = useState("emerald");

  // Filtrage des activités
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedDomainFilter !== "all" && act.domain !== selectedDomainFilter) {
        return false;
      }
      if (selectedRateType === "time" && act.isPieceRate) return false;
      if (selectedRateType === "piece" && !act.isPieceRate) return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesName = act.name.toLowerCase().includes(q);
        const matchesDomain = act.domain.toLowerCase().includes(q);
        const matchesUnit = act.unitName?.toLowerCase().includes(q);
        if (!matchesName && !matchesDomain && !matchesUnit) return false;
      }

      return true;
    });
  }, [activities, selectedDomainFilter, selectedRateType, searchQuery]);

  // Ouvrir modale nouvelle activité
  const handleOpenNewActivity = () => {
    setEditingActivity(null);
    setActName("");
    setActDomain(domains[0]?.name || "Maraîchage");
    setActIsPieceRate(false);
    setActUnitName("Journée");
    setActDefaultRate("2500");
    setIsActivityModalOpen(true);
  };

  // Ouvrir modale édition activité
  const handleOpenEditActivity = (act: Activity) => {
    setEditingActivity(act);
    setActName(act.name);
    setActDomain(act.domain);
    setActIsPieceRate(act.isPieceRate);
    setActUnitName(act.unitName || (act.isPieceRate ? "Caisse" : "Journée"));
    setActDefaultRate((act.defaultUnitRate || 2500).toString());
    setIsActivityModalOpen(true);
  };

  // Sauvegarder activité
  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName.trim()) return;

    const rate = parseInt(actDefaultRate, 10) || (actIsPieceRate ? 400 : 2500);

    const saved: Activity = {
      id: editingActivity?.id || `act-${Date.now().toString().slice(-4)}`,
      name: actName.trim(),
      domain: actDomain,
      isPieceRate: actIsPieceRate,
      unitName: actIsPieceRate ? actUnitName : "Journée",
      defaultUnitRate: rate,
      isActive: editingActivity ? editingActivity.isActive : true,
    };

    onSaveActivity(saved);
    setIsActivityModalOpen(false);
  };

  // Bascule statut activité
  const handleToggleActivityStatus = (act: Activity) => {
    onSaveActivity({
      ...act,
      isActive: !act.isActive,
    });
  };

  // Ouvrir modale nouveau domaine
  const handleOpenNewDomain = () => {
    setEditingDomain(null);
    setDomName("");
    setDomCode("");
    setDomDescription("");
    setDomSurface("");
    setDomColor("emerald");
    setIsDomainModalOpen(true);
  };

  // Ouvrir modale édition domaine
  const handleOpenEditDomain = (dom: FarmDomain) => {
    setEditingDomain(dom);
    setDomName(dom.name);
    setDomCode(dom.code);
    setDomDescription(dom.description || "");
    setDomSurface(dom.surfaceArea || "");
    setDomColor(dom.colorBadge || "emerald");
    setIsDomainModalOpen(true);
  };

  // Sauvegarder domaine
  const handleSubmitDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domName.trim()) return;

    const code = domCode.trim()
      ? domCode.trim().toUpperCase()
      : domName.slice(0, 3).toUpperCase();

    const saved: FarmDomain = {
      id: editingDomain?.id || `dom-${Date.now().toString().slice(-4)}`,
      name: domName.trim(),
      code,
      description: domDescription.trim(),
      surfaceArea: domSurface.trim(),
      colorBadge: domColor,
      createdAt: editingDomain?.createdAt || new Date().toISOString().slice(0, 10),
    };

    onSaveDomain(saved);
    setIsDomainModalOpen(false);
  };

  const getColorClasses = (color?: string) => {
    switch (color) {
      case "amber":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-800",
          border: "border-amber-300",
          badge: "bg-amber-100 text-amber-800",
        };
      case "sky":
        return {
          bg: "bg-sky-500/10",
          text: "text-sky-800",
          border: "border-sky-300",
          badge: "bg-sky-100 text-sky-800",
        };
      case "indigo":
        return {
          bg: "bg-indigo-500/10",
          text: "text-indigo-800",
          border: "border-indigo-300",
          badge: "bg-indigo-100 text-indigo-800",
        };
      case "rose":
        return {
          bg: "bg-rose-500/10",
          text: "text-rose-800",
          border: "border-rose-300",
          badge: "bg-rose-100 text-rose-800",
        };
      default:
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-800",
          border: "border-emerald-300",
          badge: "bg-emerald-100 text-emerald-800",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. En-tête & KPIs Rapides */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5DED5] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-500/20 shadow-xs">
              <Layers className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Activités & Domaines d&apos;Exploitation
              </h2>
              <p className="text-xs text-slate-500">
                Paramétrage des filières, parcelles et barèmes de paie (taux standard 2 500 F CFA/j ou rendement)
              </p>
            </div>
          </div>

          {/* Boutons d'action contextuels */}
          <div className="flex items-center gap-2">
            {activeTab === "activities" ? (
              <button
                onClick={handleOpenNewActivity}
                className="touch-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-200" />
                <span>+ Nouvelle Activité</span>
              </button>
            ) : (
              <button
                onClick={handleOpenNewDomain}
                className="touch-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4 text-orange-200" />
                <span>+ Nouveau Domaine</span>
              </button>
            )}
          </div>
        </div>

        {/* Mini-KPIs synthétiques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F0EBE3]">
          <div className="p-3 rounded-xl bg-sand-50/80 border border-[#E5DED5]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Activités
            </span>
            <span className="text-lg font-black text-slate-900">
              {activities.length} tâches
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand-50/80 border border-[#E5DED5]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Domaines Actifs
            </span>
            <span className="text-lg font-black text-emerald-800">
              {domains.length} parcelles/filières
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand-50/80 border border-[#E5DED5]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Forfait Journalier Standard
            </span>
            <span className="text-lg font-black text-slate-900">
              2 500 F CFA <span className="text-xs font-normal text-slate-500">/j</span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand-50/80 border border-[#E5DED5]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Tâches au Rendement
            </span>
            <span className="text-lg font-black text-amber-800">
              {activities.filter((a) => a.isPieceRate).length} barèmes
            </span>
          </div>
        </div>
      </div>

      {/* 2. Onglets de Navigation Principale */}
      <div className="flex border-b border-[#E5DED5] gap-3">
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all ${
            activeTab === "activities"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catalogue des Activités</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            {activities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("domains")}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-extrabold border-b-2 transition-all ${
            activeTab === "domains"
              ? "border-[#C25E34] text-[#C25E34]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Domaines & Parcelles</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#C25E34]">
            {domains.length}
          </span>
        </button>
      </div>

      {/* 3. Contenu de l'Onglet 1 : CATALOGUE DES ACTIVITÉS */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {/* Barre de Filtres et Recherche */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DED5] shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une activité, une tâche, un barème..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Filtre Domaine */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Domaine :</span>
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">Tous les domaines ({activities.length})</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Type de rémunération */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Rémunération :</span>
                <select
                  value={selectedRateType}
                  onChange={(e) => setSelectedRateType(e.target.value as "all" | "time" | "piece")}
                  className="px-2.5 py-2 rounded-xl border border-[#D5C7B8] bg-sand-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="all">Tous types</option>
                  <option value="time">Au temps (2 500 F/j)</option>
                  <option value="piece">Au rendement</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tableau des Activités */}
          <div className="bg-white rounded-2xl border border-[#E5DED5] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50/80 border-b border-[#E5DED5] text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 min-w-[200px]">Activité / Tâche</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Domaine Associé</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Mode de Calcul</th>
                    <th className="py-3.5 px-4 min-w-[140px]">Tarif Unitaire</th>
                    <th className="py-3.5 px-4 text-center min-w-[100px]">Statut</th>
                    <th className="py-3.5 px-4 text-right min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3]">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucune activité trouvée pour ces critères.
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((act) => {
                      const domainObj = domains.find((d) => d.name === act.domain);
                      const colorInfo = getColorClasses(domainObj?.colorBadge);

                      return (
                        <tr key={act.id} className="hover:bg-sand-50/50 transition-colors">
                          {/* Nom */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200/50">
                                <Tag className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-slate-900">{act.name}</span>
                            </div>
                          </td>

                          {/* Domaine */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${colorInfo.badge} ${colorInfo.border}`}
                            >
                              <Sprout className="w-3 h-3" />
                              <span>{act.domain}</span>
                            </span>
                          </td>

                          {/* Mode de paie */}
                          <td className="py-3 px-4">
                            {act.isPieceRate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <Scale className="w-3 h-3" />
                                <span>Au rendement ({act.unitName})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <Calendar className="w-3 h-3" />
                                <span>Forfait Journée (2 500 F)</span>
                              </span>
                            )}
                          </td>

                          {/* Tarif */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatFCFA(act.defaultUnitRate || (act.isPieceRate ? 400 : 2500))}
                            <span className="text-[10px] text-slate-500 font-normal ml-1">
                              / {act.isPieceRate ? act.unitName : "jour"}
                            </span>
                          </td>

                          {/* Statut Toggle */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleActivityStatus(act)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                                act.isActive
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  act.isActive ? "bg-emerald-600" : "bg-slate-400"
                                }`}
                              />
                              <span>{act.isActive ? "Active" : "Suspendue"}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditActivity(act)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                                title="Modifier l'activité"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteActivity(act.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Supprimer l'activité"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        </div>
      )}

      {/* 4. Contenu de l'Onglet 2 : DOMAINES & PARCELLES */}
      {activeTab === "domains" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {domains.map((dom) => {
              const colorInfo = getColorClasses(dom.colorBadge);
              const domainWorkers = workers.filter((w) => w.domain === dom.name);
              const domainActivities = activities.filter((a) => a.domain === dom.name);

              return (
                <div
                  key={dom.id}
                  className="bg-white rounded-2xl p-5 border border-[#E5DED5] shadow-card hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* En-tête de carte */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${colorInfo.badge} ${colorInfo.border}`}
                        >
                          {dom.code}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                            {dom.name}
                          </h3>
                          {dom.surfaceArea && (
                            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-emerald-700" />
                              {dom.surfaceArea}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDomain(dom)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                          title="Modifier ce domaine"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteDomain(dom.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Supprimer ce domaine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {dom.description || "Aucune description détaillée renseignée."}
                    </p>
                  </div>

                  {/* Statistiques rattachées */}
                  <div className="pt-3 border-t border-[#F0EBE3] grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-sand-50 border border-[#E5DED5]">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">
                        Activités
                      </span>
                      <span className="font-black text-slate-900">
                        {domainActivities.length} tâches
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-sand-50 border border-[#E5DED5]">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase">
                        Journaliers
                      </span>
                      <span className="font-black text-emerald-800">
                        {domainWorkers.length} ouvriers
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODALE : CRÉATION / MODIFICATION D'ACTIVITÉ */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Fixe */}
            <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    {editingActivity ? "Modifier l'Activité" : "Nouvelle Activité Agricole"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Définissez la tâche, son domaine et son barème de paie
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps Défilant */}
            <form onSubmit={handleSubmitActivity} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
                {/* Nom */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nom de l&apos;Activité *
                  </label>
                  <input
                    type="text"
                    required
                    value={actName}
                    onChange={(e) => setActName(e.target.value)}
                    placeholder="Ex: Désherbage manuel, Récolte Mangues, Arrosage..."
                    className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  />
                </div>

                {/* Domaine d'affectation */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Domaine / Parcelle d&apos;affectation *
                  </label>
                  <select
                    value={actDomain}
                    onChange={(e) => setActDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type de rémunération */}
                <div className="p-3 rounded-xl bg-sand-50/80 border border-[#E5DED5] space-y-2.5">
                  <span className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Mode de Rémunération
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActIsPieceRate(false);
                        setActUnitName("Journée");
                        setActDefaultRate("2500");
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                        !actIsPieceRate
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20"
                          : "bg-white border-[#D5C7B8] text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">Forfait Temps</span>
                        {!actIsPieceRate && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        2 500 F CFA / jour (demi-j: 1 250 F)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActIsPieceRate(true);
                        setActUnitName("Caisse");
                        setActDefaultRate("400");
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                        actIsPieceRate
                          ? "bg-amber-50 border-amber-600 text-amber-900 ring-2 ring-amber-600/20"
                          : "bg-white border-[#D5C7B8] text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs">Au Rendement</span>
                        {actIsPieceRate && <Check className="w-3.5 h-3.5 text-amber-700" />}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        À la pesée, caisse, sac ou ligne
                      </span>
                    </button>
                  </div>

                  {/* Détails si au rendement */}
                  {actIsPieceRate && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5DED5]">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Nom de l&apos;Unité
                        </label>
                        <input
                          type="text"
                          value={actUnitName}
                          onChange={(e) => setActUnitName(e.target.value)}
                          placeholder="Ex: Caisse, Sac 50kg, Kg..."
                          className="w-full px-3 py-1.5 rounded-lg border border-[#D5C7B8] bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tarif Unitaire (FCFA)
                        </label>
                        <input
                          type="number"
                          step="50"
                          value={actDefaultRate}
                          onChange={(e) => setActDefaultRate(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-[#D5C7B8] bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Fixe */}
              <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
                >
                  {editingActivity ? "Enregistrer" : "Créer l'activité"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODALE : CRÉATION / MODIFICATION DE DOMAINE */}
      {isDomainModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Fixe */}
            <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#C25E34] flex items-center justify-center">
                  <Sprout className="w-4 h-4 text-[#C25E34]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    {editingDomain ? "Modifier le Domaine" : "Nouveau Domaine / Parcelle"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Définissez la filière agricole et sa superficie
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDomainModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps Défilant */}
            <form onSubmit={handleSubmitDomain} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
                {/* Ligne 1 : Nom et Code */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nom du Domaine / Filière *
                    </label>
                    <input
                      type="text"
                      required
                      value={domName}
                      onChange={(e) => setDomName(e.target.value)}
                      placeholder="Ex: Maraîchage, Vergers, Pépinières..."
                      className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Code Court
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={domCode}
                      onChange={(e) => setDomCode(e.target.value.toUpperCase())}
                      placeholder="Ex: MAR"
                      className="w-full px-3 py-2 font-mono font-bold uppercase rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cultures phares & Description
                  </label>
                  <textarea
                    rows={2}
                    value={domDescription}
                    onChange={(e) => setDomDescription(e.target.value)}
                    placeholder="Ex: Culture intensive d'oignons, piments, tomates..."
                    className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  />
                </div>

                {/* Superficie / Parcelles */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Superficie / Parcelles
                  </label>
                  <input
                    type="text"
                    value={domSurface}
                    onChange={(e) => setDomSurface(e.target.value)}
                    placeholder="Ex: 15 ha • Parcelles 1 à 4"
                    className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  />
                </div>

                {/* Couleur d'identification */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Couleur d&apos;identification du badge
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: "emerald", label: "Vert Canopée", bg: "bg-emerald-600" },
                      { id: "amber", label: "Ocre Solaire", bg: "bg-amber-600" },
                      { id: "sky", label: "Bleu Cobalt", bg: "bg-sky-600" },
                      { id: "indigo", label: "Indigo", bg: "bg-indigo-600" },
                      { id: "rose", label: "Terracotta Rose", bg: "bg-rose-600" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDomColor(c.id)}
                        className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                          domColor === c.id ? "scale-110 ring-2 ring-offset-2 ring-slate-800" : "opacity-75 hover:opacity-100"
                        }`}
                        title={c.label}
                      >
                        {domColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Fixe */}
              <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDomainModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors"
                >
                  {editingDomain ? "Enregistrer" : "Créer le domaine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
