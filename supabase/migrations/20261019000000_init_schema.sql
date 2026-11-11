-- ==============================================================================
-- FERMEPAIE (TFS PAIE) — SCHÉMA POSTGRESQL SUPABASE & POLITIQUES RLS
-- Conforme aux spécifications GEMINI.md :
-- 1. Multi-tenant étanche (isolation par farm_id)
-- 2. 100% tables avec RLS active
-- 3. Règle d'or : ZÉRO flottant (Montants en BIGINT FCFA stricts)
-- 4. Cycle Quinzaine standard (15 jours) & Taux standard 2 500 F CFA/jour
-- 5. Rôles stricts : owner, supervisor, cashier
-- 6. Piste d'audit immuable & Idempotence hors-ligne (client_sync_id)
-- ==============================================================================

-- 1. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES PRINCIPALES
-- ==============================================================================

-- A. Exploitations agricoles (Multi-tenant racine)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_form TEXT DEFAULT 'Société Civile Agricole (SCA)',
    registration_number TEXT, -- NINEA / RCCM
    manager_name TEXT,
    country TEXT NOT NULL DEFAULT 'Sénégal',
    region TEXT DEFAULT 'Thiès / Niayes',
    address TEXT DEFAULT 'Route Nationale 2, Km 45',
    phone TEXT DEFAULT '+221 77 452 10 99',
    email TEXT DEFAULT 'direction@domaineniayes.sn',
    currency TEXT NOT NULL DEFAULT 'XOF', -- Franc CFA
    standard_daily_rate BIGINT NOT NULL DEFAULT 2500, -- 2 500 FCFA/j
    payroll_cycle TEXT NOT NULL DEFAULT 'quinzaine' CHECK (payroll_cycle = 'quinzaine'),
    active_operators TEXT[] NOT NULL DEFAULT ARRAY['wave', 'orange_money', 'mtn_momo', 'cash'],
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B. Profils utilisateurs liés à Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'supervisor', 'cashier')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- C. Équipes terrain
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- D. Domaines & Parcelles agricoles
CREATE TABLE IF NOT EXISTS public.farm_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    surface_area TEXT,
    color_badge TEXT DEFAULT '#15803D',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- E. Activités & Tâches paramétrables (au temps ou au rendement)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES public.farm_domains(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    domain_name TEXT NOT NULL,
    is_piece_rate BOOLEAN NOT NULL DEFAULT false, -- travail au rendement (kg, cagettes) ou au temps
    unit_name TEXT DEFAULT 'Jour', -- ex: Caisse, Sac 50kg, Ligne, Casier
    default_unit_rate BIGINT NOT NULL DEFAULT 2500, -- en FCFA
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- F. Fiche Journalier Agricole
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    function_title TEXT NOT NULL, -- Récolteur, Désherbeur, Arroseur, etc.
    domain TEXT NOT NULL, -- Maraîchage, Vergers, etc.
    momo_operator TEXT NOT NULL DEFAULT 'wave' CHECK (momo_operator IN ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'cash', 'bank_transfer', 'other')),
    momo_number TEXT,
    daily_rate BIGINT NOT NULL DEFAULT 2500, -- Rémunération standard par jour
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    avatar_url TEXT,
    hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
    unpaid_advances BIGINT NOT NULL DEFAULT 0, -- Solde d'avance en FCFA restant dû
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- G. Clôture journalière des pointages (verrouillage terrain)
CREATE TABLE IF NOT EXISTS public.daily_attendance_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    closure_date DATE NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT true,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_by UUID REFERENCES public.profiles(id),
    unlocked_at TIMESTAMPTZ,
    unlocked_by UUID REFERENCES public.profiles(id),
    unlock_reason TEXT,
    CONSTRAINT uq_farm_closure_date UNIQUE (farm_id, closure_date)
);

-- H. Feuille de Pointage Quotidien (Offline-First via client_sync_id)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    client_sync_id UUID UNIQUE, -- Clé unique générée côté client (IndexedDB) pour synchronisation idempotente
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attendance_date DATE NOT NULL,
    attendance_type TEXT NOT NULL CHECK (attendance_type IN ('full_day', 'half_day', 'absent', 'task_piece', 'overtime')),
    activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
    piece_quantity NUMERIC(10, 2) DEFAULT 0, -- Qté récoltée ou traitée si travail au rendement
    piece_unit_rate BIGINT DEFAULT 0, -- Taux unitaire appliqué (FCFA)
    overtime_hours NUMERIC(4, 2) DEFAULT 0,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_worker_attendance_date UNIQUE (worker_id, attendance_date)
);

