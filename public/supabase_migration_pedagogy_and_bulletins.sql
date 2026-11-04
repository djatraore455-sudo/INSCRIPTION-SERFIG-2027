-- ==============================================================================
-- SERFIG 2027 • MIGRATION PÉDAGOGIE, TEST D'ENTRÉE, NIVEAUX & BULLETINS DE NOTES
-- AEEMCI - Région du Gôh
-- ==============================================================================
-- Ce script est 100% idempotent. Il peut être exécuté dans le SQL Editor de Supabase
-- sur votre projet (https://prygzytudhecilduypkw.supabase.co) en toute sécurité.
-- ==============================================================================

-- 1. AJOUT DES COLONNES PÉDAGOGIQUES SUR LA TABLE PARTICIPANTS
ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_executive_member BOOLEAN DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS executive_role VARCHAR(100);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS executive_structure VARCHAR(150);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS entry_test_score NUMERIC(4,2);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS entry_test_passed_at TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assigned_level VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assigned_class VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS assigned_room VARCHAR(50);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS grades JSONB;

-- 2. TRIGGER AUTOMATIQUE POSTGRESQL : CALCUL & AFFECTATION DES NIVEAUX
CREATE OR REPLACE FUNCTION trg_auto_assign_pedagogical_level()
RETURNS TRIGGER AS $$
BEGIN
    -- Règle 1: Membre de bureau (Section ou Sous-comité) -> Responsable de Base
    IF NEW.participant_type = 'seminariste' AND (NEW.is_executive_member = true OR (NEW.executive_role IS NOT NULL AND NEW.executive_role <> '')) THEN
        IF NEW.assigned_level IS NULL OR NEW.assigned_level = '' THEN
            NEW.assigned_level := 'Responsable de Base';
        END IF;
    -- Règle 2: En fonction de la note au test d'entrée
    ELSIF NEW.entry_test_score IS NOT NULL THEN
        IF NEW.assigned_level IS NULL OR NEW.assigned_level = '' THEN
            IF NEW.entry_test_score >= 14 THEN
                NEW.assigned_level := 'Niveau 3';
            ELSIF NEW.entry_test_score >= 10 THEN
                NEW.assigned_level := 'Niveau 2';
            ELSE
                NEW.assigned_level := 'Niveau 1';
            END IF;
        END IF;
    END IF;

    -- Par défaut, la classe hérite du niveau si non ventilée
    IF (NEW.assigned_class IS NULL OR NEW.assigned_class = '') AND NEW.assigned_level IS NOT NULL THEN
        NEW.assigned_class := NEW.assigned_level;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participants_pedagogical_level ON participants;
CREATE TRIGGER trg_participants_pedagogical_level
BEFORE INSERT OR UPDATE OF entry_test_score, is_executive_member, executive_role ON participants
FOR EACH ROW
EXECUTE FUNCTION trg_auto_assign_pedagogical_level();

-- 3. FONCTION RPC DE VENTILATION EN MASSE DES SALLES & CLASSES
CREATE OR REPLACE FUNCTION admin_batch_assign_rooms(
    p_allocations JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    v_count INTEGER := 0;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(p_allocations)
    LOOP
        UPDATE participants
        SET 
            assigned_level = COALESCE(item->>'assigned_level', assigned_level),
            assigned_class = COALESCE(item->>'assigned_class', assigned_class),
            assigned_room = COALESCE(item->>'assigned_room', assigned_room),
            grades = CASE 
                WHEN item ? 'grades' THEN item->'grades' 
                ELSE grades 
            END
        WHERE matricule = item->>'matricule' OR id::TEXT = item->>'id';
        
        v_count := v_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'updated_count', v_count);
END;
$$;

-- 4. POLITIQUES DE SÉCURITÉ & PERMISSIONS (Évite l'erreur 42501 permission denied)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE participants TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE participants TO anon, authenticated;

DROP POLICY IF EXISTS "Public update participants" ON participants;
CREATE POLICY "Public update participants" ON participants FOR UPDATE USING (true) WITH CHECK (true);

-- 5. NOTIFICATION DE SUCCÈS
DO $$
BEGIN
    RAISE NOTICE 'Migration pédagogique SERFIG 2027 terminée avec succès !';
END $$;
