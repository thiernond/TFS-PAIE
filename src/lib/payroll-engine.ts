/**
 * MOTEUR FINANCIER & CALCUL PUR DE PAIE — FERMEPAIE (TFS PAIE)
 * Strict respect des règles GEMINI.md :
 * 1. Règle d'or du Zéro Flottant : 100% des montants sont des entiers stricts en Franc CFA (XOF).
 * 2. Formule pure de paie sans effets de bord :
 *    Brut = (jours * taux) + (demi-jours * taux/2) + sum(qté * tarif) + heures sup + primes
 *    Déduction Avance = min(Solde Avance, max(0, Brut - Autres Retenues))
 *    Net à Payer = Brut - Retenues - Déduction Avance
 * 3. Règle d'avance validée : Remboursement intégral immédiat dès la première paie possible,
 *    le solde non couvert étant reporté automatiquement sur la paie suivante.
 */

export interface PayslipInput {
  daysWorked: number; // Nombre de jours complets
  halfDaysWorked?: number; // Nombre de demi-journées
  dailyRate: number; // Taux journalier standard (ex: 2 500 F CFA)
  pieceRateItems?: { quantity: number; unitRate: number }[]; // Travail au rendement (kg, caisses)
  overtimeHours?: number; // Heures supplémentaires
  overtimeHourlyRate?: number; // Taux horaire sup
  bonuses?: number; // Primes de rendement/assiduité (FCFA)
  otherDeductions?: number; // Autres retenues (ex: casse matériel, etc.) (FCFA)
  currentAdvanceBalance: number; // Solde avance actuel sur salaire (FCFA)
}

export interface PayslipResult {
  baseWage: number; // (jours * taux) + (demi-jours * taux / 2)
  pieceRateTotal: number; // sum(qte * tarif)
  overtimeTotal: number; // heures * tauxHoraire
  bonusesTotal: number; // total primes
  grossAmount: number; // Brut = baseWage + pieceRateTotal + overtimeTotal + bonusesTotal
  advanceDeduction: number; // Déduction Avance = min(Solde Avance, max(0, Brut - Autres Retenues))
  remainingAdvanceBalance: number; // Solde avance restant reporté automatiquement
  otherDeductions: number; // Autres retenues
  totalDeductions: number; // Retenues + Déduction Avance
  netPayable: number; // Net à Payer = Brut - Retenues - Déduction Avance
}

export function computePayslip(input: PayslipInput): PayslipResult {
  const dailyRate = Math.round(input.dailyRate || 2500);
  const halfDayRate = Math.floor(dailyRate / 2); // 1 250 F CFA pour 2 500 F CFA

  const days = Math.max(0, Math.floor(input.daysWorked || 0));
  const halfDays = Math.max(0, Math.floor(input.halfDaysWorked || 0));

  const baseWage = days * dailyRate + halfDays * halfDayRate;

  const pieceRateTotal = (input.pieceRateItems || []).reduce((acc, item) => {
    return acc + Math.round((item.quantity || 0) * (item.unitRate || 0));
  }, 0);

  const overtimeTotal = Math.round(
    (input.overtimeHours || 0) * (input.overtimeHourlyRate || 0)
  );

  const bonusesTotal = Math.max(0, Math.round(input.bonuses || 0));
  const otherDeductions = Math.max(0, Math.round(input.otherDeductions || 0));
  const currentAdvance = Math.max(0, Math.round(input.currentAdvanceBalance || 0));

  // 1. Calcul du Salaire Brut
  const grossAmount = baseWage + pieceRateTotal + overtimeTotal + bonusesTotal;

  // 2. Déduction d'Avance (remboursement intégral plafonné au brut net de retenues)
  const maxAvailableForAdvance = Math.max(0, grossAmount - otherDeductions);
  const advanceDeduction = Math.min(currentAdvance, maxAvailableForAdvance);

  // 3. Solde d'avance restant à reporter sur la quinzaine suivante
  const remainingAdvanceBalance = Math.max(0, currentAdvance - advanceDeduction);

  // 4. Retenues totales
  const totalDeductions = otherDeductions + advanceDeduction;

  // 5. Net à payer (toujours >= 0)
  const netPayable = Math.max(0, grossAmount - totalDeductions);

  return {
    baseWage,
    pieceRateTotal,
    overtimeTotal,
    bonusesTotal,
    grossAmount,
    advanceDeduction,
    remainingAdvanceBalance,
    otherDeductions,
    totalDeductions,
    netPayable,
  };
}
