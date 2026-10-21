-- ============================================================================
-- SERFIG 2027 — SCRIPT SQL COMPLET SUPABASE (PHASE 1 + PHASE 2)
-- Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI)
-- Secrétariat Régional du Gôh — Gagnoa
-- ============================================================================
-- Ce script configure l'intégralité de la base de données :
-- 1. Extensions et types ENUM
-- 2. Tables principales (participants, sub_committees, dormitories, seminar_config,
--    payments, attendance, donations)
-- 3. Tables Phase 2 (admin_roles, activity_logs, schedule, medical_visits)
-- 4. Triggers d'intégrité (matricule automatique, calcul automatique des totaux)
-- 5. Fonctions RPC sécurisées (am_i_admin, get_my_admin_role, admin_record_cash_payment,
--    admin_scan_attendance, admin_batch_sync_attendance, admin_log_activity)
-- 6. Politiques de Sécurité Row Level Security (RLS)
-- 7. Données initiales (9 sous-comités du Gôh, dortoirs, réglages, planning, rôles)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES PRINCIPALES

-- 2.1 Table des Sous-Comités
CREATE TABLE IF NOT EXISTS public.sub_committees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  registration_fee integer NOT NULL DEFAULT 2000,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 1,
  contact_person text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 Table de Configuration Générale (clé-valeur JSONB)
CREATE TABLE IF NOT EXISTS public.seminar_config (
  config_key text PRIMARY KEY,
  config_value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 Table des Dortoirs / Hébergements
CREATE TABLE IF NOT EXISTS public.dormitories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 20 CHECK (capacity > 0),
  gender text NOT NULL CHECK (gender IN ('homme', 'femme')),
  location_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.4 Séquence et fonction pour matricule automatique (ex: SRGOH-SEM-001)
CREATE SEQUENCE IF NOT EXISTS public.seq_participant_matricule START 1;

-- 2.5 Table des Participants
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule text UNIQUE,
  receipt_number text UNIQUE,
  participant_type text NOT NULL CHECK (participant_type IN ('seminariste', 'formateur', 'commission')),
  full_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('homme', 'femme')),
  phone text NOT NULL,
  whatsapp text NOT NULL,
  email text,
  sub_committee text NOT NULL,
  school_level text,
  school_name text,
  birth_date date,
  parent_name text,
  parent_contact text,
  has_medical_condition boolean NOT NULL DEFAULT false,
  medical_details text,
  dormitory text REFERENCES public.dormitories(name) ON UPDATE CASCADE ON DELETE SET NULL,
  transport_mode text,
  photo_path text,
  clothing_type text NOT NULL DEFAULT 'aucun' CHECK (clothing_type IN ('aucun', 'polo', 'tshirt')),
  has_polo boolean NOT NULL DEFAULT false,
  polo_size text CHECK (polo_size IN ('S', 'M', 'L', 'XL', 'XXL', '3XL', NULL)),
  polo_color text CHECK (polo_color IN ('Blanc', 'Noir', 'Orange', 'Vert', NULL)),
  clothing_fee integer NOT NULL DEFAULT 0,
  registration_fee integer NOT NULL DEFAULT 0,
  polo_fee integer NOT NULL DEFAULT 0,
  total_fee integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'en_attente' CHECK (payment_status IN ('paye', 'en_attente', 'gratuit')),
  payment_method text,
  payment_reference text,
  checked_in boolean NOT NULL DEFAULT false,
  checked_in_at timestamptz,
  course_attendance jsonb DEFAULT '{"validated": false}'::jsonb,
  meal_attendance jsonb DEFAULT '{"breakfast": false, "lunch": false, "dinner": false}'::jsonb,
  trainer_subtype text CHECK (trainer_subtype IN ('formateur', 'aine', NULL)),
  teaching_subject text,
  trainer_bio text,
  trainer_title text,
  availability text,
  commission text,
  commission_role text,
  commission_experience text,
  wave_phone_number text,
  notes text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger pour générer matricule & reçu et calculer le total_fee avant insertion/mise à jour
CREATE OR REPLACE FUNCTION public.fn_before_participant_upsert()
RETURNS TRIGGER AS $$
DECLARE
  v_seq integer;
  v_prefix text;
