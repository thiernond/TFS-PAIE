"use client";

import React, { useState } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  UserX,
  Sparkles,
} from "lucide-react";
import { Worker, AttendanceType } from "@/types/payroll";
import { formatFCFA, getTodayISO } from "@/lib/utils/formatters";

interface ImportAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onApplyAttendance: (attendances: Record<string, AttendanceType>) => void;
  dateStr?: string;
}

interface ParsedAttendanceRow {
  identifier: string; // Worker ID or Name
  matchedWorker?: Worker;
  status: AttendanceType;
  statusLabel: string;
  amountFCFA: number;
  rawLine: string;
  isValid: boolean;
}

export const ImportAttendanceModal: React.FC<ImportAttendanceModalProps> = ({
  isOpen,
  onClose,
  workers,
  onApplyAttendance,
  dateStr = getTodayISO(),
}) => {
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedAttendanceRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Télécharger un modèle CSV pour le pointage
  const handleDownloadTemplate = () => {
    const headers = "Matricule_ID,Nom_Prenom,Statut_Presence,Observation\n";
    const sampleRows = workers.slice(0, 8).map((w, index) => {
      // Alterner quelques statuts pour l'exemple
      const stat = index === 6 ? "DEMI_JOURNEE" : index === 7 ? "ABSENT" : "PRESENT";
      return `${w.id},"${w.firstName} ${w.lastName}",${stat},Pointage standard`;
    }).join("\n");

    const content = "\uFEFF" + headers + sampleRows;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `modele_pointage_journaliers_tfs_paie_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Charger un exemple de démonstration
  const handleLoadSample = () => {
    const sampleRows = workers.slice(0, 10).map((w, index) => {
      const stat = index === 8 ? "DEMI_JOURNEE" : index === 9 ? "ABSENT" : "PRESENT";
      return `${w.id},"${w.firstName} ${w.lastName}",${stat},Pointage terrain automatique`;
    });

    const sample = [
      "Matricule_ID,Nom_Prenom,Statut_Presence,Observation",
      ...sampleRows,
    ].join("\n");

    setCsvText(sample);
    parseCsv(sample);
  };

  const normalizeStatus = (raw: string): AttendanceType => {
    const s = (raw || "").trim().toLowerCase();
    if (s.includes("demi") || s.includes("half") || s === "1/2" || s === "0.5") {
      return "half_day";
    }
    if (s.includes("abs") || s === "0" || s === "non") {
      return "absent";
    }
    return "full_day"; // Présent par défaut
  };

  const parseCsv = (text: string) => {
    setErrorMsg(null);
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }

    const rows: ParsedAttendanceRow[] = [];

    // Ignorer la ligne d'en-tête (ligne 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length >= 2) {
        const idCol = cols[0];
        const nameCol = cols[1];
        const statusCol = cols[2] || "PRESENT";

        // Chercher une correspondance soit par ID, soit par nom
        const matched = workers.find(
          (w) =>
            w.id.toLowerCase() === idCol.toLowerCase() ||
            `${w.firstName} ${w.lastName}`.toLowerCase().includes(nameCol.toLowerCase()) ||
            `${w.lastName} ${w.firstName}`.toLowerCase().includes(nameCol.toLowerCase())
        );

        const status = normalizeStatus(statusCol);
        const amountFCFA =
          status === "full_day" ? (matched?.dailyRate || 2500) : status === "half_day" ? Math.floor((matched?.dailyRate || 2500) / 2) : 0;

        rows.push({
          identifier: idCol || nameCol,
          matchedWorker: matched,
          status,
          statusLabel:
            status === "full_day"
              ? "Présent (1j)"
              : status === "half_day"
              ? "Demi-journée (0.5j)"
              : "Absent",
          amountFCFA,
          rawLine: line,
          isValid: !!matched,
        });
      }
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        parseCsv(text);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleApply = () => {
    if (parsedRows.length === 0) {
      setErrorMsg("Aucune ligne de pointage valide à importer.");
      return;
    }

    const validUpdates: Record<string, AttendanceType> = {};
    parsedRows.forEach((row) => {
      if (row.matchedWorker) {
        validUpdates[row.matchedWorker.id] = row.status;
      }
    });

    onApplyAttendance(validUpdates);
    onClose();
  };

  const presentCount = parsedRows.filter((r) => r.status === "full_day").length;
  const halfDayCount = parsedRows.filter((r) => r.status === "half_day").length;
  const absentCount = parsedRows.filter((r) => r.status === "absent").length;
  const totalAmount = parsedRows.reduce((acc, r) => acc + r.amountFCFA, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* En-tête Pinned */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                Importer la Feuille de Pointage (CSV)
              </h3>
              <p className="text-[11px] text-slate-500">
                Mise à jour rapide des présences pour la date du {dateStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Défilable */}
        <div className="p-5 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Outils d'aide & Modèle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="p-3 rounded-xl border border-dashed border-[#D5C7B8] hover:border-emerald-600 bg-sand-50/60 hover:bg-emerald-50/40 text-left transition-all flex items-start gap-2.5 group"
            >
              <Download className="w-4 h-4 text-emerald-700 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Télécharger le Modèle CSV
                </span>
                <span className="text-[10px] text-slate-500">
                  Pré-rempli avec les matricules et noms des ouvriers
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="p-3 rounded-xl border border-dashed border-[#D5C7B8] hover:border-emerald-600 bg-sand-50/60 hover:bg-emerald-50/40 text-left transition-all flex items-start gap-2.5 group"
            >
              <FileText className="w-4 h-4 text-emerald-700 mt-0.5 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Charger un Exemple de Test
                </span>
                <span className="text-[10px] text-slate-500">
                  Injecte 10 pointages (Présents, Demi-journées, Absents)
                </span>
              </div>
            </button>
          </div>

          {/* Zone de Dépôt / Sélection de fichier */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Fichier CSV de Pointage
            </label>
            <label className="border-2 border-dashed border-[#D5C7B8] hover:border-emerald-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-sand-50/30 hover:bg-emerald-50/20 transition-all text-center">
              <Upload className="w-6 h-6 text-emerald-700 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                Cliquez pour parcourir un fichier .CSV
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Format attendu : Matricule, Nom, Statut (PRESENT, DEMI_JOURNEE, ABSENT)
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Édition / Saisie Manuelle du CSV */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Ou collez directement le texte CSV ci-dessous :
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                parseCsv(e.target.value);
              }}
              placeholder="Matricule_ID,Nom_Prenom,Statut_Presence,Observation&#10;w-01,Ibrahima Diallo,PRESENT,OK&#10;w-02,Moussa Sène,DEMI_JOURNEE,Matinée seule"
              className="w-full text-[11px] font-mono p-3 rounded-xl border border-[#D5C7B8] focus:border-emerald-600 focus:outline-none bg-white text-slate-800"
            />
          </div>

          {/* Aperçu des Lignes Analysées */}
          {parsedRows.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#F0EBE3]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {parsedRows.length} lignes analysées
                </span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    {presentCount} Présents
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                    {halfDayCount} Demi-j
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                    {absentCount} Absents
                  </span>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E5DED5] divide-y divide-[#F0EBE3] text-xs">
                {parsedRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-sand-50/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {row.matchedWorker
                            ? `${row.matchedWorker.firstName} ${row.matchedWorker.lastName}`
                            : row.identifier}
                        </span>
                        {row.matchedWorker && (
                          <span className="text-[10px] text-slate-500">
                            ({row.matchedWorker.teamName})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {row.identifier} • {row.matchedWorker?.functionTitle || "Ouvrier"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          row.status === "full_day"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.status === "half_day"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {row.statusLabel}
                      </span>
                      <span className="font-bold text-slate-800 text-[11px] min-w-[65px] text-right">
                        {formatFCFA(row.amountFCFA)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded-xl bg-sand-50 border border-[#E5DED5] flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Masse Salariale Estimée pour ces lignes :</span>
                <span className="text-emerald-800 text-sm">{formatFCFA(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pied Pinned */}
        <div className="px-5 py-3.5 border-t border-[#F0EBE3] bg-sand-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Appliquer au Pointage ({parsedRows.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
