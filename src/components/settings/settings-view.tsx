"use client";

import React, { useState } from "react";
import {
  Users,
  Building2,
  Shield,
  Briefcase,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Check,
  MapPin,
  Phone,
  Mail,
  Coins,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Sliders,
  HelpCircle,
  Image as ImageIcon,
  FolderOpen,
  UploadCloud,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { AppUser, CompanySettings, Team, UserRole } from "@/types/payroll";
import { NewUserModal } from "./new-user-modal";
import { formatFCFA } from "@/lib/utils/formatters";

const PRESET_LOGOS = {
  maraichage:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23103423'/><circle cx='50' cy='50' r='38' stroke='%23E2B855' stroke-width='2' stroke-dasharray='4 2'/><path d='M50 20C42 32 35 48 35 60C35 68.28 41.71 75 50 75C58.28 75 65 68.28 65 60C65 48 58 32 50 20Z' fill='%232ECC71'/><path d='M50 28V72' stroke='%230E291C' stroke-width='2'/><circle cx='50' cy='24' r='3' fill='%23E2B855'/></svg>",
  vergers:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23C25E34'/><circle cx='50' cy='50' r='38' stroke='%23F6E05E' stroke-width='2'/><circle cx='50' cy='52' r='24' fill='%23F6AD55'/><path d='M50 24C50 24 53 32 50 36' stroke='%237B341E' stroke-width='3' stroke-linecap='round'/><path d='M50 28C56 26 62 30 60 34C54 34 50 28 50 28Z' fill='%2338A169'/></svg>",
  elevage:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231E3A8A'/><circle cx='50' cy='50' r='38' stroke='%23FDE047' stroke-width='2'/><path d='M50 75V25M50 25C44 32 40 42 42 50M50 35C56 42 60 52 58 60M50 45C44 52 40 62 42 70' stroke='%23FACC15' stroke-width='3' stroke-linecap='round'/></svg>",
};

interface SettingsViewProps {
  users: AppUser[];
  companySettings: CompanySettings;
  teams: Team[];
  onSaveCompanySettings: (settings: CompanySettings) => void;
  onAddUser: (user: AppUser) => void;
  onUpdateUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  users,
  companySettings,
  teams,
  onSaveCompanySettings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<"users" | "company" | "rules">("company");
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form state for Company Settings (initialisé depuis props ou localStorage)
  const [companyForm, setCompanyForm] = useState<CompanySettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tfs_paie_company_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && parsed.companyName) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return companySettings;
  });
  const [isSavedMessage, setIsSavedMessage] = useState(false);

  // Logo file browsing & drag-and-drop state
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Restauration de l'onglet actif et synchronisation initiale
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedTab = localStorage.getItem("tfs_paie_settings_active_tab");
        if (savedTab === "company" || savedTab === "users" || savedTab === "rules") {
          setActiveTab(savedTab);
        }
        const savedCompany = localStorage.getItem("tfs_paie_company_settings");
        if (savedCompany) {
          const parsed = JSON.parse(savedCompany);
          if (parsed && parsed.companyName) {
            setCompanyForm(parsed);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Synchronisation avec les props uniquement si companySettings change depuis l'extérieur
  React.useEffect(() => {
    if (companySettings && companySettings.companyName) {
      setCompanyForm((prev) => ({
        ...companySettings,
        ...prev,
        companyName: prev.companyName || companySettings.companyName,
      }));
    }
  }, [companySettings]);

  const handleTabChange = (tab: "users" | "company" | "rules") => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tfs_paie_settings_active_tab", tab);
      } catch (e) {}
    }
  };

  const handleProcessLogoFile = (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Format invalide : Veuillez sélectionner une image (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("L'image est trop volumineuse (maximum 5 Mo autorisés).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCompanyForm((prev) => ({
          ...prev,
          logoUrl: dataUrl,
        }));
      }
    };
    reader.onerror = () => {
      setLogoError("Erreur de lecture du fichier image.");
    };
    reader.readAsDataURL(file);
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
    e.target.value = "";
  };

  const handleRemoveLogo = () => {
    setLogoError(null);
    setCompanyForm((prev) => ({
      ...prev,
      logoUrl: undefined,
    }));
  };

  const handleSaveCompany = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const toSave: CompanySettings = {
      ...companyForm,
      companyName: companyForm.companyName?.trim() || "TFS PAIE Exploitation",
      legalForm: companyForm.legalForm?.trim() || "Société Civile Agricole (SCA)",
      registrationNumber: companyForm.registrationNumber?.trim() || "",
      managerName: companyForm.managerName?.trim() || "",
      country: companyForm.country?.trim() || "Sénégal",
      region: companyForm.region?.trim() || "Thiès",
      address: companyForm.address?.trim() || "",
      phone: companyForm.phone?.trim() || "",
      email: companyForm.email?.trim() || "",
      currency: "Franc CFA (XOF)",
      standardDailyRate: Number(companyForm.standardDailyRate) || 2500,
      payrollCycle: "quinzaine",
      activeOperators: companyForm.activeOperators || ["wave", "orange_money", "mtn_momo", "cash"],
      logoUrl: companyForm.logoUrl,
    };

    // 1. Sauvegarde locale immédiate (anti-perte et persistance entre rechargements)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tfs_paie_company_settings", JSON.stringify(toSave));
      } catch (err) {
        console.error("Erreur de sauvegarde locale:", err);
      }
    }

    // 2. Mettre à jour l'état local et notifier le parent
    setCompanyForm(toSave);
    onSaveCompanySettings(toSave);

    // 3. Afficher le feedback visuel
    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 4000);
  };

  const handleToggleUserStatus = (user: AppUser) => {
    onUpdateUser({
      ...user,
      isActive: !user.isActive,
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "owner":
        return {
          label: "Propriétaire / Gérant",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: Shield,
        };
      case "supervisor":
        return {
          label: "Superviseur Terrain",
          badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
          icon: Briefcase,
        };
      case "cashier":
        return {
          label: "Caissier / Trésorier",
          badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
          icon: Wallet,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. En-tête de section Paramètres avec Onglets de Navigation */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5DED5] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A2F] to-[#142B21] text-white flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Paramètres de l&apos;Exploitation
              </h2>
              <p className="text-xs text-slate-500">
                Gestion des comptes utilisateurs, autorisations d&apos;accès et profil de la société
              </p>
            </div>
          </div>

          {activeTab === "users" && (
            <button
              onClick={() => {
                setEditingUser(null);
                setIsNewUserModalOpen(true);
              }}
              className="touch-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-transform active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nouvel Utilisateur</span>
            </button>
          )}
        </div>

        {/* Onglets : Entreprise | Utilisateurs | Règles Paie */}
        <div className="flex items-center gap-2 border-b border-[#F0EBE3] pt-2">
          <button
            type="button"
            onClick={() => handleTabChange("company")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "company"
                ? "border-emerald-800 text-emerald-900 bg-emerald-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Entreprise & Société</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("users")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "users"
                ? "border-emerald-800 text-emerald-900 bg-emerald-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs & Autorisations</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rules")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === "rules"
                ? "border-emerald-800 text-emerald-900 bg-emerald-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-t-lg"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Règles & Permissions</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENU DES ONGLETS (Permanent dans le DOM, évitant toute perte de saisie) */}
      {/* ONGLET 1 : GESTION DES UTILISATEURS */}
      <div className={activeTab === "users" ? "space-y-6" : "hidden"}>
          {/* Synthèse rapide des rôles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-[#E5DED5] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Propriétaire / Gérant
                </span>
                <span className="text-xl font-black text-slate-900">
                  {users.filter((u) => u.role === "owner").length} compte
                </span>
                <p className="text-[10px] text-emerald-700 font-semibold">Accès illimité & Validation paie</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5DED5] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Superviseurs Terrain
                </span>
                <span className="text-xl font-black text-slate-900">
                  {users.filter((u) => u.role === "supervisor").length} comptes
                </span>
                <p className="text-[10px] text-sky-700 font-semibold">Pointage 1-tap & Clôture équipe</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5DED5] shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Caissiers / Trésoriers
                </span>
                <span className="text-xl font-black text-slate-900">
                  {users.filter((u) => u.role === "cashier").length} compte
                </span>
                <p className="text-[10px] text-amber-700 font-semibold">Émargement Wave/OM & Quittances</p>
              </div>
            </div>
          </div>

          {/* Table / Répertoire des Utilisateurs */}
          <div className="bg-white rounded-2xl border border-[#E5DED5] shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#F0EBE3] flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Liste des Utilisateurs et Rôles Actifs
                </h3>
                <p className="text-xs text-slate-500">
                  Chaque rôle détermine les écrans autorisés et les restrictions de sécurité
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5DED5] bg-sand-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 px-4 min-w-[200px]">Utilisateur</th>
                    <th className="py-3.5 px-4 min-w-[170px]">Rôle & Niveau</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Équipe Assignée</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Dernière Connexion</th>
                    <th className="py-3.5 px-4 text-center min-w-[100px]">Statut</th>
                    <th className="py-3.5 px-4 text-right min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE3]">
                  {users.map((u) => {
                    const roleInfo = getRoleBadge(u.role);
                    const RoleIcon = roleInfo.icon;

                    return (
                      <tr key={u.id} className="hover:bg-sand-50/50 transition-colors">
                        {/* Nom, Prénom, Email */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                              {u.firstName.charAt(0)}
                              {u.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                {u.firstName} {u.lastName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span>{u.email}</span>
                                {u.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{u.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleInfo.badgeClass}`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        {/* Équipe supervisée */}
                        <td className="py-3 px-4 text-slate-700">
                          {u.teamName ? (
                            <span className="font-semibold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                              {u.teamName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Toutes les équipes</span>
                          )}
                        </td>

                        {/* Connexion */}
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {u.lastLogin || "—"}
                        </td>

                        {/* Statut Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              u.isActive
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                            title="Cliquer pour activer/désactiver"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.isActive ? "bg-emerald-600" : "bg-slate-400"
                              }`}
                            />
                            <span>{u.isActive ? "Actif" : "Suspendu"}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setIsNewUserModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                              title="Modifier les informations"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {u.role !== "owner" && (
                              <button
                                onClick={() => onDeleteUser(u.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Supprimer ce compte"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* ONGLET 2 : ENTREPRISE & SOCIÉTÉ */}
      <div className={activeTab === "company" ? "bg-white rounded-2xl p-5 sm:p-6 border border-[#E5DED5] shadow-card space-y-6" : "hidden"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EBE3]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C25E34] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#C25E34]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Fiche d&apos;Identité de la Société Agricole
                </h3>
                <p className="text-xs text-slate-500">
                  Coordonnées légales, immatriculation et paramètres généraux de l&apos;exploitation
                </p>
              </div>
            </div>

            {isSavedMessage && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Modifications enregistrées avec succès !</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveCompany} noValidate className="space-y-4 text-xs">
            {/* 1. SECTION LOGO & IDENTITÉ VISUELLE DE L'ENTREPRISE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sand-50/90 via-emerald-50/30 to-amber-50/20 border border-[#E5DED5] space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
                    <ImageIcon className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                      Logo Officiel & Identifiabilité de l&apos;Entreprise
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Ce logo sera automatiquement imprimé sur vos bulletins de paie, quittances d&apos;émargement et l&apos;en-tête de votre exploitation.
                    </p>
                  </div>
                </div>

                {companyForm.logoUrl && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Logo configuré & actif</span>
                  </span>
                )}
              </div>

              {/* Zone principale : Aperçu du Logo + Zone Parcourir */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* 1. Cadre d'Aperçu du Logo */}
                <div className="md:col-span-4 flex flex-col items-center justify-center">
                  <div
                    className={`relative w-32 h-32 rounded-2xl border-2 flex items-center justify-center p-2.5 bg-white shadow-sm transition-all duration-200 ${
                      companyForm.logoUrl
                        ? "border-emerald-600/40 shadow-emerald-900/5 ring-4 ring-emerald-50"
                        : "border-dashed border-slate-300 bg-sand-50/60"
                    }`}
                  >
                    {companyForm.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={companyForm.logoUrl}
                        alt="Logo de l'entreprise"
                        width={96}
                        height={96}
                        className="max-w-full max-h-full object-contain drop-shadow-xs"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <Building2 className="w-10 h-10 mx-auto mb-1 text-slate-300 stroke-1" />
                        <span className="text-[10px] font-semibold text-slate-400 block leading-tight">
                          Aucun logo configuré
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1.5">
                    Aperçu en temps réel
                  </span>
                </div>

                {/* 2. Boutons d'Action & Dépose de Fichier */}
                <div className="md:col-span-8 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoInputChange}
                    className="hidden"
                  />

                  {/* Zone de Drag & Drop cliquable */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleProcessLogoFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
                      isDraggingLogo
                        ? "border-emerald-600 bg-emerald-500/10 scale-[1.01]"
                        : "border-[#D5C7B8] hover:border-emerald-700 bg-white hover:bg-emerald-50/20"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-emerald-800" />
                      </div>
                      <p className="font-bold text-xs text-slate-800">
                        Cliquez pour parcourir vos dossiers ou glissez votre logo ici
                      </p>
                      <p className="text-[11px] text-slate-500">
                        PNG, JPG, SVG ou WebP (Recommandé : image carrée ou détourée • Max 5 Mo)
                      </p>
                    </div>
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <FolderOpen className="w-4 h-4 text-emerald-200" />
                      <span>Parcourir le logo sur votre appareil...</span>
                    </button>

                    {companyForm.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Supprimer le logo</span>
                      </button>
                    )}
                  </div>

                  {/* Modèles prédéfinis */}
                  <div className="pt-2 border-t border-[#EAE3DA]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Ou choisir un modèle agricole prêt à l&apos;emploi :
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCompanyForm({ ...companyForm, logoUrl: PRESET_LOGOS.maraichage })}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#D5C7B8] hover:border-emerald-600 text-slate-700 hover:text-emerald-800 transition-colors flex items-center gap-1.5"
                      >
                        <span>🌱</span>
                        <span>Ferme Maraîchère</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanyForm({ ...companyForm, logoUrl: PRESET_LOGOS.vergers })}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#D5C7B8] hover:border-amber-600 text-slate-700 hover:text-amber-800 transition-colors flex items-center gap-1.5"
                      >
                        <span>🥭</span>
                        <span>Vergers & Manguiers</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompanyForm({ ...companyForm, logoUrl: PRESET_LOGOS.elevage })}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-[#D5C7B8] hover:border-sky-600 text-slate-700 hover:text-sky-800 transition-colors flex items-center gap-1.5"
                      >
                        <span>🌾</span>
                        <span>Grandes Cultures & Céréales</span>
                      </button>
                    </div>
                  </div>

                  {/* Erreur éventuelle */}
                  {logoError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{logoError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ligne 1 : Nom exploitation & Forme Juridique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom de l&apos;Exploitation / Société *
                </label>
                <input
                  type="text"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Forme Juridique & Statut
                </label>
                <input
                  type="text"
                  value={companyForm.legalForm}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalForm: e.target.value })}
                  placeholder="Ex: SCA, GIE Agricole, SARL..."
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Ligne 2 : NINEA/RCCM & Gérant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Numéro d&apos;Immatriculation / NINEA / RCCM
                </label>
                <input
                  type="text"
                  value={companyForm.registrationNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 font-mono font-bold rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nom du Propriétaire / Gérant Principal
                </label>
                <input
                  type="text"
                  value={companyForm.managerName}
                  onChange={(e) => setCompanyForm({ ...companyForm, managerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Ligne 3 : Pays & Région / Adresse */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pays d&apos;Opération</label>
                <input
                  type="text"
                  value={companyForm.country}
                  onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Région / Zone Agricole</label>
                <input
                  type="text"
                  value={companyForm.region}
                  onChange={(e) => setCompanyForm({ ...companyForm, region: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse Siège / Ferme</label>
                <input
                  type="text"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Ligne 4 : Téléphone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Téléphone Principal / WhatsApp Exploitation
                </label>
                <input
                  type="tel"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email de Gestion / Comptabilité
                </label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Paramètres Financiers & Devise (Conforme GEMINI.md) */}
            <div className="p-4 rounded-xl bg-sand-50/80 border border-[#E5DED5] space-y-3 mt-2">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-800" />
                <span>Paramètres Monétaires & Cycle de Paie</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Devise de Base
                  </label>
                  <input
                    type="text"
                    value="Franc CFA (XOF) • Zéro flottant"
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Taux Journalier Standard *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={companyForm.standardDailyRate}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          standardDailyRate: parseInt(e.target.value, 10) || 2500,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-white text-slate-900 font-mono font-bold text-xs"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[10px]">
                      FCFA/j
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Cycle de Paie Obligatoire
                  </label>
                  <input
                    type="text"
                    value="La Quinzaine (tous les 15 jours)"
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EBE3]">
              <span className="text-[11px] text-slate-500 font-medium">
                Les modifications sont automatiquement appliquées à vos reçus, bordereaux et barre de navigation.
              </span>
              <button
                type="submit"
                onClick={(e) => handleSaveCompany(e)}
                className="touch-btn inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#C25E34] hover:bg-[#A94F2B] text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer les Paramètres de l&apos;Entreprise</span>
              </button>
            </div>
          </form>
      </div>

      {/* ONGLET 3 : RÈGLES & MATRICE DE PERMISSIONS */}
      <div className={activeTab === "rules" ? "bg-white rounded-2xl p-5 sm:p-6 border border-[#E5DED5] shadow-card space-y-5" : "hidden"}>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Matrice des Rôles & Autorisations Terrain
            </h3>
            <p className="text-xs text-slate-500">
              Isolation stricte des données selon le rôle (Propriétaire, Superviseur, Caissier)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5DED5] bg-sand-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Fonctionnalité / Action</th>
                  <th className="py-3 px-4 text-center text-emerald-800">
                    Propriétaire (Owner)
                  </th>
                  <th className="py-3 px-4 text-center text-sky-800">
                    Superviseur (Supervisor)
                  </th>
                  <th className="py-3 px-4 text-center text-amber-800">
                    Caissier (Cashier)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE3]">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Dashboard consolidé & KPIs financiers
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non (Terrain seul)</td>
                  <td className="py-2.5 px-4 text-center text-amber-700 font-bold">Oui (Vue caisse)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Pointage quotidien (1-tap / 2-taps)
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-sky-700 font-bold">Oui (Son équipe)</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Clôture & réouverture de journée
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui (Total)</td>
                  <td className="py-2.5 px-4 text-center text-sky-700 font-bold">Clôture seule</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Gestion des ouvriers (Création / Import / Édition)
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-sky-700 font-bold">Création rapide</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Octroi d&apos;avances sur salaire
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Calcul et validation des paies de quinzaine
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Émargement des paiements (Wave / OM / MoMo / Cash)
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                  <td className="py-2.5 px-4 text-center text-amber-700 font-bold">Oui</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Export des lots de virement Mobile Money (CSV)
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                  <td className="py-2.5 px-4 text-center text-amber-700 font-bold">Oui</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    Paramètres de l&apos;entreprise & gestion des utilisateurs
                  </td>
                  <td className="py-2.5 px-4 text-center text-emerald-700 font-bold">Oui</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                  <td className="py-2.5 px-4 text-center text-slate-400">Non</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      {/* Modale de création / édition d'utilisateur */}
      <NewUserModal
        isOpen={isNewUserModalOpen}
        onClose={() => {
          setIsNewUserModalOpen(false);
          setEditingUser(null);
        }}
        teams={teams}
        onAddUser={(user) => {
          if (editingUser) {
            onUpdateUser(user);
          } else {
            onAddUser(user);
          }
        }}
        editingUser={editingUser}
      />
    </div>
  );
};
