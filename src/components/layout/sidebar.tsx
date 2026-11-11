"use client";

import React from "react";
import {
  Sprout,
  LayoutDashboard,
  CalendarCheck,
  Users,
  Layers,
  Wallet,
  CreditCard,
  LogOut,
  Wifi,
  WifiOff,
  ChevronRight,
  ShieldCheck,
  X,
  Settings,
} from "lucide-react";
import { CompanySettings } from "@/types/payroll";

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  workerCount: number;
  activityCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenQuickAttendance: () => void;
  onOpenActivities: () => void;
  companySettings?: CompanySettings;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  workerCount,
  activityCount,
  isOpenMobile,
  onCloseMobile,
  onOpenQuickAttendance,
  onOpenActivities,
  companySettings,
}) => {
  const [isOnline, setIsOnline] = React.useState(true);

  const menuItems = [
    {
      id: "dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboard,
      description: "Vue d'ensemble & KPIs",
    },
    {
      id: "pointage",
      label: "Pointage Terrain",
      icon: CalendarCheck,
      badge: "Aujourd'hui",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      description: "1-tap / 2-taps rapide",
    },
    {
      id: "journaliers",
      label: "Journaliers",
      icon: Users,
      badge: `${workerCount}`,
      badgeColor: "bg-emerald-400 text-emerald-950 font-bold",
      description: "Fiches, Import & Export",
    },
    {
      id: "activites",
      label: "Activités et Domaines",
      icon: Layers,
      badge: `${activityCount}`,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      description: "Parcelles & Barèmes",
    },
    {
      id: "paiements",
      label: "Paiements Quinzaine",
      icon: Wallet,
      description: "Cycle 15 jours (2 500 F/j)",
    },
    {
      id: "avances",
      label: "Avances sur Salaire",
      icon: CreditCard,
      description: "Retenues & Soldes",
    },
    {
      id: "parametres",
      label: "Paramètres",
      icon: Settings,
      description: "Utilisateurs & Société",
    },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Barre Latérale Gauche */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#103423] text-white flex flex-col border-r border-[#0B261A] shadow-xl transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* En-tête de la Sidebar : Identité FermePaie & Entreprise */}
        <div className="p-5 border-b border-[#184630] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {companySettings?.logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md border border-emerald-400/30 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companySettings.logoUrl}
                  alt={companySettings.companyName}
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shrink-0">
                <Sprout className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="font-extrabold text-base tracking-wide text-white block">
                TFS PAIE
              </span>
              <p className="text-[11px] text-emerald-200/70 font-medium truncate max-w-[150px]">
                {companySettings?.companyName || "Domaine des Niayes"}
              </p>
            </div>
          </div>

          {/* Fermeture sur Mobile */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-900/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Principale (Menu Gauche) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
            Menu Principal
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-[#092217] text-white shadow-inner border border-emerald-500/40"
                    : "text-emerald-100/80 hover:bg-[#143F2B] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "bg-[#184630] text-emerald-300 group-hover:bg-emerald-700 group-hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold leading-tight">{item.label}</span>
                    <span className="text-[10px] text-emerald-200/60 block font-normal">
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      item.badgeColor || "bg-emerald-900 text-emerald-200 border-emerald-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pied de la Sidebar : État réseau & Profil gérant */}
        <div className="p-4 border-t border-[#184630] bg-[#0C291C]/80 space-y-3">
          {/* État de synchronisation hors-ligne */}
          <div className="flex items-center justify-between text-xs">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="flex items-center gap-2 text-emerald-200 hover:text-white transition-colors"
              title="Cliquer pour simuler mode hors-ligne"
            >
              {isOnline ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-300">
                    En ligne (Sync active)
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] font-medium text-amber-300">
                    Mode Hors-ligne
                  </span>
                </>
              )}
            </button>
            <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
          </div>

          {/* Profil utilisateur & Déconnexion */}
          <div className="pt-2 border-t border-[#184630] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-700 font-bold text-white flex items-center justify-center text-xs border border-emerald-500/40">
                ED
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  El Hadj Diallo
                </p>
                <p className="text-[10px] text-emerald-300/70">
                  Propriétaire / Gérant
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("Session déconnectée avec succès.")}
              title="Se déconnecter"
              className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-950/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
