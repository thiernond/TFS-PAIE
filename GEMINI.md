# FERMEPAIE (TFS PAIE) — RÈGLES D'INGÉNIERIE, SÉCURITÉ & ARCHITECTURE

Ce document constitue la référence absolue pour le développement, la sécurité et la conception produit de l'application **FermePaie**.

---

## 1. Contexte & Mission du Produit

* **Produit** : Logiciel SaaS de gestion des présences, du travail au rendement, des avances et de la paie pour exploitations agricoles et plantations en Afrique (priorité Zone UEMOA : Sénégal, Côte d'Ivoire, Mali, etc.).
* **Devise de base** : Franc CFA (XOF) — montants manipulés sous forme d'entiers stricts (0 décimale flottante).
* **Rémunération standard** : **2 500 F CFA par jour** (demi-journée = 1 250 F CFA). Taux personnalisable par ouvrier/activité.
* **Cycle de paie standard** : **La Quinzaine (tous les 15 jours)**. Tout paiement ou bulletin de paie doit obligatoirement être rattaché à une période couverte (Date de début et Date de fin de quinzaine, ex: 1er au 15, 16 au 30/31).
* **Fiche Journalier** : Doit obligatoirement intégrer la **Fonction** (poste/tâche : récolteur, désherbeur, arroseur, pépiniériste, etc.) et le **Domaine / Activité** (parcelle/filière : maraîchage, vergers, grandes cultures, élevage).
* **Gestion des Activités** : Catalogue paramétrable par domaine avec taux au temps ou au rendement (kg, caisses), modifiable à tout moment par le gestionnaire.
* **Moyens de paiement prioritaires** : Wave, Orange Money, MTN MoMo, Moov Money, Espèces.
* **Échelle cible** : Exploitations agricoles intensives (100+ journaliers en saison, plusieurs superviseurs et parcelles en simultané).
* **Contraintes terrain** :
  * Connectivité 3G/Edge intermittente : pointage hors ligne obligatoire (Offline-First via IndexedDB et synchronisation de fond).
  * Ergonomie plein soleil : contraste fort (ratios WCAG AAA sur éléments critiques), cibles tactiles larges (>= 48px), navigation optimisée à une main sur smartphone Android.

---

## 2. Stack Technique & Standards

* **Framework** : Next.js 14+ (App Router).
  * Server Components par défaut pour les performances réseau et l'allègement du bundle JS client.
  * Server Actions pour toutes les mutations de données (validation Zod obligatoire).
* **Base de données & Auth** : Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Storage pour photos/justificatifs).
* **Typage & Validation** :
  * TypeScript strict (`noImplicitAny: true`, `strictNullChecks: true`).
  * Zod pour la validation de toutes les charges utiles (Server Actions, formulaires, payloads de sync).
  * React Hook Form avec `@hookform/resolvers/zod`.
* **Styling & Design System** :
  * Tailwind CSS avec tokens sur-mesure "Terre & Végétal" (Vert Canopée `#1E3A2F`, Ocre Terracotta `#C25E34`, Sable chaud `#F9F6F0`, etc.).
  * Composants accessibles basés sur Radix UI / Lucide React.
  * Zéro look "SaaS générique" : typographie forte, en-têtes illustrés, cartes d'action lisibles.

---

## 3. Sécurité & Règles Non-Négociables

