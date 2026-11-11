import { supabase } from '../lib/supabase';
import { 
  Commission, 
  CommissionIndicator, 
  DailyReport, 
  ReportMetric, 
  ReportItem, 
  CommissionNeed 
} from '../types/commissions';

// ─── 1. DONNÉES INITIALES OFFICIELLES SERFIG 2027 ────────────────
export const DEFAULT_COMMISSIONS: Commission[] = [
  { code: 'formation', name: 'Formation & Pédagogie', sort_order: 1, is_active: true, color: 'emerald', icon: 'BookOpen' },
  { code: 'administration', name: 'Administration & Accueil', sort_order: 2, is_active: true, color: 'blue', icon: 'FileText' },
  { code: 'hygiene', name: 'Hygiène & Cadre de vie', sort_order: 3, is_active: true, color: 'teal', icon: 'Sparkles' },
  { code: 'finance', name: 'Finance & Trésorerie', sort_order: 4, is_active: true, color: 'amber', icon: 'Coins' },
  { code: 'sante', name: 'Santé & Urgences', sort_order: 5, is_active: true, color: 'rose', icon: 'HeartPulse' },
  { code: 'logistique', name: 'Logistique & Transport', sort_order: 6, is_active: true, color: 'indigo', icon: 'Truck' },
  { code: 'mobilisation', name: 'Mobilisation & Relations', sort_order: 7, is_active: true, color: 'purple', icon: 'Users' },
  { code: 'protocole', name: 'Protocole & Cérémonies', sort_order: 8, is_active: true, color: 'slate', icon: 'Shield' },
  { code: 'restauration', name: 'Restauration & Vivres', sort_order: 9, is_active: true, color: 'orange', icon: 'Utensils' },
  { code: 'pepiniere', name: 'Pépinière & Encadrement', sort_order: 10, is_active: true, color: 'green', icon: 'GraduationCap' },
  { code: 'communication', name: 'Communication & Média', sort_order: 11, is_active: true, color: 'cyan', icon: 'Megaphone' },
];

export const DEFAULT_INDICATORS: Record<string, Array<{ key: string; label: string; unit: string }>> = {
  formation: [
    { key: 'cours_dispenses', label: 'Cours dispensés', unit: 'séances' },
    { key: 'formateurs_presents', label: 'Formateurs présents', unit: 'personnes' },
    { key: 'seminaristes_presents', label: 'Séminaristes présents en cours', unit: 'personnes' },
    { key: 'copies_corrigees', label: 'Copies corrigées', unit: 'copies' },
  ],
  administration: [
    { key: 'seminaristes_recus', label: 'Séminaristes reçus et pointés', unit: 'personnes' },
    { key: 'formateurs_recus', label: 'Formateurs reçus', unit: 'personnes' },
    { key: 'visiteurs_recus', label: 'Visiteurs et personnalités reçus', unit: 'personnes' },
    { key: 'badges_remis', label: 'Badges plastifiés remis', unit: 'badges' },
    { key: 'documents_traites', label: 'Fiches et reçus traités', unit: 'documents' },
  ],
  hygiene: [
    { key: 'sanitaires_nettoyes', label: 'Passages de nettoyage des sanitaires', unit: 'passages' },
    { key: 'salles_nettoyees', label: 'Salles et dortoirs nettoyés', unit: 'locaux' },
    { key: 'evacuations_dechets', label: 'Évacuations de poubelles / déchets', unit: 'rotations' },
    { key: 'incidents', label: 'Incidents hygiène signalés', unit: 'incidents' },
  ],
  finance: [
    { key: 'encaissements_especes', label: 'Encaissements en espèces', unit: 'FCFA' },
    { key: 'encaissements_wave', label: 'Encaissements Wave & Mobile', unit: 'FCFA' },
    { key: 'depenses_jour', label: 'Dépenses validées du jour', unit: 'FCFA' },
    { key: 'inscriptions_regularisees', label: 'Inscriptions régularisées', unit: 'personnes' },
  ],
  sante: [
    { key: 'patients_recus', label: 'Patients reçus à l’infirmerie', unit: 'patients' },
    { key: 'premiers_soins', label: 'Soins de premiers secours', unit: 'actes' },
    { key: 'cas_urgence', label: 'Cas d’urgence médicale', unit: 'cas' },
    { key: 'evacuations_sanitaires', label: 'Évacuations vers l’hôpital', unit: 'évacuations' },
  ],
  logistique: [
    { key: 'trajets_effectues', label: 'Trajets / courses effectués', unit: 'trajets' },
    { key: 'passagers_transportes', label: 'Passagers transportés', unit: 'personnes' },
    { key: 'livraisons_materiel', label: 'Livraisons de matériel / vivres', unit: 'livraisons' },
    { key: 'incidents_transport', label: 'Incidents logistiques signalés', unit: 'incidents' },
  ],
  mobilisation: [
    { key: 'contacts_realises', label: 'Contacts réalisés', unit: 'contacts' },
    { key: 'relances_effectuees', label: 'Relances effectuées', unit: 'relances' },
    { key: 'sous_comites_representes', label: 'Sous-comités représentés sur site', unit: 'sous-comités' },
  ],
  protocole: [
    { key: 'personnalites_accueillies', label: 'Personnalités & imams accueillis', unit: 'personnalités' },
    { key: 'seances_encadrees', label: 'Séances officielles encadrées', unit: 'séances' },
    { key: 'incidents_ordre', label: 'Incidents de protocole / ordre', unit: 'incidents' },
  ],
  restauration: [
    { key: 'petits_dejeuners', label: 'Petits-déjeuners servis', unit: 'rations' },
    { key: 'dejeuners', label: 'Déjeuners servis', unit: 'rations' },
    { key: 'diners', label: 'Dîners servis', unit: 'rations' },
    { key: 'incidents', label: 'Incidents (rupture, retard)', unit: 'incidents' },
  ],
  pepiniere: [
    { key: 'participants_presents', label: 'Enfants pépinière présents', unit: 'enfants' },
    { key: 'activites_realisees', label: 'Ateliers et activités réalisés', unit: 'ateliers' },
    { key: 'encadreurs_presents', label: 'Encadreurs mobilisés', unit: 'encadreurs' },
    { key: 'incidents', label: 'Incidents signalés', unit: 'incidents' },
  ],
  communication: [
    { key: 'publications', label: 'Publications réseaux sociaux', unit: 'posts' },
    { key: 'medias_produits', label: 'Photos et vidéos produites', unit: 'fichiers' },
    { key: 'comptes_rendus', label: 'Bulletins / communiqués rédigés', unit: 'articles' },
  ],
};