BEGIN
  -- 1. Calcul automatique des frais totaux
  IF NEW.participant_type = 'formateur' THEN
    NEW.registration_fee := 0;
    NEW.payment_status := 'gratuit';
  END IF;

  IF NEW.has_polo THEN
    IF NEW.polo_fee = 0 THEN
      NEW.polo_fee := 2500;
    END IF;
    NEW.clothing_type := 'polo';
  ELSE
    NEW.polo_fee := 0;
    NEW.clothing_type := 'aucun';
  END IF;

  NEW.total_fee := COALESCE(NEW.registration_fee, 0) + COALESCE(NEW.polo_fee, 0);

  -- 2. Génération automatique du matricule si absent
  IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
    v_seq := nextval('public.seq_participant_matricule');
    v_prefix := CASE 
      WHEN NEW.participant_type = 'formateur' THEN 'FORM'
      WHEN NEW.participant_type = 'commission' THEN 'COMM'
      ELSE 'SEM'
    END;
    NEW.matricule := 'SRGOH-' || v_prefix || '-' || LPAD(v_seq::text, 4, '0');
  END IF;

  -- 3. Génération du numéro de reçu si absent
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := 'RECU-' || TO_CHAR(now(), 'YYMM') || '-' || SUBSTRING(MD5(NEW.id::text || clock_timestamp()::text) FROM 1 FOR 6);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_before_participant_upsert ON public.participants;
CREATE TRIGGER trg_before_participant_upsert
BEFORE INSERT OR UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.fn_before_participant_upsert();

-- 2.6 Table des Dons
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_name text NOT NULL,
  donor_phone text,
  amount integer NOT NULL CHECK (amount > 0),
  purpose text DEFAULT 'Soutien aux séminaristes SERFIG 2027',
  payment_status text NOT NULL DEFAULT 'en_attente' CHECK (payment_status IN ('en_attente', 'succeeded', 'failed')),
  payment_method text DEFAULT 'Wave',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.7 Table des Paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES public.donations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
  client_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.8 Table de Pointage / Présence
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  session_key text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_participant_session UNIQUE (participant_id, session_key)
);

-- ============================================================================
-- 3. TABLES DE LA PHASE 2
-- ============================================================================

-- 3.1 Table des Rôles Administrateurs (RBAC Phase 2)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'finance', 'organisateur', 'sante')),
  full_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Table du Journal d'Activité / Audit Log (Phase 2)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email text NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 Table du Programme Dynamique du Séminaire (Phase 2)
CREATE TABLE IF NOT EXISTS public.schedule (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_number integer NOT NULL,
  day_name text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('priere', 'cours', 'repas', 'atelier', 'conference', 'sport', 'ceremonie')),
  speaker text,
  location text,
  description text,
  sort_order integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.4 Table du Registre Médical / Soins & Infirmerie (Phase 2)
CREATE TABLE IF NOT EXISTS public.medical_visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  diagnosis text,
  treatment text,
  doctor_notes text,
  emergency_contacted boolean NOT NULL DEFAULT false,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. FONCTIONS RPC SÉCURISÉES (SECURITY DEFINER)
-- ============================================================================

-- 4.1 am_i_admin() : vérifie si l'utilisateur connecté est administrateur
CREATE OR REPLACE FUNCTION public.am_i_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
  IF v_email = '' THEN
    RETURN false;
  END IF;

  -- Liste d'administrateurs racines officiels
  IF v_email IN ('aeemcisrgoh@gmail.com', 'djatraore455@gmail.com') THEN
    RETURN true;
  END IF;

  -- Vérification dans admin_roles
  IF EXISTS (SELECT 1 FROM public.admin_roles WHERE LOWER(TRIM(user_email)) = v_email AND is_active = true) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 4.2 get_my_admin_role() : renvoie le rôle ('super_admin', 'finance', 'organisateur', 'sante')
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_role text;
BEGIN
  v_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
  IF v_email IN ('aeemcisrgoh@gmail.com', 'djatraore455@gmail.com') THEN
    RETURN 'super_admin';
  END IF;

  SELECT role INTO v_role FROM public.admin_roles WHERE LOWER(TRIM(user_email)) = v_email AND is_active = true LIMIT 1;
  IF v_role IS NOT NULL THEN
    RETURN v_role;
  END IF;

  RETURN 'none';
END;
$$;