### A. RLS (Row Level Security) Supabase Universelle
* **100% des tables** doivent avoir `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`.
* Aucune requête directe non protégée par un `farm_id`.
* L'isolation multi-tenant est garantie par `farm_id UUID NOT NULL REFERENCES farms(id)`.
* Les politiques RLS vérifient l'appartenance à la ferme via `profiles.farm_id` et le rôle utilisateur :
  1. `owner` (Propriétaire / Gérant) : accès en lecture et écriture total sur la ferme.
  2. `supervisor` (Chef d'équipe) : écriture sur les pointages de ses équipes tant que la journée n'est pas clôturée ; lecture de sa liste d'ouvriers ; AUCUN accès aux données financières globales ni aux soldes de trésorerie.
  3. `cashier` (Caissier / Comptable) : émargement des paiements (Wave, OM, Cash) et consultation des bulletins validés.

### B. Intégrité Financière & Règle d'Or du Zéro Flottant
* **Interdiction absolue** de l'utilisation de `Number` flottants pour les calculs d'argent.
* Tous les montants financiers sont des entiers en FCFA (`BIGINT` ou `INTEGER` en PostgreSQL).
* Les calculs de paie sont encapsulés dans un moteur pur `computePayslip()` sans effets de bord :
  $$\text{Brut} = (\text{jours} \times \text{taux}) + (\text{demi-jours} \times \frac{\text{taux}}{2}) + \sum(\text{qté} \times \text{tarif unitaire}) + \text{heures sup} + \text{primes}$$
  $$\text{Déduction Avance} = \min(\text{Solde Avance}, \max(0, \text{Brut} - \text{Autres Retenues}))$$
  $$\text{Net à Payer} = \text{Brut} - \text{Retenues} - \text{Déduction Avance}$$
* **Règle d'avance validée** : Remboursement intégral immédiat dès la première paie possible. Le solde non couvert est reporté automatiquement sur la paie suivante.

### C. Piste d'Audit Immuable
* Toute action critique est enregistrée dans `audit_logs` :
  * Clôture journalière des pointages (`LOCK_ATTENDANCE`).
  * Réouverture exceptionnelle d'une journée par le propriétaire (`UNLOCK_ATTENDANCE`).
  * Validation d'une période de paie (`VALIDATE_PAYROLL`).
  * Modification manuelle de bulletin (`ADJUST_PAYSLIP`).
  * Enregistrement ou annulation d'un paiement (`PAYMENT_RECORDED`).

### D. Offline-First & Synchronisation Idempotente
* Les pointages génèrent un `client_sync_id` unique (UUIDv7) stocké localement dans IndexedDB.
* La synchronisation s'effectue par lot (batch). Si la connexion coupe à mi-chemin, les enregistrements déjà reçus ne sont jamais dupliqués grâce à la contrainte d'unicité sur `client_sync_id`.

---

## 4. Architecture des Rôles & Permissions

| Fonctionnalité | Propriétaire (`owner`) | Superviseur (`supervisor`) | Caissier (`cashier`) |
| :--- | :---: | :---: | :---: |
| Dashboard consolidé & KPIs financiers | Oui | Non (vue terrain uniquement) | Oui (vue caisse) |
| Pointage quotidien (1-tap/2-taps) | Oui | Oui (son équipe) | Non |
| Clôture & réouverture de journée | Oui | Clôture seule | Non |
| Gestion des ouvriers (Création/Édition) | Oui | Oui (création rapide) | Non |
| Octroi d'avances sur salaire | Oui | Non | Non |
| Calcul et validation des paies | Oui | Non | Non |
| Émargement des paiements (Wave/OM/Cash)| Oui | Non | Oui |
| Export des lots Mobile Money (CSV) | Oui | Non | Oui |
| Paramètres de la ferme & gestion d'équipe| Oui | Non | Non |

---

## 5. Guide de Style & Directives UX

1. **Simplicité & Rapidité de Pointage** :
   * Le superviseur doit pouvoir pointer 100 ouvriers en moins de 2 minutes.
   * Un bouton "Tout marquer présent" suivi de bascules individuelles 1-tap/2-taps.
2. **Couleurs Sémantiques** :
   * Présent : Vert Prairie `#15803D`.
   * Demi-journée : Ocre Ambré `#D97706`.
   * Absent : Gris ardoise clair `#94A3B8`.
   * Tâche / Rendement : Bleu Cobalt doux `#2563EB`.
3. **Paiements Mobiles Visuels** :
   * Badges colorés distinctifs pour chaque opérateur : Wave (Bleu cyan), Orange Money (Orange vif), MTN (Jaune soleil), Moov (Bleu ciel), Espèces (Vert menthe).