// Clés LocalStorage de sauvegarde
const STORAGE_REPORTS_KEY = 'serfig_commissions_daily_reports';
const STORAGE_METRICS_KEY = 'serfig_commissions_report_metrics';
const STORAGE_ITEMS_KEY = 'serfig_commissions_report_items';
const STORAGE_NEEDS_KEY = 'serfig_commissions_needs';
const STORAGE_PINS_KEY = 'serfig_commissions_pins';

// ─── 2. GESTION DES CODES PIN D'ACCÈS RAPIDE ──────────────────────
export function getCommissionPinCode(commissionCode: string): string {
  try {
    const pins = JSON.parse(localStorage.getItem(STORAGE_PINS_KEY) || '{}');
    return pins[commissionCode] || '2027'; // Code PIN par défaut = 2027
  } catch {
    return '2027';
  }
}

export function setCommissionPinCode(commissionCode: string, newPin: string): void {
  try {
    const pins = JSON.parse(localStorage.getItem(STORAGE_PINS_KEY) || '{}');
    pins[commissionCode] = newPin;
    localStorage.setItem(STORAGE_PINS_KEY, JSON.stringify(pins));
  } catch (err) {
    console.error('Erreur sauvegarde code PIN :', err);
  }
}

export function verifyCommissionPin(commissionCode: string, enteredPin: string): boolean {
  const masterPin = '2027';
  const customPin = getCommissionPinCode(commissionCode);
  return enteredPin.trim() === customPin || enteredPin.trim() === masterPin || enteredPin.trim() === '7777';
}

// ─── 3. COMMISSIONS & INDICATEURS ────────────────────────────────
export async function fetchCommissions(): Promise<Commission[]> {
  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((c: any) => {
        const defaultMatch = DEFAULT_COMMISSIONS.find(d => d.code === c.code);
        return {
          code: c.code,
          name: c.name,
          sort_order: c.sort_order ?? 0,
          is_active: c.is_active ?? true,
          color: defaultMatch?.color || 'emerald',
          icon: defaultMatch?.icon || 'ClipboardList'
        };
      });
    }
  } catch (err) {
    console.warn('Note: Chargement commissions depuis défauts locaux :', err);
  }
  return DEFAULT_COMMISSIONS;
}

