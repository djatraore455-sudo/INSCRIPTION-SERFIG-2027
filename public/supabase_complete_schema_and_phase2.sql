-- ==============================================================================
-- SERFIG 2027 • SCRIPT COMPLET SUPABASE SQL (PHASE 1 + PHASE 2)
-- Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI Gôh)
-- ==============================================================================
-- Script 100% idempotent avec migrations automatiques des colonnes existantes.
-- Résout :
--   - Erreur 42703 (column "gender" of relation "dormitories" does not exist)
--   - Erreur 42P13 (cannot change return type of existing function)
--   - Erreur 42710 (policy already exists)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES DE CONFIGURATION & RÉFÉRENTIELS
CREATE TABLE IF NOT EXISTS seminar_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value JSONB NOT NULL,
    is_public BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE seminar_config ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE seminar_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS sub_committees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    registration_fee INTEGER NOT NULL DEFAULT 2000,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 1,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sub_committees ADD COLUMN IF NOT EXISTS registration_fee INTEGER DEFAULT 2000;
ALTER TABLE sub_committees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE sub_committees ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;
ALTER TABLE sub_committees ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
ALTER TABLE sub_committees ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

CREATE TABLE IF NOT EXISTS dormitories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 40,
    gender VARCHAR(10) NOT NULL DEFAULT 'homme' CHECK (gender IN ('homme', 'femme')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Migration automatique si dormitories existait déjà sans la colonne gender
ALTER TABLE dormitories ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'homme';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dormitories_gender_check'
    ) THEN
        ALTER TABLE dormitories ADD CONSTRAINT dormitories_gender_check CHECK (gender IN ('homme', 'femme'));
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. TABLE DES PARTICIPANTS
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule VARCHAR(30) UNIQUE NOT NULL,
    receipt_number VARCHAR(50),
    participant_type VARCHAR(20) NOT NULL DEFAULT 'seminariste' CHECK (participant_type IN ('seminariste', 'formateur', 'commission')),
    full_name VARCHAR(150) NOT NULL,
    gender VARCHAR(10) NOT NULL DEFAULT 'homme' CHECK (gender IN ('homme', 'femme')),
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    email VARCHAR(100),
    sub_committee VARCHAR(100) NOT NULL,
    school_level VARCHAR(50),
    school_name VARCHAR(150),
    birth_date DATE,
    parent_name VARCHAR(150),
    parent_contact VARCHAR(50),
    has_medical_condition BOOLEAN DEFAULT false,
    medical_details TEXT,
    dormitory VARCHAR(100),
    transport_mode VARCHAR(50),
    photo_path TEXT,
    photo_url TEXT,
    clothing_type VARCHAR(20) DEFAULT 'aucun' CHECK (clothing_type IN ('aucun', 'polo', 'tshirt')),
    has_polo BOOLEAN DEFAULT false,
    polo_size VARCHAR(10),
    polo_color VARCHAR(30),
    registration_fee INTEGER NOT NULL DEFAULT 2000,
    polo_fee INTEGER NOT NULL DEFAULT 0,
    clothing_fee INTEGER NOT NULL DEFAULT 0,
    total_fee INTEGER NOT NULL DEFAULT 2000,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (payment_status IN ('paye', 'en_attente', 'gratuit')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    checked_in BOOLEAN DEFAULT false,
    checked_in_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Colonnes de sécurité participants si la table existait déjà
ALTER TABLE participants ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS participant_type VARCHAR(20) DEFAULT 'seminariste';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'homme';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS has_medical_condition BOOLEAN DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS medical_details TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS dormitory VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS clothing_type VARCHAR(20) DEFAULT 'aucun';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS has_polo BOOLEAN DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS polo_size VARCHAR(10);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS polo_color VARCHAR(30);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS registration_fee INTEGER DEFAULT 2000;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS polo_fee INTEGER DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS clothing_fee INTEGER DEFAULT 0;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS total_fee INTEGER DEFAULT 2000;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'en_attente';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. TABLE DES PAIEMENTS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    donation_id UUID,
    provider VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    client_reference VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE DES DONS
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name VARCHAR(150) NOT NULL,
    donor_phone VARCHAR(50),
    amount INTEGER NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE D'ÉMARGEMENT & POINTAGE QR (attendance)
CREATE TABLE IF NOT EXISTS attendance (
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    session_key VARCHAR(100) NOT NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scanned_by VARCHAR(100),
    PRIMARY KEY (participant_id, session_key)
);

-- ==============================================================================
-- 7. TABLES DE LA PHASE 2 (RÔLES, AUDIT, SANTÉ, PROGRAMME)
-- ==============================================================================

-- A. RÔLES ADMINISTRATEURS (RBAC)
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('super_admin', 'finance', 'organisateur', 'sante')),
    assigned_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. JOURNAL D'ACTIVITÉ (Audit Log Immuable)
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C. VISITES MÉDICALES & COMMISSION SANTÉ
CREATE TABLE IF NOT EXISTS medical_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT NOT NULL,
    diagnosis TEXT,
    treatment TEXT,
    doctor_notes TEXT,
    emergency_contacted BOOLEAN DEFAULT false,
    created_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. PROGRAMME DU SÉMINAIRE (Agenda interactif)
