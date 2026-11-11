"use client";

import React from "react";
import {
  Menu,
  CalendarCheck,
  PlusCircle,
  Database,
  RefreshCw,
} from "lucide-react";
import { CompanySettings } from "@/types/payroll";

interface HeaderBarProps {
  activeView: string;
  onOpenMobileSidebar: () => void;
  onOpenQuickAttendance: () => void;
  onOpenNewPayment: () => void;
  companySettings?: CompanySettings;
  isSupabaseConnected?: boolean;
  isSyncing?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeView,
  onOpenMobileSidebar,
  onOpenQuickAttendance,
  onOpenNewPayment,
  companySettings,
  isSupabaseConnected = true,
  isSyncing = false,
}) => {
  const getPageTitle = () => {
    switch (activeView) {
      case "dashboard":
        return {
          title: "Tableau de Bord",
          subtitle: "Supervision des opérations, coûts de main-d'œuvre et décaissements",
        };
      case "pointage":
        return {
          title: "Feuille de Pointage Terrain",
          subtitle: "Émargement des journaliers à 2 500 F CFA/jour (demi-journée : 1 250 F CFA) • Filtres & Import/Export",
        };
      case "journaliers":
        return {
          title: "Répertoire des Journaliers",
          subtitle: "Gestion du personnel agricole, import & export CSV des fiches",
        };
      case "paiements":
        return {
          title: "Paiements de Quinzaine",
          subtitle: "Règlement des quinzaines de 15 jours à 2 500 F CFA/jour",
        };
      case "avances":
        return {
          title: "Avances sur Salaire",
          subtitle: "Suivi des acomptes accordés et retenues automatiques sur paie",
        };
      case "activites":
        return {
          title: "Activités & Domaines Agricoles",
          subtitle: "Gestion des filières, parcelles d'exploitation et barèmes de rémunération",
        };
      case "parametres":
        return {
          title: "Paramètres de l'Exploitation",
          subtitle: "Gestion des utilisateurs, autorisations d'accès et profil de la société",
        };
      default:
        return {
          title: "TFS PAIE",
          subtitle: "Gestion agricole & paie journaliers",
        };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5DED5] px-4 sm:px-6 py-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Gauche : Bouton Hamburger Mobile + Titre de la Vue Active */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 bg-sand-50 hover:bg-slate-100 border border-[#D5C7B8] focus:outline-none"
            aria-label="Ouvrir le menu latéral"
          >
            <Menu className="w-5 h-5 text-emerald-900" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
              {pageInfo.title}
            </h2>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Droite : Indicateur Supabase & Actions prioritaires */}
        <div className="flex items-center gap-2.5">
          {/* Badge Supabase */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSupabaseConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
            title={isSupabaseConnected ? "Connecté à Supabase PostgreSQL avec RLS" : "Mode local hors-ligne"}
          >
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            )}
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-[11px] font-bold">
              {isSyncing ? "Sync..." : isSupabaseConnected ? "Supabase Connecté" : "Hors-ligne"}
            </span>
          </div>

          <button
            onClick={onOpenQuickAttendance}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-transform active:scale-95"
            id="header-btn-quick-attendance"
          >
            <CalendarCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Pointer Aujourd&apos;hui</span>
            <span className="sm:hidden">Pointer</span>
          </button>

          <button
            onClick={onOpenNewPayment}
            className="touch-btn inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-transform active:scale-95"
            id="header-btn-new-payment"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Payer Quinzaine</span>
            <span className="sm:hidden">Payer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
