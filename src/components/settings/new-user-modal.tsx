"use client";

import React, { useState } from "react";
import {
  X,
  Check,
  UserCheck,
  Shield,
  Briefcase,
  Wallet,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AppUser, UserRole, Team } from "@/types/payroll";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onAddUser: (user: AppUser) => void;
  editingUser?: AppUser | null;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  onClose,
  teams,
  onAddUser,
  editingUser,
}) => {
  const [firstName, setFirstName] = useState(editingUser?.firstName || "");
  const [lastName, setLastName] = useState(editingUser?.lastName || "");
  const [email, setEmail] = useState(editingUser?.email || "");
  const [phone, setPhone] = useState(editingUser?.phone || "");
  const [role, setRole] = useState<UserRole>(editingUser?.role || "supervisor");
  const [teamId, setTeamId] = useState(editingUser?.teamId || teams[0]?.id || "");

  React.useEffect(() => {
    if (editingUser) {
      setFirstName(editingUser.firstName);
      setLastName(editingUser.lastName);
      setEmail(editingUser.email);
      setPhone(editingUser.phone || "");
      setRole(editingUser.role);
      setTeamId(editingUser.teamId || teams[0]?.id || "");
    } else if (isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setRole("supervisor");
      setTeamId(teams[0]?.id || "");
    }
  }, [editingUser, isOpen, teams]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;

    const selectedTeam = teams.find((t) => t.id === teamId);

    const userToSave: AppUser = {
      id: editingUser?.id || `user-${Date.now().toString().slice(-4)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      teamId: role === "supervisor" ? teamId : undefined,
      teamName: role === "supervisor" ? selectedTeam?.name : undefined,
      isActive: editingUser ? editingUser.isActive : true,
      createdAt: editingUser?.createdAt || new Date().toISOString().split("T")[0],
      lastLogin: editingUser?.lastLogin || "Jamais connecté",
    };

    onAddUser(userToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E5DED5] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Fixe */}
        <div className="px-5 py-3.5 border-b border-[#F0EBE3] flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                {editingUser ? "Modifier l'Utilisateur" : "Nouvel Utilisateur & Autorisations"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Attribution des rôles et droits d&apos;accès à l&apos;exploitation agricole
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

        {/* Formulaire défilant */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 text-xs">
            {/* Prénom et Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Mamadou"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: Sow"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Email et Téléphone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adresse Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: msow@ferme.sn"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Numéro Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: +221 77 123 45 67"
                  className="w-full px-3 py-2 rounded-lg border border-[#D5C7B8] bg-sand-50/50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs shadow-2xs"
                />
              </div>
            </div>

            {/* Sélection du Rôle / Autorisations */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Rôle & Niveau d&apos;Autorisation *
              </label>

              <div className="space-y-2">
                {/* 1. Propriétaire / Gérant */}
                <div
                  onClick={() => setRole("owner")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    role === "owner"
                      ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200"
                      : "bg-white border-[#E5DED5] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900">
                          Propriétaire / Gérant (Owner)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Accès total : KPIs financiers, validation des paies, gestion des avances et de l&apos;équipe
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Accès Total
                    </span>
                  </div>
                </div>

                {/* 2. Superviseur / Chef d'équipe */}
                <div
                  onClick={() => setRole("supervisor")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    role === "supervisor"
                      ? "bg-sky-50/80 border-sky-500 ring-2 ring-sky-200"
                      : "bg-white border-[#E5DED5] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                        <Briefcase className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900">
                          Chef d&apos;Équipe / Superviseur (Supervisor)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Pointage terrain quotidien, clôture de journée, enregistrement rapide d&apos;ouvriers. Aucun accès aux finances.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      Terrain Seul
                    </span>
                  </div>
                </div>

                {/* 3. Caissier / Trésorier */}
                <div
                  onClick={() => setRole("cashier")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    role === "cashier"
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-200"
                      : "bg-white border-[#E5DED5] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-xs">
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900">
                          Caissier / Trésorier (Cashier)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Émargement des paiements Wave/OM/Cash, génération des reçus et exports de lots Mobile Money
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Caisse & Reçus
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Équipe supervisée (affiché uniquement si rôle superviseur) */}
            {role === "supervisor" && (
              <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 animate-in fade-in duration-150">
                <label className="block font-bold text-slate-800 mb-1">
                  Équipe Agricole Assignée au Superviseur *
                </label>
                <div className="relative">
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full appearance-none px-3 py-2 text-xs font-semibold rounded-lg border border-[#D5C7B8] bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-700 pr-8"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.workerCount} ouvriers)
                      </option>
                    ))}
                  </select>
                  <Users className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Le superviseur ne pourra pointer et clôturer que les journaliers appartenant à cette équipe.
                </p>
              </div>
            )}
          </div>

          {/* Pied Fixe */}
          <div className="px-5 py-3 border-t border-[#F0EBE3] bg-sand-50/90 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingUser ? "Mettre à jour" : "Créer l'Utilisateur"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