-- 4.3 admin_record_cash_payment : enregistrement sécurisé d'un paiement en espèces
CREATE OR REPLACE FUNCTION public.admin_record_cash_payment(
  p_participant_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email text;
  v_participant public.participants%ROWTYPE;
  v_payment_id uuid;
BEGIN
  IF NOT public.am_i_admin() THEN
    RAISE EXCEPTION 'Accès refusé : privilèges administrateur requis';
  END IF;

  v_user_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', 'admin')));

  SELECT * INTO v_participant FROM public.participants WHERE id = p_participant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant introuvable (id: %)', p_participant_id;
  END IF;

  IF v_participant.payment_status = 'paye' THEN
    RAISE EXCEPTION 'Ce participant a déjà un statut payé.';
  END IF;

  -- 1. Insérer dans payments
  INSERT INTO public.payments (
    participant_id,
    provider,
    amount,
    status,
    client_reference,
    notes
  ) VALUES (
    v_participant.id,
    'Espèces',
    v_participant.total_fee,
    'succeeded',
    'CASH-' || TO_CHAR(now(), 'YYMMDD-HH24MISS'),
    COALESCE(p_note, 'Paiement en espèces validé par ' || v_user_email)
  ) RETURNING id INTO v_payment_id;

  -- 2. Mettre à jour participant
  UPDATE public.participants
  SET payment_status = 'paye',
      payment_method = 'Espèces',
      payment_reference = 'CASH-' || TO_CHAR(now(), 'YYMMDD-HH24MISS'),
      updated_at = now()
  WHERE id = v_participant.id;

  -- 3. Logger dans activity_logs
  INSERT INTO public.activity_logs (
    user_email,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_email,
    'CASH_PAYMENT',
    'participant',
    v_participant.id::text,
    jsonb_build_object(
      'amount', v_participant.total_fee,
      'matricule', v_participant.matricule,
      'full_name', v_participant.full_name,
      'note', p_note
    )
  );

  RETURN jsonb_build_object(
    'status', 'ok',
    'payment_id', v_payment_id,
    'participant_id', v_participant.id,
    'amount', v_participant.total_fee,
    'matricule', v_participant.matricule
  );
END;
$$;

-- 4.4 admin_scan_attendance : pointage / check-in par matricule
CREATE OR REPLACE FUNCTION public.admin_scan_attendance(
  p_matricule text,
  p_session_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant public.participants%ROWTYPE;
  v_user_email text;
  v_existing_at timestamptz;
BEGIN
  IF NOT public.am_i_admin() THEN
    RAISE EXCEPTION 'Accès refusé : privilèges administrateur requis';
  END IF;

  v_user_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', 'admin')));

  -- Recherche du participant par matricule
  SELECT * INTO v_participant FROM public.participants 
  WHERE LOWER(TRIM(matricule)) = LOWER(TRIM(p_matricule)) LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'not_found',
      'message', 'Matricule ' || p_matricule || ' introuvable'
    );
  END IF;

  -- Vérification du statut de paiement
  IF v_participant.payment_status NOT IN ('paye', 'gratuit') THEN
    RETURN jsonb_build_object(
      'status', 'unpaid',
      'message', 'Inscription non payée, orienter vers la commission Finance',
      'participant', jsonb_build_object(
        'id', v_participant.id,
        'matricule', v_participant.matricule,
        'full_name', v_participant.full_name,
        'sub_committee', v_participant.sub_committee,
        'total_fee', v_participant.total_fee
      )
    );
  END IF;

  -- Vérification doublon
  SELECT scanned_at INTO v_existing_at 
  FROM public.attendance 
  WHERE participant_id = v_participant.id AND session_key = p_session_key LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'status', 'already',
      'message', 'Déjà validé pour cette session',
      'scanned_at', v_existing_at,
      'participant', jsonb_build_object(
        'id', v_participant.id,
        'matricule', v_participant.matricule,
        'full_name', v_participant.full_name,
        'sub_committee', v_participant.sub_committee
      )
    );
  END IF;

  -- Enregistrement du pointage
  INSERT INTO public.attendance (participant_id, session_key, scanned_at)
  VALUES (v_participant.id, p_session_key, now());

  -- Si session d'arrivée, marquer checked_in = true
  IF p_session_key = 'arrivee' AND NOT v_participant.checked_in THEN
    UPDATE public.participants 
    SET checked_in = true, checked_in_at = now(), updated_at = now()
    WHERE id = v_participant.id;
  END IF;

  -- Audit log
  INSERT INTO public.activity_logs (
    user_email,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_user_email,
    'ATTENDANCE_SCAN',
    'participant',
    v_participant.id::text,
    jsonb_build_object(
      'matricule', v_participant.matricule,
      'session_key', p_session_key
    )
  );

  RETURN jsonb_build_object(
    'status', 'ok',
    'message', 'Validé avec succès',
    'scanned_at', now(),
    'session_key', p_session_key,
    'participant', jsonb_build_object(
      'id', v_participant.id,
      'matricule', v_participant.matricule,
      'full_name', v_participant.full_name,
      'participant_type', v_participant.participant_type,
      'sub_committee', v_participant.sub_committee,
      'photo_path', v_participant.photo_path
    )
  );