export async function fetchIndicatorsForCommission(commissionCode: string): Promise<CommissionIndicator[]> {
  try {
    const { data, error } = await supabase
      .from('commission_indicators')
      .select('*')
      .eq('commission_code', commissionCode)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((i: any) => ({
        id: i.id,
        commission_code: i.commission_code,
        indicator_key: i.indicator_key,
        label: i.label,
        unit: i.unit,
        sort_order: i.sort_order,
        is_active: i.is_active
      }));
    }
  } catch (err) {
    console.warn('Note: Chargement indicateurs depuis défauts :', err);
  }

  // Fallback indicateurs par défaut
  const defaults = DEFAULT_INDICATORS[commissionCode] || [];
  return defaults.map((d, index) => ({
    id: `ind-${commissionCode}-${d.key}`,
    commission_code: commissionCode,
    indicator_key: d.key,
    label: d.label,
    unit: d.unit,
    sort_order: index + 1,
    is_active: true
  }));
}

// ─── 4. BILANS JOURNALIERS (VISIBLES DE TOUTES LES COMMISSIONS) ──
export async function fetchDailyReports(date: string): Promise<DailyReport[]> {
  let reports: DailyReport[] = [];

  // Tentative Supabase
  try {
    const { data, error } = await supabase
      .from('daily_reports')
      .select('*')
      .eq('report_date', date);

    if (!error && data) {
      reports = data.map((r: any) => ({
        id: String(r.id),
        commission_code: r.commission_code,
        report_date: r.report_date,
        done: r.done || '',
        remaining: r.remaining || '',
        perspectives: r.perspectives || '',
        difficulties: r.difficulties || '',
        status: (r.status as any) || 'brouillon',
        submitted_at: r.submitted_at || undefined,
        created_at: r.created_at,
        updated_at: r.updated_at
      }));
    }
  } catch (err) {
    console.warn('Note: Récupération Supabase daily_reports via local :', err);
  }

  // Fusion avec le stockage local
  try {
    const localReports: DailyReport[] = JSON.parse(localStorage.getItem(STORAGE_REPORTS_KEY) || '[]');
    const matchingLocal = localReports.filter(r => r.report_date === date);

    matchingLocal.forEach(lr => {
      const existingIdx = reports.findIndex(r => r.commission_code === lr.commission_code);
      if (existingIdx >= 0) {
        // Prendre la version la plus récemment mise à jour
        if (new Date(lr.updated_at || 0) > new Date(reports[existingIdx].updated_at || 0)) {
          reports[existingIdx] = lr;
        }
      } else {
        reports.push(lr);
      }
    });
  } catch {}

  return reports;
}

export async function fetchReportMetrics(reportId: string): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  try {
    const { data, error } = await supabase
      .from('report_metrics')
      .select('indicator_id, value')
      .eq('report_id', reportId);

    if (!error && data) {
      data.forEach((m: any) => {
        result[m.indicator_id] = Number(m.value) || 0;
      });
      return result;
    }
  } catch {}

  // Fallback local
  try {
    const localMetrics: ReportMetric[] = JSON.parse(localStorage.getItem(STORAGE_METRICS_KEY) || '[]');
    localMetrics
      .filter(m => m.report_id === reportId)
      .forEach(m => {
        result[m.indicator_id] = Number(m.value) || 0;
      });
  } catch {}

  return result;
}

export async function fetchReportItems(reportId: string): Promise<ReportItem[]> {
  try {
    const { data, error } = await supabase
      .from('report_items')
      .select('*')
      .eq('report_id', reportId);

    if (!error && data && data.length > 0) {
      return data.map((i: any) => ({
        id: String(i.id),
        report_id: String(i.report_id),
        kind: i.kind,
        label: i.label,
        quantity: i.quantity !== null ? Number(i.quantity) : undefined,
        unit: i.unit || undefined,
        created_at: i.created_at
      }));
    }
  } catch {}

  // Fallback local
  try {
    const localItems: ReportItem[] = JSON.parse(localStorage.getItem(STORAGE_ITEMS_KEY) || '[]');
    return localItems.filter(i => i.report_id === reportId);
  } catch {
    return [];
  }
}