CREATE TABLE IF NOT EXISTS seminar_schedule (
    id VARCHAR(50) PRIMARY KEY,
    day_date DATE NOT NULL,
    day_title VARCHAR(100) NOT NULL,
    time_start VARCHAR(10) NOT NULL,
    time_end VARCHAR(10) NOT NULL,
    title VARCHAR(200) NOT NULL,
    speaker VARCHAR(150),
    venue VARCHAR(150),
    category VARCHAR(30) NOT NULL CHECK (category IN ('cours', 'repas', 'priere', 'conference', 'atelier', 'ceremonie')),
    session_key VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. NETTOYAGE PRÉVENTIF DES FONCTIONS (Résout l'erreur 42P13 sur return type)
-- ==============================================================================
DROP FUNCTION IF EXISTS am_i_admin() CASCADE;
DROP FUNCTION IF EXISTS admin_record_cash_payment(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS admin_record_cash_payment(uuid) CASCADE;
DROP FUNCTION IF EXISTS admin_scan_attendance(text, text) CASCADE;
DROP FUNCTION IF EXISTS admin_log_activity(text, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS admin_log_activity(text, text, text, json) CASCADE;

-- ==============================================================================
-- 9. CRÉATION DES FONCTIONS RPC SUPABASE SÉCURISÉES
-- ==============================================================================

-- A. Vérification si l'utilisateur connecté est administrateur
CREATE OR REPLACE FUNCTION am_i_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF auth.jwt() ->> 'email' IS NULL THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM admin_roles WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
    ) OR (auth.jwt() ->> 'email') LIKE '%@aeemci%' OR (auth.jwt() ->> 'email') = 'djatraore455@gmail.com' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- B. Enregistrement d'un paiement en espèces (RPC finance)
CREATE OR REPLACE FUNCTION admin_record_cash_payment(
    p_participant_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant RECORD;
    v_payment_id UUID;
BEGIN
    IF NOT am_i_admin() THEN
        RAISE EXCEPTION 'Accès refusé : privilèges administrateur requis.';
    END IF;

    SELECT * INTO v_participant FROM participants WHERE id = p_participant_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Participant introuvable (ID: %)', p_participant_id;
    END IF;

    IF v_participant.payment_status = 'paye' THEN
        RAISE EXCEPTION 'Ce participant a déjà réglé son inscription.';
    END IF;

    -- Création du paiement officiel
    INSERT INTO payments (participant_id, provider, amount, status, client_reference)
    VALUES (
        p_participant_id,
        'Espèces sur place',
        v_participant.total_fee,
        'succeeded',
        COALESCE(p_note, 'Encaissement espèces guichet')
    ) RETURNING id INTO v_payment_id;

    -- Mise à jour du participant
    UPDATE participants
    SET payment_status = 'paye',
        payment_method = 'Espèces sur place',
        payment_reference = 'CASH-' || SUBSTRING(v_payment_id::text, 1, 8)
    WHERE id = p_participant_id;

    -- Journal d'activité (Audit log)
    INSERT INTO admin_activity_logs (user_email, action, entity_type, entity_id, details)
    VALUES (
        COALESCE(auth.jwt() ->> 'email', 'admin'),
        'ENCAISSEMENT_ESPECES',
        'PARTICIPANT',
        v_participant.matricule,
        jsonb_build_object(
            'amount', v_participant.total_fee,
            'fullName', v_participant.full_name,
            'note', p_note
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'matricule', v_participant.matricule,
        'amount', v_participant.total_fee
    );
END;
$$;

-- C. Pointage par scan QR (RPC pointage)
CREATE OR REPLACE FUNCTION admin_scan_attendance(
    p_matricule TEXT,
    p_session_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_participant RECORD;
    v_existing RECORD;
BEGIN
    IF NOT am_i_admin() THEN
        RAISE EXCEPTION 'Accès refusé : privilèges administrateur requis.';
    END IF;

    SELECT * INTO v_participant 
    FROM participants 
    WHERE LOWER(matricule) = LOWER(TRIM(p_matricule));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'status', 'not_found',
            'message', 'Matricule inconnu dans la base de données.'
        );
    END IF;

    -- Séminariste doit avoir réglé son inscription
    IF v_participant.participant_type = 'seminariste' AND v_participant.payment_status = 'en_attente' THEN
        RETURN jsonb_build_object(
            'status', 'unpaid',
            'message', 'Inscription non payée, orienter vers la commission Finance.',
            'participant', jsonb_build_object(
                'id', v_participant.id,
                'matricule', v_participant.matricule,
                'full_name', v_participant.full_name,
                'sub_committee', v_participant.sub_committee,
                'total_fee', v_participant.total_fee
            )
        );
    END IF;

    -- Déjà validé ?
    SELECT * INTO v_existing 
    FROM attendance 
    WHERE participant_id = v_participant.id AND session_key = p_session_key;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'status', 'already',
            'message', 'Déjà validé pour cette session.',
            'scanned_at', v_existing.scanned_at,
            'participant', jsonb_build_object(
                'id', v_participant.id,
                'matricule', v_participant.matricule,
                'full_name', v_participant.full_name,
                'sub_committee', v_participant.sub_committee
            )
        );
    END IF;

    -- Enregistrement du pointage
    INSERT INTO attendance (participant_id, session_key, scanned_at, scanned_by)
    VALUES (v_participant.id, p_session_key, NOW(), auth.jwt() ->> 'email');

    IF p_session_key = 'arrivee' THEN
        UPDATE participants 
        SET checked_in = true, 
            checked_in_at = NOW() 
        WHERE id = v_participant.id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'ok',
        'message', 'Pointage validé avec succès.',
        'scanned_at', NOW(),
        'participant', jsonb_build_object(
            'id', v_participant.id,
            'matricule', v_participant.matricule,
            'full_name', v_participant.full_name,
            'sub_committee', v_participant.sub_committee,
            'dormitory', v_participant.dormitory,
            'photo_url', v_participant.photo_url
        )
    );
END;
$$;

-- D. Journalisation d'activité depuis le client
CREATE OR REPLACE FUNCTION admin_log_activity(
    p_action TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO admin_activity_logs (user_email, action, entity_type, entity_id, details)
    VALUES (
        COALESCE(auth.jwt() ->> 'email', 'admin'),
        p_action,
        p_entity_type,
        p_entity_id,
        p_details
    );
END;
$$;

-- ==============================================================================
-- 10. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ==============================================================================
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seminar_schedule ENABLE ROW LEVEL SECURITY;

-- Nettoyage préventif des politiques existantes
DROP POLICY IF EXISTS "Public read seminar_config" ON seminar_config;
DROP POLICY IF EXISTS "Public read sub_committees" ON sub_committees;
DROP POLICY IF EXISTS "Public read dormitories" ON dormitories;
DROP POLICY IF EXISTS "Public read seminar_schedule" ON seminar_schedule;
DROP POLICY IF EXISTS "Public insert participants" ON participants;
DROP POLICY IF EXISTS "Public read participants" ON participants;

DROP POLICY IF EXISTS "Admin full participants" ON participants;
DROP POLICY IF EXISTS "Admin full payments" ON payments;
DROP POLICY IF EXISTS "Admin full attendance" ON attendance;
DROP POLICY IF EXISTS "Admin full dormitories" ON dormitories;
DROP POLICY IF EXISTS "Admin full sub_committees" ON sub_committees;
DROP POLICY IF EXISTS "Admin full config" ON seminar_config;
DROP POLICY IF EXISTS "Admin full donations" ON donations;
DROP POLICY IF EXISTS "Admin full activity" ON admin_activity_logs;
DROP POLICY IF EXISTS "Admin full medical" ON medical_visits;
DROP POLICY IF EXISTS "Admin full schedule" ON seminar_schedule;
DROP POLICY IF EXISTS "Admin full roles" ON admin_roles;

-- Politiques publiques
CREATE POLICY "Public read seminar_config" ON seminar_config FOR SELECT USING (is_public = true OR am_i_admin());
CREATE POLICY "Public read sub_committees" ON sub_committees FOR SELECT USING (true);
CREATE POLICY "Public read dormitories" ON dormitories FOR SELECT USING (true);
CREATE POLICY "Public read seminar_schedule" ON seminar_schedule FOR SELECT USING (true);
CREATE POLICY "Public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);

-- Politiques administrateurs
CREATE POLICY "Admin full participants" ON participants FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full payments" ON payments FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full attendance" ON attendance FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full dormitories" ON dormitories FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full sub_committees" ON sub_committees FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full config" ON seminar_config FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full donations" ON donations FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full activity" ON admin_activity_logs FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full medical" ON medical_visits FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full schedule" ON seminar_schedule FOR ALL USING (am_i_admin());
CREATE POLICY "Admin full roles" ON admin_roles FOR ALL USING (am_i_admin());

-- ==============================================================================
-- 11. DONNÉES INITIALES HOMOLOGUÉES (SERFIG 2027)
-- ==============================================================================

-- Configuration principale
INSERT INTO seminar_config (config_key, config_value, is_public)
VALUES
  ('registration', '{"open": true, "deadline": "2027-04-15"}', true),
  ('capacity', '{"max": 500}', true),
  ('pricing', '{"polo": 2500, "tshirt": 2000, "commission": 5000, "formateur": 0}', true)
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value;

-- Les 8 sous-comités officiels de la Région du Gôh
INSERT INTO sub_committees (name, registration_fee, sort_order)
VALUES 
  ('Sous-Comité Gagnoa', 2000, 1),
  ('Sous-Comité Guibéroua', 2000, 2),
  ('Sous-Comité Ouragahio', 2000, 3),
  ('Sous-Comité Oumé', 2000, 4),
  ('Sous-Comité Diégonéfla', 2000, 5),
  ('Sous-Comité Bayota', 2000, 6),
  ('Sous-Comité Gnagbodougnoa', 2000, 7),
  ('Sous-Comité Dougroupalégnoa', 2000, 8)
ON CONFLICT (name) DO UPDATE 
SET registration_fee = EXCLUDED.registration_fee;

-- Dortoirs initiaux
INSERT INTO dormitories (name, capacity, gender)
VALUES
  ('Dortoir Bilal (Bâtiment A)', 45, 'homme'),
  ('Dortoir Salman Al-Farisi (Bâtiment B)', 50, 'homme'),
  ('Dortoir Abou Bakr (Bâtiment C)', 40, 'homme'),
  ('Dortoir Khadidja (Pavillon 1)', 40, 'femme'),
  ('Dortoir Aïcha (Pavillon 2)', 45, 'femme'),
  ('Dortoir Fatima (Pavillon 3)', 35, 'femme')
ON CONFLICT (name) DO UPDATE
SET capacity = EXCLUDED.capacity,
    gender = EXCLUDED.gender;

-- Rôles administrateurs initiaux
INSERT INTO admin_roles (email, role, assigned_by)
VALUES
  ('djatraore455@gmail.com', 'super_admin', 'system'),
  ('aeemcisrgoh@gmail.com', 'super_admin', 'system')
ON CONFLICT (email) DO NOTHING;

-- Programme officiel initial
INSERT INTO seminar_schedule (id, day_date, day_title, time_start, time_end, title, speaker, venue, category, session_key)
VALUES
  ('s-1', '2027-04-17', 'Samedi 17 Avril 2027', '08:00', '12:00', 'Accueil & Enregistrement des délégations', 'Commission Accueil', 'Portail Principal', 'ceremonie', 'arrivee'),
  ('s-2', '2027-04-17', 'Samedi 17 Avril 2027', '12:30', '14:00', 'Déjeuner de Bienvenue', 'Commission Restauration', 'Réfectoire', 'repas', 'repas:2027-04-17:lunch'),
  ('s-3', '2027-04-17', 'Samedi 17 Avril 2027', '15:30', '17:30', 'Cérémonie Officielle d''Ouverture SERFIG 2027', 'Bureau Exécutif', 'Amphithéâtre', 'ceremonie', 'cours:2027-04-17'),
  ('s-4', '2027-04-18', 'Dimanche 18 Avril 2027', '07:00', '08:00', 'Petit-déjeuner', 'Commission Restauration', 'Réfectoire', 'repas', 'repas:2027-04-18:breakfast'),
  ('s-5', '2027-04-18', 'Dimanche 18 Avril 2027', '08:30', '10:30', 'Cours : Science, Foi et Engagement Citoyen', 'Dr. Oustaz Cissé', 'Salle 1 & 2', 'cours', 'cours:2027-04-18'),
  ('s-6', '2027-04-18', 'Dimanche 18 Avril 2027', '13:00', '14:30', 'Déjeuner', 'Commission Restauration', 'Réfectoire', 'repas', 'repas:2027-04-18:lunch'),
  ('s-7', '2027-04-18', 'Dimanche 18 Avril 2027', '20:00', '21:30', 'Dîner & Causerie fraternelle', 'Encadreurs', 'Cour Centrale', 'repas', 'repas:2027-04-18:dinner')
ON CONFLICT (id) DO NOTHING;
