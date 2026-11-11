import { PaymentMethod } from "@/types/payroll";

/**
 * Formate un montant entier en FCFA (sans décimale superflue)
 * Ex: 3500 -> "3 500 F CFA"
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return "0 F CFA";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount) + " F CFA";
}

/**
 * Formate une date ISO (YYYY-MM-DD) en format français lisible
 * Ex: "2026-11-11" -> "11 nov. 2026"
 */
export function formatDateFR(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Retourne la date locale du jour au format YYYY-MM-DD
 */
export function getTodayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Retourne les bornes du mois courant (1ère Quinzaine, 2ème Quinzaine, Mois complet)
 */
export function getCurrentMonthBounds(now: Date = new Date()) {
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const month = String(monthIdx + 1).padStart(2, "0");
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const lastDayStr = String(lastDay).padStart(2, "0");

  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(now);
  const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return {
    q1Start: `${year}-${month}-01`,
    q1End: `${year}-${month}-15`,
    q2Start: `${year}-${month}-16`,
    q2End: `${year}-${month}-${lastDayStr}`,
    monthStart: `${year}-${month}-01`,
    monthEnd: `${year}-${month}-${lastDayStr}`,
    lastDayStr,
    capitalizedMonth,
  };
}

/**
 * Formate la date du jour en français complet avec majuscules
 * Ex: "Mercredi 11 Novembre 2026"
 */
export function formatFullTodayFR(now: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return formatted
    .split(" ")
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/**
 * Retourne les détails de l'opérateur de paiement (label, couleurs, badge)
 */
export function getOperatorInfo(method: PaymentMethod): {
  label: string;
  badgeBg: string;
  badgeText: string;
  dotColor: string;
} {
  switch (method) {
    case "wave":
      return {
        label: "Wave",
        badgeBg: "bg-sky-50 border-sky-200 text-sky-800",
        badgeText: "text-sky-700",
        dotColor: "bg-[#00A3FF]",
      };
    case "orange_money":
      return {
        label: "Orange Money",
        badgeBg: "bg-orange-50 border-orange-200 text-orange-800",
        badgeText: "text-orange-700",
        dotColor: "bg-[#FF7900]",
      };
    case "mtn_momo":
      return {
        label: "MTN MoMo",
        badgeBg: "bg-yellow-50 border-yellow-200 text-yellow-800",
        badgeText: "text-yellow-800",
        dotColor: "bg-[#FFCC00]",
      };
    case "moov_money":
      return {
        label: "Moov Money",
        badgeBg: "bg-blue-50 border-blue-200 text-blue-800",
        badgeText: "text-blue-700",
        dotColor: "bg-[#005DAA]",
      };
    case "cash":
      return {
        label: "Espèces",
        badgeBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        badgeText: "text-emerald-700",
        dotColor: "bg-emerald-600",
      };
    case "bank_transfer":
      return {
        label: "Virement",
        badgeBg: "bg-purple-50 border-purple-200 text-purple-800",
        badgeText: "text-purple-700",
        dotColor: "bg-purple-600",
      };
    default:
      return {
        label: "Autre",
        badgeBg: "bg-slate-50 border-slate-200 text-slate-700",
        badgeText: "text-slate-700",
        dotColor: "bg-slate-500",
      };
  }
}