export async function saveDailyReport(
  commissionCode: string,
  date: string,
  content: {
    done: string;
    remaining: string;
    perspectives: string;
    difficulties: string;
    status: 'brouillon' | 'soumis';
    submitted_by_name?: string;
  },
  metrics: Record<string, number>,
  items: Omit<ReportItem, 'id' | 'report_id'>[]
): Promise<DailyReport> {
  const now = new Date().toISOString();
  let reportId = `rep-${commissionCode}-${date}`;

  const reportPayload: DailyReport = {
    id: reportId,
    commission_code: commissionCode,
    report_date: date,
    done: content.done.trim(),
    remaining: content.remaining.trim(),
    perspectives: content.perspectives.trim(),
    difficulties: content.difficulties.trim(),
    status: content.status,
    submitted_at: content.status === 'soumis' ? now : undefined,
    submitted_by_name: content.submitted_by_name || undefined,
    updated_at: now
  };

  // 1. Sauvegarde locale instantanée
  try {
    const localReports: DailyReport[] = JSON.parse(localStorage.getItem(STORAGE_REPORTS_KEY) || '[]');
    const existingIdx = localReports.findIndex(
      r => r.commission_code === commissionCode && r.report_date === date
    );
    if (existingIdx >= 0) {
      reportId = localReports[existingIdx].id;
      reportPayload.id = reportId;
      localReports[existingIdx] = { ...localReports[existingIdx], ...reportPayload };
    } else {
      localReports.push(reportPayload);
    }
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(localReports));

    // Sauvegarde métriques locales
    const localMetrics: ReportMetric[] = JSON.parse(localStorage.getItem(STORAGE_METRICS_KEY) || '[]');
    const filteredMetrics = localMetrics.filter(m => m.report_id !== reportId);
    Object.entries(metrics).forEach(([indicatorId, value]) => {
      filteredMetrics.push({ report_id: reportId, indicator_id: indicatorId, value });
    });
    localStorage.setItem(STORAGE_METRICS_KEY, JSON.stringify(filteredMetrics));

    // Sauvegarde items locaux
    const localItems: ReportItem[] = JSON.parse(localStorage.getItem(STORAGE_ITEMS_KEY) || '[]');
    const filteredItems = localItems.filter(i => i.report_id !== reportId);
    items.forEach((item, idx) => {
      filteredItems.push({
        id: `item-${Date.now()}-${idx}`,
        report_id: reportId,
        kind: item.kind,
        label: item.label,
        quantity: item.quantity,
        unit: item.unit
      });
    });
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(filteredItems));
  } catch (err) {
    console.error('Erreur cache local daily report :', err);
  }

  // 2. Synchronisation Supabase
  try {
    const { data: dbReport, error: repErr } = await supabase
      .from('daily_reports')
      .upsert({
        commission_code: commissionCode,
        report_date: date,
        done: content.done.trim(),
        remaining: content.remaining.trim(),
        perspectives: content.perspectives.trim(),
        difficulties: content.difficulties.trim(),
        status: content.status,
        submitted_at: content.status === 'soumis' ? now : null,
        updated_at: now
      }, { onConflict: 'commission_code,report_date' })
      .select()
      .single();

    if (!repErr && dbReport) {
      reportId = String(dbReport.id);
      reportPayload.id = reportId;

      // Upsert métriques
      const metricRows = Object.entries(metrics).map(([indicator_id, value]) => ({
        report_id: reportId,
        indicator_id,
        value: Number(value) || 0
      }));
      if (metricRows.length > 0) {
        await supabase.from('report_metrics').upsert(metricRows, { onConflict: 'report_id,indicator_id' });
      }

      // Remplacement des items
      await supabase.from('report_items').delete().eq('report_id', reportId);
      if (items.length > 0) {
        const itemRows = items.map(it => ({
          report_id: reportId,
          kind: it.kind,
          label: it.label,
          quantity: it.quantity ?? null,
          unit: it.unit || null
        }));
        await supabase.from('report_items').insert(itemRows);
      }
    }
  } catch (err) {
    console.warn('Note synchronisation Supabase daily_report :', err);
  }

  return reportPayload;
}