END;
$$;

-- 4.5 admin_batch_sync_attendance : synchronisation de pointages hors-ligne (Phase 2)
CREATE OR REPLACE FUNCTION public.admin_batch_sync_attendance(
  p_scans jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_elem jsonb;
  v_matricule text;
  v_session_key text;
  v_timestamp timestamptz;
  v_participant_id uuid;
  v_success_count integer := 0;
  v_already_count integer := 0;
  v_failed_count integer := 0;
BEGIN
  IF NOT public.am_i_admin() THEN
    RAISE EXCEPTION 'Accès refusé : privilèges administrateur requis';
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(p_scans)
  LOOP
    v_matricule := v_elem ->> 'matricule';
    v_session_key := v_elem ->> 'session_key';
    v_timestamp := COALESCE((v_elem ->> 'timestamp')::timestamptz, now());

    SELECT id INTO v_participant_id FROM public.participants 
    WHERE LOWER(TRIM(matricule)) = LOWER(TRIM(v_matricule)) LIMIT 1;

    IF v_participant_id IS NOT NULL THEN
      BEGIN
        INSERT INTO public.attendance (participant_id, session_key, scanned_at)
        VALUES (v_participant_id, v_session_key, v_timestamp);
        v_success_count := v_success_count + 1;
      EXCEPTION WHEN unique_violation THEN
        v_already_count := v_already_count + 1;
      END;
    ELSE
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'total', jsonb_array_length(p_scans),
    'succeeded', v_success_count,
    'already', v_already_count,
    'failed', v_failed_count
  );
END;
$$;

