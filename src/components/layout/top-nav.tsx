"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sprout,
  CalendarCheck,
  Users,
  Wallet,
  LogOut,
  Menu,
  X,
  CreditCard,
  Bell,
  Wifi,
  WifiOff,
  Layers,
  Settings,
} from "lucide-react";

interface TopNavProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenQuickAttendance?: () => void;
  onOpenNewPayment?: () => void;
  onOpenNewWorker?: () => void;
  onOpenActivities?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab = "dashboard",
  onSelectTab,
  onOpenQuickAttendance,
  onOpenNewPayment,
  onOpenNewWorker,
  onOpenActivities,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const navLinks = [
    { id: "dashboard", label: "TABLEAU DE BORD", icon: Sprout },
    { id: "pointage", label: "POINTAGE TERRAIN", icon: CalendarCheck, badge: "Aujourd'hui" },
    { id: "journaliers", label: "JOURNALIERS", icon: Users, badge: "120" },
    { id: "activites", label: "ACTIVITÉS ET DOMAINES", icon: Layers, badge: "8" },
    { id: "paiements", label: "PAIEMENTS (QUINZAINE)", icon: Wallet },
    { id: "avances", label: "AVANCES", icon: CreditCard },
    { id: "parametres", label: "PARAMÈTRES", icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "activites" && onOpenActivities) {
      onOpenActivities();
    } else if (onSelectTab) {
      onSelectTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#143D2B] text-white shadow-md border-b border-[#0E2C1F]">
      {/* Barre supérieure principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo et Nom de l'Exploitation (Inspiré de la capture) */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Sprout className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wide text-white text-base sm:text-lg">
                  TFS PAIE
                </span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                  FCFA
                </span>
              </div>
              <p className="text-xs text-emerald-100/70 font-medium hidden sm:block truncate max-w-xs">
                Domaine Agricole des Niayes — El Hadj Diallo
              </p>
            </div>
          </div>

          {/* Navigation Desktop (Alignée à droite comme dans la capture) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleTabClick(link.id)}
                  className={`px-3.5 py-2 text-xs font-bold tracking-wider rounded-md transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#0A2418] text-emerald-300 border border-emerald-500/40 shadow-inner"
                      : "text-emerald-100/80 hover:text-white hover:bg-emerald-900/40"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-emerald-800/80 text-emerald-200"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Statut Réseau & Déconnexion */}
            <div className="h-6 w-px bg-emerald-800 mx-2" />

            <button
              onClick={() => setIsOnline(!isOnline)}
              title={isOnline ? "Connecté au serveur" : "Mode Hors Ligne Actif"}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40"
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] text-emerald-300">En ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-amber-300">Hors-ligne</span>
                </>
              )}
            </button>

            <button
              onClick={() => alert("Session déconnectée avec succès.")}
              className="px-3 py-2 text-xs font-bold tracking-wider text-rose-300 hover:text-rose-100 hover:bg-rose-950/50 rounded-md transition-colors flex items-center gap-1 ml-1"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </nav>

          {/* Bouton Menu Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="p-2 rounded-lg bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
            >
              {isOnline ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-emerald-900/50 text-white hover:bg-emerald-800 border border-emerald-700/50 focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile déroulant */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0F2D20] border-b border-emerald-900 px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-2 px-1">
            Navigation Exploitation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleTabClick(link.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-semibold ${
                  isActive
                    ? "bg-emerald-700 text-white"
                    : "text-emerald-100 hover:bg-emerald-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-emerald-300" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-emerald-900 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenQuickAttendance) onOpenQuickAttendance();
              }}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Pointer Aujourd&apos;hui (120 ouvriers)</span>
            </button>

            <button
              onClick={() => alert("Session déconnectée.")}
              className="w-full py-2.5 text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>DÉCONNEXION (LOGOUT)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