-- I. Avances sur salaire
CREATE TABLE IF NOT EXISTS public.advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount > 0), -- Montant accordé en FCFA
    deducted_amount BIGINT NOT NULL DEFAULT 0 CHECK (deducted_amount <= amount), -- Montant remboursé
    motif TEXT,
    date_granted DATE NOT NULL DEFAULT CURRENT_DATE,
    disbursement_method TEXT NOT NULL DEFAULT 'cash' CHECK (disbursement_method IN ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'cash', 'bank_transfer', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deducted', 'partial')),
    granted_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- J. Périodes de Paie (Quinzaines)
CREATE TABLE IF NOT EXISTS public.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: 1ère Quinzaine Octobre 2026
    period_start DATE NOT NULL, -- Ex: 2026-10-01
    period_end DATE NOT NULL,   -- Ex: 2026-10-15
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'closed')),
    total_gross BIGINT NOT NULL DEFAULT 0,
    total_advances_deducted BIGINT NOT NULL DEFAULT 0,
    total_net BIGINT NOT NULL DEFAULT 0,
    validated_at TIMESTAMPTZ,
    validated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_farm_payroll_period UNIQUE (farm_id, period_start, period_end)
);

-- K. Bulletins de Paie de Quinzaine
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    days_worked NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Nombre de jours effectifs (demi-journée = 0.5)
    daily_rate BIGINT NOT NULL DEFAULT 2500, -- Taux journalier
    base_pay BIGINT NOT NULL DEFAULT 0, -- (jours * taux) + (demi_jours * taux / 2)
    piece_work_pay BIGINT NOT NULL DEFAULT 0, -- Rendement
    overtime_pay BIGINT NOT NULL DEFAULT 0,
    bonuses BIGINT NOT NULL DEFAULT 0,
    gross_pay BIGINT NOT NULL DEFAULT 0, -- Brut total en FCFA
    advance_deducted BIGINT NOT NULL DEFAULT 0, -- Déduction intégrale d'avance prioritaire
    other_deductions BIGINT NOT NULL DEFAULT 0,
    net_pay BIGINT NOT NULL DEFAULT 0, -- Net à payer en FCFA
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method TEXT NOT NULL DEFAULT 'wave' CHECK (payment_method IN ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'cash', 'bank_transfer', 'other')),
    transaction_ref TEXT,
    paid_at TIMESTAMPTZ,
    paid_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_payslip_worker_period UNIQUE (period_id, worker_id)
);

-- L. Émargement & Règlements (Historique des Paiements)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    payslip_id UUID REFERENCES public.payslips(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount >= 0), -- Montant décaissé en FCFA
    payment_method TEXT NOT NULL CHECK (payment_method IN ('wave', 'orange_money', 'mtn_momo', 'moov_money', 'cash', 'bank_transfer', 'other')),
    transaction_ref TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type TEXT NOT NULL DEFAULT 'payroll_settlement' CHECK (payment_type IN ('daily_wage', 'piece_rate', 'advance_payout', 'payroll_settlement')),
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'failed')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- M. Piste d'Audit Immuable
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL CHECK (action IN (
        'LOCK_ATTENDANCE',
        'UNLOCK_ATTENDANCE',
        'VALIDATE_PAYROLL',
        'ADJUST_PAYSLIP',
        'PAYMENT_RECORDED',
        'GRANT_ADVANCE',
        'UPDATE_SETTINGS',
        'IMPORT_WORKERS'
    )),
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. SÉCURITÉ : ROW LEVEL SECURITY (RLS) UNIVERSELLE (100% DES TABLES)
-- ==============================================================================

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Fonctions utilitaires d'authentification pour RLS
CREATE OR REPLACE FUNCTION public.current_user_farm_id()
RETURNS UUID AS $$
  SELECT farm_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLITIQUES RLS : FARMS
CREATE POLICY "farms_read_member" ON public.farms
    FOR SELECT TO authenticated
    USING (id = public.current_user_farm_id());

CREATE POLICY "farms_update_owner" ON public.farms
    FOR UPDATE TO authenticated
    USING (id = public.current_user_farm_id() AND public.current_user_role() = 'owner');

-- POLITIQUES RLS : PROFILES
CREATE POLICY "profiles_read_farm" ON public.profiles
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "profiles_write_owner" ON public.profiles
    FOR ALL TO authenticated
    USING (farm_id = public.current_user_farm_id() AND public.current_user_role() = 'owner');