-- 4.6 admin_log_activity : journalisation générique d'audit (Phase 2)
CREATE OR REPLACE FUNCTION public.admin_log_activity(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  v_email := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', 'admin')));
  INSERT INTO public.activity_logs (
    user_email,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_email,
    p_action,
    p_entity_type,
    p_entity_id,
    p_details
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.sub_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seminar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_visits ENABLE ROW LEVEL SECURITY;

-- 5.1 sub_committees : lecture publique des sous-comités actifs
DROP POLICY IF EXISTS "sub_committees_public_read" ON public.sub_committees;
CREATE POLICY "sub_committees_public_read" ON public.sub_committees
FOR SELECT USING (true);

DROP POLICY IF EXISTS "sub_committees_admin_all" ON public.sub_committees;
CREATE POLICY "sub_committees_admin_all" ON public.sub_committees
FOR ALL USING (public.am_i_admin());

-- 5.2 seminar_config : lecture publique des configs is_public = true, admin total
DROP POLICY IF EXISTS "seminar_config_public_read" ON public.seminar_config;
CREATE POLICY "seminar_config_public_read" ON public.seminar_config
FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "seminar_config_admin_all" ON public.seminar_config;
CREATE POLICY "seminar_config_admin_all" ON public.seminar_config
FOR ALL USING (public.am_i_admin());

-- 5.3 dormitories : admins uniquement
DROP POLICY IF EXISTS "dormitories_admin_all" ON public.dormitories;
CREATE POLICY "dormitories_admin_all" ON public.dormitories
FOR ALL USING (public.am_i_admin());

-- 5.4 participants : insertion publique (inscriptions), admins lecture et màj
DROP POLICY IF EXISTS "participants_public_insert" ON public.participants;
CREATE POLICY "participants_public_insert" ON public.participants
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "participants_public_self_read" ON public.participants;
CREATE POLICY "participants_public_self_read" ON public.participants
FOR SELECT USING (true);

DROP POLICY IF EXISTS "participants_admin_all" ON public.participants;
CREATE POLICY "participants_admin_all" ON public.participants
FOR ALL USING (public.am_i_admin());

-- 5.5 payments : admin lecture seule (écritures via RPC)
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
CREATE POLICY "payments_admin_select" ON public.payments
FOR SELECT USING (public.am_i_admin());

-- 5.6 attendance : admins
DROP POLICY IF EXISTS "attendance_admin_all" ON public.attendance;
CREATE POLICY "attendance_admin_all" ON public.attendance
FOR ALL USING (public.am_i_admin());

-- 5.7 donations : public insert, admin all
DROP POLICY IF EXISTS "donations_public_insert" ON public.donations;
CREATE POLICY "donations_public_insert" ON public.donations
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "donations_admin_all" ON public.donations;
CREATE POLICY "donations_admin_all" ON public.donations
FOR ALL USING (public.am_i_admin());

-- 5.8 admin_roles : super_admin all, lecture par admin
DROP POLICY IF EXISTS "admin_roles_admin_read" ON public.admin_roles;
CREATE POLICY "admin_roles_admin_read" ON public.admin_roles
FOR SELECT USING (public.am_i_admin());

DROP POLICY IF EXISTS "admin_roles_super_admin_all" ON public.admin_roles;
CREATE POLICY "admin_roles_super_admin_all" ON public.admin_roles
FOR ALL USING (public.get_my_admin_role() = 'super_admin');

-- 5.9 activity_logs : admin lecture, insert via RPC ou admin
DROP POLICY IF EXISTS "activity_logs_admin_all" ON public.activity_logs;
CREATE POLICY "activity_logs_admin_all" ON public.activity_logs
FOR ALL USING (public.am_i_admin());

-- 5.10 schedule : lecture publique, écriture admin
DROP POLICY IF EXISTS "schedule_public_read" ON public.schedule;
CREATE POLICY "schedule_public_read" ON public.schedule
FOR SELECT USING (true);

DROP POLICY IF EXISTS "schedule_admin_all" ON public.schedule;
CREATE POLICY "schedule_admin_all" ON public.schedule
FOR ALL USING (public.am_i_admin());

-- 5.11 medical_visits : admins Santé & Super Admin
DROP POLICY IF EXISTS "medical_visits_admin_all" ON public.medical_visits;
CREATE POLICY "medical_visits_admin_all" ON public.medical_visits
FOR ALL USING (public.am_i_admin());

-- ============================================================================
-- 6. DONNÉES INITIALES (SEED DATA)
-- ============================================================================

-- 6.1 Les 9 Sous-Comités de la Région du Gôh (SERFIG 2027)
INSERT INTO public.sub_committees (name, registration_fee, is_active, sort_order, contact_person, contact_phone)
VALUES
  ('Sous-Comité Gagnoa', 2000, true, 1, 'Oustaz Traoré', '(+225) 0788609677'),
  ('Sous-Comité Guibéroua', 2000, true, 2, 'Frère Cissé', '(+225) 0141273083'),
  ('Sous-Comité Oumé', 2000, true, 3, 'Frère Coulibaly', '(+225) 0574613512'),
  ('Sous-Comité Bayota', 2000, true, 4, 'Frère Sylla', '(+225) 0700000004'),
  ('Sous-Comité Diégonéfla', 2000, true, 5, 'Frère Bamba', '(+225) 0700000005'),
  ('Sous-Comité Ouragahio', 2000, true, 6, 'Frère Touré', '(+225) 0700000006'),
  ('Sous-Comité Tonla', 2000, true, 7, 'Frère Koné', '(+225) 0700000007'),
  ('Sous-Comité Lahouda', 2000, true, 8, 'Frère Diaby', '(+225) 0700000008'),
  ('Extérieur & Autres Régions', 2000, true, 9, 'Secrétariat Régional', '(+225) 0788609677')
ON CONFLICT (name) DO UPDATE 
SET registration_fee = EXCLUDED.registration_fee,
    sort_order = EXCLUDED.sort_order;

-- 6.2 Configurations initiales SERFIG 2027
INSERT INTO public.seminar_config (config_key, config_value, is_public)
VALUES
  ('registration', '{"open": true, "deadline": "2027-04-16"}'::jsonb, true),
  ('capacity', '{"max": 450}'::jsonb, true),
  ('pricing', '{"polo": 2500, "tshirt": 2000, "commission": 2000, "formateur": 0}'::jsonb, true),
  ('identity', '{"acronym": "SERFIG", "edition": "2027", "venue": "Lycée Moderne 1 & 2 de Gagnoa", "region": "Gôh"}'::jsonb, true)
ON CONFLICT (config_key) DO UPDATE
SET config_value = EXCLUDED.config_value;

-- 6.3 Dortoirs initiaux (Lycée Moderne de Gagnoa)
INSERT INTO public.dormitories (name, capacity, gender, location_notes)
VALUES
  ('Dortoir A1 - Frères', 30, 'homme', 'Bâtiment Principal, RDC'),
  ('Dortoir A2 - Frères', 35, 'homme', 'Bâtiment Principal, 1er Étage'),
  ('Dortoir A3 - Frères', 35, 'homme', 'Bâtiment Principal, 2ème Étage'),
  ('Dortoir B1 - Sœurs', 25, 'femme', 'Bâtiment Annexe Est, RDC'),
  ('Dortoir B2 - Sœurs', 30, 'femme', 'Bâtiment Annexe Est, 1er Étage'),
  ('Dortoir C1 - Encadrement Frères', 15, 'homme', 'Pavillon Enseignants'),
  ('Dortoir C2 - Encadrement Sœurs', 15, 'femme', 'Pavillon Enseignantes')
ON CONFLICT (name) DO NOTHING;

-- 6.4 Administrateurs initiaux avec rôles RBAC (Phase 2)
INSERT INTO public.admin_roles (user_email, role, full_name)
VALUES
  ('aeemcisrgoh@gmail.com', 'super_admin', 'Secrétariat Régional AEEMCI Gôh'),
  ('djatraore455@gmail.com', 'super_admin', 'Coordinateur Général SERFIG 2027')
ON CONFLICT (user_email) DO UPDATE
SET role = EXCLUDED.role;

-- 6.5 Programme initial SERFIG 2027 (Du 17 au 22 Avril 2027)
INSERT INTO public.schedule (day_number, day_name, date, time, title, category, speaker, location, sort_order)
VALUES
  (1, 'Samedi 17 Avril 2027', '2027-04-17', '08:00 - 12:00', 'Accueil des séminaristes & Installation dans les dortoirs', 'ceremonie', 'Commission Accueil', 'Cour d''Honneur', 1),
  (1, 'Samedi 17 Avril 2027', '2027-04-17', '12:30 - 14:00', 'Prière de Zuhr & Déjeuner fraternel', 'repas', 'Commission Restauration', 'Réfectoire', 2),
  (1, 'Samedi 17 Avril 2027', '2027-04-17', '16:00 - 18:00', 'Cérémonie solennelle d''Ouverture du SERFIG 2027', 'ceremonie', 'Secrétaire Régional', 'Grande Salle Polyvalente', 3),
  (2, 'Dimanche 18 Avril 2027', '2027-04-18', '08:30 - 10:30', 'Cours 1 : Les fondements de la foi musulmane (Aqeedah)', 'cours', 'Oustaz Bamba', 'Salle A1', 1),
  (2, 'Dimanche 18 Avril 2027', '2027-04-18', '10:45 - 12:30', 'Atelier pratique : Purification rituelle et prière prophétique', 'atelier', 'Commission Pédagogie', 'Mosquée du Séminaire', 2),
  (2, 'Dimanche 18 Avril 2027', '2027-04-18', '15:30 - 17:30', 'Grande Conférence Thématique : Jeunesse et leadership vertueux', 'conference', 'Invité d''honneur', 'Salle Polyvalente', 3),
  (3, 'Lundi 19 Avril 2027', '2027-04-19', '08:30 - 10:30', 'Cours 2 : Éthique et comportement de l''élève musulman', 'cours', 'Oustaz Koné', 'Salle A1', 1),
  (4, 'Mardi 20 Avril 2027', '2027-04-20', '16:00 - 18:00', 'Tournoi de Fraternité & Activités sportives saines', 'sport', 'Commission Sport & Loisirs', 'Terrain de Sport', 1),
  (5, 'Mercredi 21 Avril 2027', '2027-04-21', '20:30 - 23:00', 'Grande Nuit spirituelle & Remise des Prix de mémorisation', 'ceremonie', 'Jury du Concours', 'Grande Salle', 1),
  (6, 'Jeudi 22 Avril 2027', '2027-04-22', '09:00 - 12:00', 'Cérémonie de Clôture, Remise des Attestations & Départs', 'ceremonie', 'Comité d''Organisation', 'Cour d''Honneur', 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FIN DU SCRIPT SQL OFFICIEL SERFIG 2027
-- ============================================================================