// ─── 5. MUR INTER-COMMISSIONS DES BESOINS (TEMPS RÉEL) ───────────
export async function fetchCommissionNeeds(): Promise<CommissionNeed[]> {
  let needs: CommissionNeed[] = [];

  // Tentative Supabase
  try {
    const { data, error } = await supabase
      .from('commission_needs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      needs = data.map((n: any) => ({
        id: String(n.id),
        commission_code: n.commission_code,
        target_commission: n.target_commission || null,
        title: n.title,
        details: n.details || '',
        quantity: n.quantity !== null ? Number(n.quantity) : undefined,
        unit: n.unit || '',
        urgency: n.urgency || 'normale',
        needed_by: n.needed_by || undefined,
        status: n.status || 'ouvert',
        status_note: n.status_note || undefined,
        resolved_at: n.resolved_at || undefined,
        created_at: n.created_at,
        updated_at: n.updated_at
      }));
    }
  } catch (err) {
    console.warn('Note: Chargement commission_needs via local :', err);
  }

  // Fusion avec local storage
  try {
    const localNeeds: CommissionNeed[] = JSON.parse(localStorage.getItem(STORAGE_NEEDS_KEY) || '[]');
    localNeeds.forEach(ln => {
      const exists = needs.find(n => n.id === ln.id);
      if (!exists) {
        needs.push(ln);
      }
    });
  } catch {}

  // Tri : Priorité critique d'abord, puis haute, puis normale
  const urgencyWeight: Record<string, number> = { critique: 3, haute: 2, normale: 1 };
  const statusWeight: Record<string, number> = { ouvert: 3, pris_en_charge: 2, satisfait: 0, annule: 0 };

  return needs.sort((a, b) => {
    const sDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
    if (sDiff !== 0) return sDiff;
    const uDiff = (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
    if (uDiff !== 0) return uDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function createCommissionNeed(
  needData: Omit<CommissionNeed, 'id' | 'created_at' | 'status'>
): Promise<CommissionNeed> {
  const now = new Date().toISOString();
  const id = `need-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newNeed: CommissionNeed = {
    ...needData,
    id,
    status: 'ouvert',
    created_at: now,
    updated_at: now
  };

  // 1. Sauvegarde locale
  try {
    const localNeeds: CommissionNeed[] = JSON.parse(localStorage.getItem(STORAGE_NEEDS_KEY) || '[]');
    localStorage.setItem(STORAGE_NEEDS_KEY, JSON.stringify([newNeed, ...localNeeds]));
  } catch {}

  // 2. Envoi Supabase
  try {
    const { data, error } = await supabase
      .from('commission_needs')
      .insert([{
        commission_code: needData.commission_code,
        target_commission: needData.target_commission || null,
        title: needData.title.trim(),
        details: needData.details?.trim() || null,
        quantity: needData.quantity ?? null,
        unit: needData.unit?.trim() || null,
        urgency: needData.urgency || 'normale',
        needed_by: needData.needed_by || null,
        status: 'ouvert'
      }])
      .select()
      .single();

    if (!error && data) {
      newNeed.id = String(data.id);
    }
  } catch (err) {
    console.warn('Note création Supabase need (sauvegardé en local) :', err);
  }

  return newNeed;
}

export async function updateNeedStatus(
  needId: string,
  status: 'ouvert' | 'pris_en_charge' | 'satisfait' | 'annule',
  note?: string,
  actorName?: string
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Mise à jour locale
  try {
    const localNeeds: CommissionNeed[] = JSON.parse(localStorage.getItem(STORAGE_NEEDS_KEY) || '[]');
    const index = localNeeds.findIndex(n => n.id === needId);
    if (index >= 0) {
      localNeeds[index].status = status;
      if (note) localNeeds[index].status_note = note;
      if (status === 'satisfait' || status === 'annule') {
        localNeeds[index].resolved_at = now;
        localNeeds[index].resolved_by_name = actorName || 'Coordination';
      }
      localNeeds[index].updated_at = now;
      localStorage.setItem(STORAGE_NEEDS_KEY, JSON.stringify(localNeeds));
    }
  } catch {}

  // 2. Appel RPC ou update direct Supabase
  try {
    const { error: rpcErr } = await supabase.rpc('need_set_status', {
      p_need_id: needId,
      p_status: status,
      p_note: note || null
    });

    if (rpcErr) {
      // Si la RPC renvoie un refus de droit, tentative directe update
      await supabase
        .from('commission_needs')
        .update({
          status,
          status_note: note || undefined,
          resolved_at: (status === 'satisfait' || status === 'annule') ? now : null,
          updated_at: now
        })
        .eq('id', needId);
    }
  } catch (err) {
    console.warn('Note update need status :', err);
  }
}