-- POLITIQUES RLS : TEAMS, DOMAINS, ACTIVITIES
CREATE POLICY "teams_read" ON public.teams
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "teams_write_owner" ON public.teams
    FOR ALL TO authenticated
    USING (farm_id = public.current_user_farm_id() AND public.current_user_role() = 'owner');

CREATE POLICY "domains_read" ON public.farm_domains
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "domains_write_owner" ON public.farm_domains
    FOR ALL TO authenticated
    USING (farm_id = public.current_user_farm_id() AND public.current_user_role() = 'owner');

CREATE POLICY "activities_read" ON public.activities
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "activities_write_owner" ON public.activities
    FOR ALL TO authenticated
    USING (farm_id = public.current_user_farm_id() AND public.current_user_role() = 'owner');

-- POLITIQUES RLS : WORKERS
CREATE POLICY "workers_read_farm" ON public.workers
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "workers_insert_owner_supervisor" ON public.workers
    FOR INSERT TO authenticated
    WITH CHECK (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'supervisor')
    );

CREATE POLICY "workers_update_owner_supervisor" ON public.workers
    FOR UPDATE TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'supervisor')
    );

-- POLITIQUES RLS : ATTENDANCES & CLOSURES
CREATE POLICY "attendance_read_farm" ON public.attendances
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "attendance_insert_update_open_day" ON public.attendances
    FOR ALL TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND (
            public.current_user_role() = 'owner'
            OR (
                public.current_user_role() = 'supervisor'
                AND NOT EXISTS (
                    SELECT 1 FROM public.daily_attendance_closures c
                    WHERE c.farm_id = attendances.farm_id
                      AND c.closure_date = attendances.attendance_date
                      AND c.is_locked = true
                )
            )
        )
    );

CREATE POLICY "closures_read_farm" ON public.daily_attendance_closures
    FOR SELECT TO authenticated
    USING (farm_id = public.current_user_farm_id());

CREATE POLICY "closures_lock_owner_supervisor" ON public.daily_attendance_closures
    FOR INSERT TO authenticated
    WITH CHECK (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'supervisor')
    );

CREATE POLICY "closures_unlock_owner_only" ON public.daily_attendance_closures
    FOR UPDATE TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() = 'owner'
    );

-- POLITIQUES RLS : ADVANCES (Réservé Owner)
CREATE POLICY "advances_read" ON public.advances
    FOR SELECT TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'cashier')
    );

CREATE POLICY "advances_write_owner" ON public.advances
    FOR ALL TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() = 'owner'
    );

-- POLITIQUES RLS : PAYROLLS & PAYSLIPS
CREATE POLICY "payroll_periods_read" ON public.payroll_periods
    FOR SELECT TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'cashier')
    );

CREATE POLICY "payroll_periods_write_owner" ON public.payroll_periods
    FOR ALL TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() = 'owner'
    );

CREATE POLICY "payslips_read" ON public.payslips
    FOR SELECT TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'cashier')
    );

CREATE POLICY "payslips_write_owner" ON public.payslips
    FOR ALL TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() = 'owner'
    );

-- POLITIQUES RLS : PAYMENTS (Owner + Cashier)
CREATE POLICY "payments_read" ON public.payments
    FOR SELECT TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'cashier')
    );

CREATE POLICY "payments_write_owner_cashier" ON public.payments
    FOR ALL TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() IN ('owner', 'cashier')
    );

-- POLITIQUES RLS : AUDIT LOGS (Lecture seule pour l'Owner, Insertion système)
CREATE POLICY "audit_read_owner" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        farm_id = public.current_user_farm_id()
        AND public.current_user_role() = 'owner'
    );

CREATE POLICY "audit_insert_all_members" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (farm_id = public.current_user_farm_id());

-- ==============================================================================
-- 4. DONNÉES INITIALES (SEED DE DÉMARRAGE)
-- ==============================================================================

DO $$
DECLARE
    v_farm_id UUID;
    v_team_maraichage UUID;
    v_team_vergers UUID;
    v_team_elevage UUID;
    v_domain_maraichage UUID;
    v_domain_vergers UUID;
    v_domain_grandes_cultures UUID;
    v_domain_elevage UUID;
