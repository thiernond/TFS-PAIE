"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Upload,
  Download,
  UserPlus,
  Briefcase,
  Layers,
  Phone,
  CreditCard,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Coins,
  ShieldAlert,
} from "lucide-react";
import { Worker, PaymentMethod, Team } from "@/types/payroll";
import { formatFCFA, getOperatorInfo } from "@/lib/utils/formatters";

interface WorkersViewProps {
  workers: Worker[];
  teams: Team[];
  onOpenNewWorker: () => void;
  onOpenImport: () => void;
  onExportWorkers: () => void;
  onDeleteWorker: (workerId: string) => void;
  onEditWorker: (worker: Worker) => void;
}

export const WorkersView: React.FC<WorkersViewProps> = ({
  workers,
  teams,
  onOpenNewWorker,
  onOpenImport,
  onExportWorkers,
  onDeleteWorker,
  onEditWorker,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedOperator, setSelectedOperator] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const domainsList = [
    "Maraîchage",
    "Vergers & Manguiers",
    "Grandes Cultures",
    "Élevage & Bassins",
  ];

  // Filtrage réactif
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Domaine
      if (selectedDomain !== "all" && w.domain !== selectedDomain) return false;
      // Équipe
      if (selectedTeam !== "all" && w.teamName !== selectedTeam) return false;
      // Opérateur
      if (selectedOperator !== "all" && w.momoOperator !== selectedOperator) return false;

      // Recherche texte
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const fullName = `${w.firstName} ${w.lastName}`.toLowerCase();
        const matchesName = fullName.includes(q);
        const matchesPhone = w.phone.includes(q);
        const matchesFunction = w.functionTitle?.toLowerCase().includes(q);
        const matchesDomain = w.domain?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesFunction && !matchesDomain) return false;
      }

      return true;
    });
  }, [workers, selectedDomain, selectedTeam, selectedOperator, searchQuery]);

  // Pagination
  const totalItems = filteredWorkers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const totalAdvancesSum = workers.reduce((acc, curr) => acc + (curr.unpaidAdvances || 0), 0);

  return (
    <div className="space-y-5">
      {/* 1. En-tête de la Vue Journaliers avec Actions d'Import/Export */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5DED5] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Répertoire des Journaliers
              </h1>
              <p className="text-xs text-slate-500">
                Gestion des ouvriers agricoles • Taux standard : 2 500 F CFA/jour • Cycle Quinzaine
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action (Importer, Exporter, Ajouter) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bouton IMPORTER CSV (demandé expressément) */}
          <button
            onClick={onOpenImport}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95"
            id="btn-import-workers"
          >
            <Upload className="w-4 h-4" />
            <span>Importer CSV</span>
          </button>

          {/* Bouton EXPORTER CSV (demandé expressément) */}
          <button
            onClick={onExportWorkers}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider border border-[#D5C7B8] shadow-2xs transition-transform active:scale-95"
            id="btn-export-workers"
          >
            <Download className="w-4 h-4 text-emerald-800" />
            <span>Exporter CSV</span>
          </button>

          {/* Bouton NOUVEAU JOURNALIER */}
          <button
            onClick={onOpenNewWorker}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-95"
            id="btn-add-worker-page"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Journalier</span>
          </button>
        </div>
      </div>

      {/* 2. Mini Synthèse Rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Ouvriers
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            {workers.length}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">100% enregistrés</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Taux Standard
          </span>
          <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">
            2 500 F
          </span>
          <span className="text-[11px] text-slate-500 font-medium">1 250 F ½ journée</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Avances en Cours
          </span>
          <span className="text-2xl font-extrabold text-[#C25E34] mt-1 block">
            {formatFCFA(totalAdvancesSum)}
          </span>
          <span className="text-[11px] text-orange-700 font-medium">À retenir sur paie</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5DED5] shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Domaines Couverts
          </span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
            4 Filières
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Maraîchage, Vergers...</span>
        </div>
      </div>

      {/* 3. Barre de Filtres & Recherche */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DED5] shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Recherche texte */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, fonction, tél..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border border-[#D5C7B8] bg-sand-50/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Filtre Domaine */}
          <div className="lg:col-span-3">
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Tous les Domaines</option>
              {domainsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Équipe */}
          <div className="lg:col-span-2">
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Toutes Équipes</option>
              {teams.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Opérateur Mobile Money */}
          <div className="lg:col-span-2">
            <select
              value={selectedOperator}
              onChange={(e) => {
                setSelectedOperator(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-[#D5C7B8] bg-sand-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="all">Tous Règlements</option>
              <option value="wave">Wave</option>
              <option value="orange_money">Orange Money</option>
              <option value="mtn_momo">MTN MoMo</option>
              <option value="cash">Espèces</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tableau des Journaliers */}
      <div className="bg-white rounded-2xl border border-[#E5DED5] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5DED5] bg-sand-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4 w-12">#</th>
                <th className="py-3.5 px-4 min-w-[200px]">Ouvrier & Téléphone</th>
                <th className="py-3.5 px-4 min-w-[180px]">Fonction & Domaine</th>
                <th className="py-3.5 px-4 min-w-[150px]">Équipe Affectée</th>
                <th className="py-3.5 px-4 min-w-[140px]">Règlement Mobile Money</th>
                <th className="py-3.5 px-4 text-right min-w-[110px]">Taux/j</th>
                <th className="py-3.5 px-4 text-right min-w-[120px]">Avance Due</th>
                <th className="py-3.5 px-4 text-center min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE3] text-xs">
              {paginatedWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Aucun journalier trouvé</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Modifiez vos filtres ou cliquez sur &quot;Importer CSV&quot; pour ajouter des ouvriers.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedWorkers.map((w, index) => {
                  const opInfo = getOperatorInfo(w.momoOperator);
                  const displayIndex = startIndex + index + 1;

                  return (
                    <tr key={w.id} className="hover:bg-sand-50/60 transition-colors group">
                      {/* Numéro */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {displayIndex}
                      </td>

                      {/* Ouvrier & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-xs flex-shrink-0 border border-emerald-200">
                            {w.firstName.charAt(0)}{w.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                              {w.firstName} {w.lastName}
                            </p>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {w.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Fonction & Domaine */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-bold text-slate-900 text-xs">
                            {w.functionTitle || "Journalier"}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {w.domain}
                          </span>
                        </div>
                      </td>

                      {/* Équipe */}
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {w.teamName}
                      </td>

                      {/* Moyen de Paiement */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${opInfo.badgeBg} w-fit`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${opInfo.dotColor}`} />
                            {opInfo.label}
                          </span>
                          {w.momoNumber && (
                            <span className="font-mono text-[10px] text-slate-600">
                              {w.momoNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Taux Journalier */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-extrabold text-slate-900">
                          {formatFCFA(w.dailyRate || 2500)}
                        </span>
                      </td>

                      {/* Solde d'avance */}
                      <td className="py-3 px-4 text-right">
                        {w.unpaidAdvances > 0 ? (
                          <span className="font-mono font-bold text-[#C25E34]">
                            {formatFCFA(w.unpaidAdvances)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            0 F
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onEditWorker(w)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                            title="Modifier la fiche"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(w.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Archiver / Supprimer"
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

        {/* Pagination */}
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
              className="px-2 py-1 rounded border border-[#D5C7B8] bg-white text-xs font-semibold text-slate-800"
            >
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
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 rounded bg-white border border-[#D5C7B8] font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Suppression */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-rose-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <Trash2 className="w-5 h-5" />
              <span>Archiver ce journalier</span>
            </div>
            <p className="text-xs text-slate-600 leading-normal">
              Voulez-vous retirer cet ouvrier du registre actif ? Ses pointages et paiements passés restent conservés dans les archives.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs rounded-lg border text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteWorker(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
