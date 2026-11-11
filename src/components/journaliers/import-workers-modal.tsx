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
  Sparkles,
} from "lucide-react";
import { Worker, PaymentMethod } from "@/types/payroll";
import { parseWorkersCsvText, downloadCsv } from "@/lib/utils/csv-export";

interface ImportWorkersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWorkers: (newWorkers: Worker[]) => void;
}

export const ImportWorkersModal: React.FC<ImportWorkersModalProps> = ({
  isOpen,
  onClose,
  onImportWorkers,
}) => {
  const [csvText, setCsvText] = useState("");
  const [parsedPreview, setParsedPreview] = useState<Partial<Worker>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Télécharger le fichier CSV modèle d'import clair & compatible Excel
  const handleDownloadTemplate = () => {
    const headers = [
      "Matricule",
      "Prénom",
      "Nom",
      "Téléphone Contact",
      "Fonction / Poste",
      "Domaine Agricole",
      "Parcelle / Équipe",
      "Moyen de Paiement",
      "Numéro Compte / MoMo",
      "Taux Journalier (F CFA)",
    ];
    const rows = [
      ["w-101", "Amadou", "Ba", "+221 77 123 45 67", "Récolteur & Triage", "Maraîchage", "Équipe Maraîchage", "Wave", "+221 77 123 45 67", 2500],
      ["w-102", "Kadiatou", "Diallo", "+221 78 234 56 78", "Pépiniériste", "Maraîchage", "Équipe Maraîchage", "Orange Money", "+221 78 234 56 78", 2500],
      ["w-103", "Oumar", "Sow", "+221 76 345 67 89", "Cueilleur Mangues", "Vergers & Manguiers", "Équipe Vergers", "Wave", "+221 76 345 67 89", 2500],
      ["w-104", "Samba", "Kane", "+221 70 456 78 90", "Chauffeur Tracteur", "Grandes Cultures", "Équipe Grandes Cultures", "MTN MoMo", "+221 70 456 78 90", 2500],
      ["w-105", "Aïssatou", "Ndiaye", "+221 77 567 89 01", "Conditionneuse", "Maraîchage", "Équipe Maraîchage", "Espèces", "", 2500],
    ];

    downloadCsv("modele_import_journaliers_fermepaie.csv", headers, rows, ";");
  };

  // Charger un exemple de test rapide au format clair
  const handleLoadSample = () => {
    const sample = `"Matricule";"Prénom";"Nom";"Téléphone Contact";"Fonction / Poste";"Domaine Agricole";"Parcelle / Équipe";"Moyen de Paiement";"Numéro Compte / MoMo";"Taux Journalier (F CFA)"
"w-101";"Mamadou";"Faye";"+221 77 810 20 30";"Récolteur & Triage";"Maraîchage";"Équipe Maraîchage";"Wave";"+221 77 810 20 30";2500
"w-102";"Aminata";"Gueye";"+221 78 920 30 40";"Pépiniériste";"Maraîchage";"Équipe Maraîchage";"Orange Money";"+221 78 920 30 40";2500
"w-103";"Cheikh";"Thiam";"+221 76 130 40 50";"Cueilleur Mangues";"Vergers & Manguiers";"Équipe Vergers";"Wave";"+221 76 130 40 50";2500
"w-104";"Demba";"Sy";"+221 70 240 50 60";"Chauffeur Tracteur";"Grandes Cultures";"Équipe Grandes Cultures";"MTN MoMo";"+221 70 240 50 60";2500
"w-105";"Coumba";"Tall";"+221 77 350 60 70";"Conditionneuse Oignons";"Maraîchage";"Équipe Maraîchage";"Espèces";"";2500`;

    setCsvText(sample);
    parseCsv(sample);
  };

  const parseCsv = (text: string) => {
    setErrorMsg(null);
    if (!text || text.trim().length === 0) {
      setParsedPreview([]);
      return;
    }

    const { workers } = parseWorkersCsvText(text);
    if (workers.length === 0) {
      setErrorMsg("Aucune ligne de journalier valide détectée. Vérifiez que votre fichier contient bien une ligne d'en-tête et au moins une ligne de données.");
    }
    setParsedPreview(workers);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      parseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) {
      setErrorMsg("Aucun journalier détecté dans le fichier.");
      return;
    }

    const createdWorkers: Worker[] = parsedPreview.map((item, idx) => ({
      id: `w-imp-${Date.now().toString().slice(-4)}-${idx}`,
      firstName: item.firstName || "Journalier",
      lastName: item.lastName || "",
      phone: item.phone || "+221 ",
      functionTitle: item.functionTitle || "Journalier Polyvalent",
      domain: item.domain || "Maraîchage",
      teamId: "team-1",
      teamName: item.teamName || "Équipe Maraîchage",
      momoOperator: item.momoOperator || "wave",
      momoNumber: item.momoNumber || item.phone || "",
      dailyRate: item.dailyRate || 2500,
      status: "active",
      hiredAt: new Date().toISOString().split("T")[0],
      unpaidAdvances: 0,
    }));

    onImportWorkers(createdWorkers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Fixe */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                Importer des Journaliers (CSV / Excel)
              </h3>
              <p className="text-[11px] text-slate-500">
                Import groupé avec fonction, domaine et taux journalier (2 500 FCFA)
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">

        {/* Options rapides & Téléchargement du Modèle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-sand-50 p-3.5 rounded-xl border border-[#E5DED5] text-xs">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block">Modèle de fichier type</span>
              <span className="text-[11px] text-slate-600">Colonnes : Prénom, Nom, Téléphone, Fonction, Domaine, Taux</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="touch-btn flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#D5C7B8] hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-800" />
              <span>Télécharger Modèle CSV</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="touch-btn flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Charger Exemple (5)</span>
            </button>
          </div>
        </div>

        {/* Zone de Drag & Drop ou Saisie */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Fichier CSV ou Texte Coller :
          </label>

          <div className="border-2 border-dashed border-[#D5C7B8] hover:border-emerald-500 rounded-xl p-4 text-center bg-sand-50/50 hover:bg-white transition-colors">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-upload"
            />
            <label
              htmlFor="csv-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-slate-600"
            >
              <Upload className="w-7 h-7 text-emerald-700" />
              <span className="font-bold text-slate-800">Cliquez pour téléverser votre fichier .CSV</span>
              <span className="text-[11px] text-slate-500">ou collez le texte ci-dessous</span>
            </label>
          </div>

          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              parseCsv(e.target.value);
            }}
            placeholder="Prenom,Nom,Telephone,Fonction,Domaine,Equipe,Operateur,NumeroMoMo,TauxJournalier..."
            className="w-full p-2.5 rounded-lg border border-[#D5C7B8] font-mono text-[11px] bg-sand-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-800"
          />
        </div>

        {/* Aperçu des lignes détectées */}
        {parsedPreview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{parsedPreview.length} journaliers détectés et prêts à l&apos;importation</span>
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto border border-[#E5DED5] rounded-xl divide-y divide-[#F0EBE3] text-xs">
              {parsedPreview.map((w, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-sand-50">
                  <div>
                    <span className="font-bold text-slate-900">{w.firstName} {w.lastName}</span>
                    <span className="text-slate-500 text-[11px] ml-2">({w.phone})</span>
                    <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-emerald-800">{w.functionTitle}</span>
                      <span>•</span>
                      <span>{w.domain}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-slate-800 text-xs">
                    {w.dailyRate || 2500} FCFA/j
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        </div>

        {/* Footer Fixe */}
        <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Importer {parsedPreview.length} Journaliers</span>
          </button>
        </div>
      </div>
    </div>
  );
};