BEGIN
    -- 1. Création de la ferme par défaut
    INSERT INTO public.farms (
        id, name, legal_form, registration_number, manager_name,
        country, region, address, phone, email, currency,
        standard_daily_rate, payroll_cycle
    ) VALUES (
        'a0000000-0000-0000-0000-000000000001',
        'TERANGA FARMER SERVICE',
        'Société Civile Agricole (SCA)',
        'SN-DKR-2024-B-8912',
        'El Hadj Diallo',
        'Sénégal',
        'Thiès / Niayes',
        'Route Nationale 2, Km 45',
        '+221 77 452 10 99',
        'direction@domaineniayes.sn',
        'XOF',
        2500,
        'quinzaine'
    ) ON CONFLICT (id) DO NOTHING;

    v_farm_id := 'a0000000-0000-0000-0000-000000000001';

    -- 2. Domaines agricoles
    INSERT INTO public.farm_domains (id, farm_id, name, code, description, surface_area, color_badge) VALUES
    ('b0000000-0000-0000-0000-000000000001', v_farm_id, 'Maraîchage', 'MAR', 'Tomates, oignons, piments, aubergines', '12 ha', '#15803D'),
    ('b0000000-0000-0000-0000-000000000002', v_farm_id, 'Vergers & Manguiers', 'VER', 'Mangues Kent, agrumes et papayes', '25 ha', '#C25E34'),
    ('b0000000-0000-0000-0000-000000000003', v_farm_id, 'Grandes Cultures', 'GC', 'Maïs doux, manioc et niébé', '18 ha', '#D97706'),
    ('b0000000-0000-0000-0000-000000000004', v_farm_id, 'Élevage & Fourrage', 'ELV', 'Bovins, ovins et parcelles luzerne', '10 ha', '#2563EB')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Équipes terrain
    INSERT INTO public.teams (id, farm_id, name) VALUES
    ('c0000000-0000-0000-0000-000000000001', v_farm_id, 'Équipe Nord — Maraîchage'),
    ('c0000000-0000-0000-0000-000000000002', v_farm_id, 'Équipe Verger & Récolte'),
    ('c0000000-0000-0000-0000-000000000003', v_farm_id, 'Équipe Serres & Pépinière')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Activités & Barèmes
    INSERT INTO public.activities (farm_id, name, domain_name, is_piece_rate, unit_name, default_unit_rate) VALUES
    (v_farm_id, 'Désherbage manuel', 'Maraîchage', false, 'Jour', 2500),
    (v_farm_id, 'Récolte Tomates (au casier)', 'Maraîchage', true, 'Caisse 20kg', 350),
    (v_farm_id, 'Arrosage & Goutte-à-goutte', 'Maraîchage', false, 'Jour', 2500),
    (v_farm_id, 'Cueillette Mangues Kent', 'Vergers & Manguiers', true, 'Caisse', 400),
    (v_farm_id, 'Taille et élagage', 'Vergers & Manguiers', false, 'Jour', 3000),
    (v_farm_id, 'Semis et repiquage', 'Pépinière', false, 'Jour', 2500),
    (v_farm_id, 'Traitement phytosanitaire', 'Général', false, 'Jour', 3500);

    -- 5. Journaliers agricoles de démonstration
    INSERT INTO public.workers (
        farm_id, first_name, last_name, phone, team_id,
        function_title, domain, momo_operator, momo_number,
        daily_rate, status, unpaid_advances
    ) VALUES
    (v_farm_id, 'Moussa', 'Diop', '+221 77 123 45 67', 'c0000000-0000-0000-0000-000000000001', 'Désherbeur', 'Maraîchage', 'wave', '+221 77 123 45 67', 2500, 'active', 5000),
    (v_farm_id, 'Fatou', 'Ndiaye', '+221 78 234 56 78', 'c0000000-0000-0000-0000-000000000001', 'Récolteuse', 'Maraîchage', 'orange_money', '+221 78 234 56 78', 2500, 'active', 0),
    (v_farm_id, 'Amis', 'Sow', '+221 76 345 67 89', 'c0000000-0000-0000-0000-000000000002', 'Cueilleur', 'Vergers & Manguiers', 'wave', '+221 76 345 67 89', 2500, 'active', 10000),
    (v_farm_id, 'Ibrahima', 'Diallo', '+221 70 456 78 90', 'c0000000-0000-0000-0000-000000000002', 'Élagueur', 'Vergers & Manguiers', 'cash', '', 3000, 'active', 0),
    (v_farm_id, 'Awa', 'Fall', '+221 77 567 89 01', 'c0000000-0000-0000-0000-000000000003', 'Pépiniériste', 'Maraîchage', 'wave', '+221 77 567 89 01', 2500, 'active', 0);
END $$;
