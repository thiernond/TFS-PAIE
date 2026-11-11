import { Worker, DailyPaymentRecord, PaymentMethod, AttendanceType } from "@/types/payroll";
import { getOperatorInfo } from "./formatters";

/**
 * Utilitaire de téléchargement de fichier CSV professionnel pour Excel & Google Sheets
 * - BOM UTF-8 (\uFEFF) pour préserver tous les accents français (é, è, ê, î, à, etc.)
 * - Délimiteur point-virgule (;) par défaut pour ouverture directe en colonnes dans Excel FR / Zone UEMOA
 * - Fins de ligne CRLF (\r\n) pour compatibilité Windows native
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  delimiter: ";" | "," = ";"
) {
  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escapeCell).join(delimiter);
  const dataLines = rows.map((row) => row.map(escapeCell).join(delimiter));
  const fullContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([fullContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * EXPORT 1 : Répertoire Détaillé & Clair des Journaliers Agricoles
 */
export function exportWorkersToCsv(workers: Worker[], delimiter: ";" | "," = ";") {
  const headers = [
    "Matricule",
    "Prénom",
    "Nom",
    "Nom Complet",
    "Téléphone Contact",
    "Fonction / Poste",
    "Domaine Agricole",
    "Parcelle / Équipe Affectée",
    "Moyen de Paiement",
    "Numéro Compte / Mobile Money",
    "Taux Journalier (F CFA)",
    "Tarif Demi-Journée (F CFA)",
    "Solde Avance Actuel (F CFA)",
    "Statut Avance",
    "Date d'Embauche",
    "Statut Ouvrier",
  ];

  const rows = workers.map((w) => {
    const operator = getOperatorInfo(w.momoOperator).label;
    const dailyRate = w.dailyRate || 2500;
    const halfDayRate = Math.floor(dailyRate / 2);
    const advance = w.unpaidAdvances || 0;
    const advanceStatus = advance > 0 ? `Avance en cours (${advance} FCFA)` : "Aucune avance";
    const fullName = `${w.firstName || ""} ${w.lastName || ""}`.trim();

    return [
      w.id,
      w.firstName || "",
      w.lastName || "",
      fullName,
      w.phone || "",
      w.functionTitle || "Journalier Agricole",
      w.domain || "Général",
      w.teamName || "Équipe Générale",
      operator,
      w.momoNumber || w.phone || "",
      dailyRate,
      halfDayRate,
      advance,
      advanceStatus,
      w.hiredAt || "",
      "Actif",
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`fermepaie-repertoire-journaliers-detaille-${dateStr}.csv`, headers, rows, delimiter);
}

/**
 * EXPORT 2 : Lot de Décaissement & Paiements Quinzaine (Wave, OM, Cash)
 */
export function exportPaymentsToCsv(
  payments: DailyPaymentRecord[],
  workers: Worker[] = [],
  delimiter: ";" | "," = ";"
) {
  const headers = [
    "Réf Paiement",
    "Date Règlement",
    "Période Quinzaine",
    "Matricule Ouvrier",
    "Nom du Journalier",
    "Fonction",
    "Domaine Agricole",
    "Équipe / Parcelle",
    "Téléphone Contact",
    "Moyen de Règlement",
    "Numéro Compte / MoMo",
    "Réf Transaction",
    "Jours Travaillés",
    "Taux Journalier (F CFA)",
    "Salaire Brut (F CFA)",
    "Avance Déduite (F CFA)",
    "Net Payé (F CFA)",
    "Statut Paiement",
  ];

  const workersMap = new Map(workers.map((w) => [w.id, w]));

  const rows = payments.map((p) => {
    const worker = workersMap.get(p.workerId);
    const operator = getOperatorInfo(p.paymentMethod).label;
    const periodLabel = `Quinzaine du ${p.periodStart} au ${p.periodEnd}`;
    const rate = p.dailyRate || worker?.dailyRate || 2500;
    const days = p.daysWorked || 14;
    const gross = rate * days;
    const advanceDeducted = p.advanceDeducted || 0;
    const phone = worker?.phone || p.transactionRef;
    const momoNumber = worker?.momoNumber || worker?.phone || "";

    return [
      p.id,
      p.date,
      periodLabel,
      p.workerId,
      p.workerName,
      p.functionTitle || worker?.functionTitle || "Ouvrier agricole",
      p.domain || worker?.domain || "Exploitation",
      p.teamName || worker?.teamName || "Équipe terrain",
      phone,
      operator,
      momoNumber,
      p.transactionRef,
      days,
      rate,
      gross,
      advanceDeducted,
      p.amount,
      p.status === "paid" ? "Payé & Émargé" : "En attente",
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`fermepaie-lot-paiements-quinzaine-detaille-${dateStr}.csv`, headers, rows, delimiter);
}

/**
 * EXPORT 3 : Feuille de Pointage Quotidien Terrain
 */
export function exportAttendanceToCsv(
  currentDate: string,
  workers: Worker[],
  attendanceState: Record<string, AttendanceType>,
  delimiter: ";" | "," = ";"
) {
  const headers = [
    "Date Pointage",
    "Matricule",
    "Nom Complet",
    "Prénom",
    "Nom",
    "Téléphone",
    "Fonction / Poste",
    "Domaine Agricole",
    "Parcelle / Équipe",
    "Statut Présence",
    "Taux Journalier (F CFA)",
    "Rémunération du Jour (F CFA)",
    "Moyen de Règlement",
    "Numéro Paiement",
  ];

  const rows = workers.map((w) => {
    const status = attendanceState[w.id] || "full_day";
    const rate = w.dailyRate || 2500;
    const amount = status === "full_day" ? rate : status === "half_day" ? Math.floor(rate / 2) : 0;
    const statusLabel =
      status === "full_day"
        ? "Présent (Journée complète)"
        : status === "half_day"
        ? "Demi-journée (Matin ou Soir)"
        : "Absent";
    const operator = getOperatorInfo(w.momoOperator).label;
    const fullName = `${w.firstName || ""} ${w.lastName || ""}`.trim();

    return [
      currentDate,
      w.id,
      fullName,
      w.firstName || "",
      w.lastName || "",
      w.phone || "",
      w.functionTitle || "Journalier Agricole",
      w.domain || "Maraîchage",
      w.teamName || "Équipe Générale",
      statusLabel,
      rate,
      amount,
      operator,
      w.momoNumber || w.phone || "",
    ];
  });

  downloadCsv(`fermepaie-pointage-detaille-${currentDate}.csv`, headers, rows, delimiter);
}

/**
 * EXPORT 4 : Registre des Avances sur Salaire
 */
export function exportAdvancesToCsv(workers: Worker[], delimiter: ";" | "," = ";") {
  const headers = [
    "Matricule",
    "Nom Complet",
    "Prénom",
    "Nom",
    "Téléphone Contact",
    "Fonction",
    "Domaine Agricole",
    "Équipe / Parcelle",
    "Solde Avance Actuel (F CFA)",
    "Règle de Déduction",
    "Mode de Paiement Préféré",
    "Numéro Compte / MoMo",
  ];

  const rows = workers
    .filter((w) => (w.unpaidAdvances || 0) > 0)
    .map((w) => {
      const operator = getOperatorInfo(w.momoOperator).label;
      const fullName = `${w.firstName || ""} ${w.lastName || ""}`.trim();

      return [
        w.id,
        fullName,
        w.firstName || "",
        w.lastName || "",
        w.phone || "",
        w.functionTitle || "Journalier Agricole",
        w.domain || "",
        w.teamName || "",
        w.unpaidAdvances || 0,
        "Remboursement intégral immédiat sur prochaine paie",
        operator,
        w.momoNumber || w.phone || "",
      ];
    });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCsv(`fermepaie-registre-avances-detaille-${dateStr}.csv`, headers, rows, delimiter);
}

/**
 * Parser universel tolérant pour l'import de journaliers (supporte virgule, point-virgule et tous formats d'en-tête)
 */
export function parseWorkersCsvText(text: string): {
  workers: Partial<Worker>[];
  delimiterUsed: string;
} {
  // Retirer le BOM UTF-8 éventuel au début du fichier
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  const rawLines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (rawLines.length < 2) {
    return { workers: [], delimiterUsed: ";" };
  }

  // Détection automatique du séparateur (point-virgule vs virgule vs tabulation)
  const headerLine = rawLines[0];
  const countSemi = (headerLine.match(/;/g) || []).length;
  const countComma = (headerLine.match(/,/g) || []).length;
  const countTab = (headerLine.match(/\t/g) || []).length;

  let delimiter = ";";
  if (countComma > countSemi && countComma > countTab) {
    delimiter = ",";
  } else if (countTab > countSemi && countTab > countComma) {
    delimiter = "\t";
  }

  // Découpage robuste en respectant les guillemets
  const splitLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = splitLine(headerLine, delimiter).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );

  // Recherche des index de colonnes par mots-clés
  const findIndex = (...keywords: string[]) => {
    return rawHeaders.findIndex((h) => keywords.some((kw) => h.includes(kw)));
  };

  const idIdx = findIndex("matricule", "id");
  const firstNameIdx = findIndex("prenom", "firstname");
  const lastNameIdx = findIndex("nom", "lastname");
  const fullNameIdx = findIndex("nomcomplet", "fullname", "ouvrier");
  const phoneIdx = findIndex("telephone", "phone", "contact", "tel");
  const functionIdx = findIndex("fonction", "poste", "tache", "metier");
  const domainIdx = findIndex("domaine", "filiere", "secteur");
  const teamIdx = findIndex("equipe", "parcelle", "zone");
  const operatorIdx = findIndex("operateur", "mode", "moyen", "paiement");
  const momoNumberIdx = findIndex("numeromomo", "numerocompte", "compte", "mobilemoney");
  const dailyRateIdx = findIndex("taux", "salaire", "tarif", "journalier");

  const normalizeOperator = (val: string): PaymentMethod => {
    const v = (val || "").toLowerCase();
    if (v.includes("wave")) return "wave";
    if (v.includes("orange") || v.includes("om")) return "orange_money";
    if (v.includes("mtn") || v.includes("momo")) return "mtn_momo";
    if (v.includes("moov")) return "moov_money";
    if (v.includes("espece") || v.includes("cash") || v.includes("liquide")) return "cash";
    if (v.includes("virement") || v.includes("banque")) return "bank_transfer";
    return "wave";
  };

  const parsed: Partial<Worker>[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const cols = splitLine(rawLines[i], delimiter);
    if (cols.length < 2) continue;

    let firstName = firstNameIdx >= 0 ? cols[firstNameIdx] : "";
    let lastName = lastNameIdx >= 0 ? cols[lastNameIdx] : "";

    // Si on a une colonne Nom Complet
    if (!firstName && !lastName && fullNameIdx >= 0 && cols[fullNameIdx]) {
      const parts = cols[fullNameIdx].split(" ");
      firstName = parts[0] || "Ouvrier";
      lastName = parts.slice(1).join(" ") || "";
    }

    // Fallbacks positionnels si le fichier n'a pas d'en-tête reconnu
    if (!firstName && !lastName && cols.length >= 2) {
      firstName = cols[0];
      lastName = cols[1];
    }

    const phone = phoneIdx >= 0 && cols[phoneIdx] ? cols[phoneIdx] : "+221 ";
    const functionTitle = functionIdx >= 0 && cols[functionIdx] ? cols[functionIdx] : "Journalier Polyvalent";
    const domain = domainIdx >= 0 && cols[domainIdx] ? cols[domainIdx] : "Maraîchage";
    const teamName = teamIdx >= 0 && cols[teamIdx] ? cols[teamIdx] : "Équipe Maraîchage";
    const operatorStr = operatorIdx >= 0 ? cols[operatorIdx] : "wave";
    const momoOperator = normalizeOperator(operatorStr);
    const momoNumber = momoNumberIdx >= 0 && cols[momoNumberIdx] ? cols[momoNumberIdx] : phone;
    const rawRate = dailyRateIdx >= 0 ? cols[dailyRateIdx] : "2500";
    const dailyRate = parseInt(rawRate.replace(/[^0-9]/g, ""), 10) || 2500;
    const id = idIdx >= 0 && cols[idIdx] ? cols[idIdx] : undefined;

    parsed.push({
      id,
      firstName: firstName || "Journalier",
      lastName: lastName || "",
      phone,
      functionTitle,
      domain,
      teamName,
      momoOperator,
      momoNumber,
      dailyRate,
      unpaidAdvances: 0,
      hiredAt: new Date().toISOString().slice(0, 10),
    });
  }

  return { workers: parsed, delimiterUsed: delimiter };
}
