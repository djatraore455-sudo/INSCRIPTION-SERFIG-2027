import React, { useState, useEffect, useMemo } from 'react';
import { Commission, DailyReport, CommissionNeed } from '../../../types/commissions';
import { 
  DEFAULT_COMMISSIONS,
  fetchCommissions,
  fetchDailyReports,
  fetchCommissionNeeds,
  updateNeedStatus,
  verifyCommissionPin,
  getCommissionPinCode,
  setCommissionPinCode,
  fetchReportMetrics,
  fetchReportItems
} from '../../../services/commissionsService';
import { CreateNeedModal } from './CreateNeedModal';
import { EditDailyReportModal } from './EditDailyReportModal';
import { 
  Layers, 
  AlertTriangle, 
  FileText, 
  Printer, 
  KeyRound, 
  CheckCircle, 
  Clock, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Lock, 
  Unlock, 
  Calendar,
  Building2,
  ChevronRight,
  Eye,
  Edit3,
  ThumbsUp,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export const CommissionsManager: React.FC = () => {
  // Navigation interne
  const [activeSubTab, setActiveSubTab] = useState<'needs' | 'reports' | 'plenary' | 'pins'>('needs');

  // Données
  const [commissions, setCommissions] = useState<Commission[]>(DEFAULT_COMMISSIONS);
  const [needs, setNeeds] = useState<CommissionNeed[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Authentification rapide par commission
  const [activeCommissionCode, setActiveCommissionCode] = useState<string>('coordination'); // 'coordination' = PCO Super Admin
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [unlockedCommissions, setUnlockedCommissions] = useState<Record<string, boolean>>({ coordination: true });

  // Modales
  const [isCreateNeedOpen, setIsCreateNeedOpen] = useState(false);
  const [isEditReportOpen, setIsEditReportOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);

  // Vue détaillée d'un bilan pour consultation inter-commission
  const [viewingReportModal, setViewingReportModal] = useState<{
    commission: Commission;
    report: DailyReport;
    metrics: Record<string, number>;
    items: any[];
  } | null>(null);

  // Filtres pour le mur des besoins
  const [needFilterUrgency, setNeedFilterUrgency] = useState<string>('all');
  const [needFilterStatus, setNeedFilterStatus] = useState<string>('all');
  const [needFilterCommission, setNeedFilterCommission] = useState<string>('all');

  // Chargement des données
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [comms, nList, rList] = await Promise.all([
        fetchCommissions(),
        fetchCommissionNeeds(),
        fetchDailyReports(selectedDate)
      ]);
      setCommissions(comms);
      setNeeds(nList);
      setReports(rList);
    } catch (err) {
      console.error('Erreur chargement commissions :', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Déverrouillage par PIN
  const handleUnlockCommission = (code: string) => {
    if (code === 'coordination') {
      setActiveCommissionCode('coordination');
      return;
    }

    if (unlockedCommissions[code]) {
      setActiveCommissionCode(code);
      return;
    }

    if (!pinInput.trim()) {
      setPinError('Entrez le code PIN pour déverrouiller.');
      return;
    }

    if (verifyCommissionPin(code, pinInput)) {
      setUnlockedCommissions(prev => ({ ...prev, [code]: true }));
      setActiveCommissionCode(code);
      setPinInput('');
      setPinError('');
      setPinSuccess(`Accès déverrouillé pour la commission !`);
      setTimeout(() => setPinSuccess(''), 3000);
    } else {
      setPinError('Code PIN incorrect (Code par défaut : 2027)');
    }
  };

  // Traitement d'un besoin (Prise en charge ou Satisfait)
  const handleNeedStatusChange = async (
    needId: string, 
    newStatus: 'ouvert' | 'pris_en_charge' | 'satisfait' | 'annule'
  ) => {
    try {
      const actor = activeCommissionCode === 'coordination' 
        ? 'Coordination PCO' 
        : `Commission ${commissions.find(c => c.code === activeCommissionCode)?.name || activeCommissionCode}`;
      
      await updateNeedStatus(needId, newStatus, undefined, actor);
      setNeeds(prev => prev.map(n => n.id === needId ? { ...n, status: newStatus } : n));
    } catch (err) {
      console.error('Erreur mise à jour statut besoin :', err);
    }
  };

  // Consultation détaillée d'un bilan
  const handleViewReport = async (commission: Commission, report: DailyReport) => {
    try {
      const [metrics, items] = await Promise.all([
        fetchReportMetrics(report.id),
        fetchReportItems(report.id)
      ]);
      setViewingReportModal({
        commission,
        report,
        metrics,
        items
      });
    } catch (err) {
      console.error('Erreur consultation bilan :', err);
    }
  };

  // Filtrage des besoins
  const filteredNeeds = useMemo(() => {
    return needs.filter(n => {
      if (needFilterUrgency !== 'all' && n.urgency !== needFilterUrgency) return false;
      if (needFilterStatus !== 'all' && n.status !== needFilterStatus) return false;
      if (needFilterCommission !== 'all' && n.commission_code !== needFilterCommission && n.target_commission !== needFilterCommission) {
        return false;
      }
      return true;
    });
  }, [needs, needFilterUrgency, needFilterStatus, needFilterCommission]);

  const openNeedsCount = needs.filter(n => n.status === 'ouvert' || n.status === 'pris_en_charge').length;
  const criticalNeedsCount = needs.filter(n => n.urgency === 'critique' && n.status === 'ouvert').length;

  return (
    <div className="space-y-6">
      {/* ─── BANDEAU SUPÉRIEUR & SÉLECTEUR DE RÔLE ─── */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-emerald-200 text-xs font-black uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" /> Espace Collaboratif Inter-Commissions
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Bilans Quotidiens & Mur des Besoins en Temps Réel
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-2xl mt-1">
              Plateforme partagée SERFIG 2027. Tous les bilans et besoins sont 
              <span className="text-white font-bold underline decoration-amber-400 decoration-2 ml-1">
                visibles par toutes les commissions
              </span> afin de faciliter la réactivité et la solidarité sur le terrain.
            </p>
          </div>

          {/* Sélecteur de commission active avec déverrouillage PIN */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs space-y-2 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                Agir en tant que :
              </span>
              {activeCommissionCode === 'coordination' ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px]">
                  PCO Coordination
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-emerald-400 text-emerald-950 font-black text-[10px]">
                  {commissions.find(c => c.code === activeCommissionCode)?.name.split(' ')[0]}
                </span>
              )}
            </div>

            <select
              value={activeCommissionCode}
              onChange={e => {
                const targetCode = e.target.value;
                if (targetCode === 'coordination' || unlockedCommissions[targetCode]) {
                  setActiveCommissionCode(targetCode);
                } else {
                  setActiveCommissionCode(targetCode);
                }
              }}
              className="w-full bg-emerald-950/70 text-white font-bold rounded-xl px-3 py-2 border border-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            >
              <option value="coordination">🏛️ Coordination Générale / PCO (Super-Vision)</option>
              <optgroup label="11 Commissions Techniques :">
                {commissions.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.name} {unlockedCommissions[c.code] ? '🔓' : '🔒'}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Saisie PIN si commission verrouillée */}
            {activeCommissionCode !== 'coordination' && !unlockedCommissions[activeCommissionCode] && (
              <div className="pt-1.5 space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Code PIN (défaut : 2027)"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUnlockCommission(activeCommissionCode)}
                    className="flex-1 bg-white/90 text-slate-900 font-bold px-2.5 py-1.5 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    onClick={() => handleUnlockCommission(activeCommissionCode)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-black cursor-pointer"
                  >
                    Déverrouiller
                  </button>
                </div>
                {pinError && <p className="text-[10px] text-red-200 font-bold">{pinError}</p>}
                {pinSuccess && <p className="text-[10px] text-emerald-200 font-bold">{pinSuccess}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ONGLETS DE NAVIGATION ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('needs')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'needs'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Mur des Besoins en Direct</span>
            {openNeedsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                criticalNeedsCount > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-200 text-orange-950'
              }`}>
                {openNeedsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Bilans Quotidiens (11 Commissions)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {reports.filter(r => r.status === 'soumis').length}/11
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('plenary')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'plenary'
                ? 'bg-blue-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Synthèse PCO & Impression A4</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pins')}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'pins'
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Codes PIN</span>
          </button>
        </div>

        {/* Date active & Rafraîchir */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date :</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── CONTENU DU SOUS-ONGLET 1 : MUR DES BESOINS EN DIRECT ─── */}
      {activeSubTab === 'needs' && (
        <div className="space-y-4">
          {/* Barre d'action et filtres */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-500">Filtrer par :</span>
              {/* Urgence */}
              <select
                value={needFilterUrgency}
                onChange={e => setNeedFilterUrgency(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
              >
                <option value="all">Toutes urgences</option>
                <option value="critique">🔴 Critique</option>
                <option value="haute">🟠 Haute</option>
                <option value="normale">🔵 Normale</option>
              </select>

              {/* Statut */}
              <select
                value={needFilterStatus}
                onChange={e => setNeedFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
              >
                <option value="all">Tous statuts</option>
                <option value="ouvert">⏳ Ouverts</option>
                <option value="pris_en_charge">✋ En cours / Pris en charge</option>
                <option value="satisfait">✅ Satisfaits</option>
                <option value="annule">❌ Annulés</option>
              </select>

              {/* Commission */}
              <select
                value={needFilterCommission}
                onChange={e => setNeedFilterCommission(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
              >
                <option value="all">Toutes commissions</option>
                {commissions.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsCreateNeedOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>+ Émettre un Besoin en Direct</span>
            </button>
          </div>

          {/* Grille des besoins */}
          {filteredNeeds.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-black text-slate-800 text-base">Aucun besoin signalé pour l'instant</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Toutes les commissions sont opérationnelles. En cas de manque ou d'urgence matérielle, cliquez sur le bouton "+ Émettre un Besoin en Direct".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNeeds.map(need => {
                const emitter = commissions.find(c => c.code === need.commission_code);
                const target = need.target_commission ? commissions.find(c => c.code === need.target_commission) : null;

                const isCrit = need.urgency === 'critique';
                const isHaute = need.urgency === 'haute';
                const isSatisfait = need.status === 'satisfait';
                const isPrisEnCharge = need.status === 'pris_en_charge';

                return (
                  <div 
                    key={need.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isSatisfait
                        ? 'border-slate-200 opacity-75'
                        : isCrit
                        ? 'border-red-500 shadow-md ring-2 ring-red-100'
                        : isHaute
                        ? 'border-orange-400 shadow-sm'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* En-tête de carte */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            De : <strong className="text-slate-800">{emitter?.name || need.commission_code}</strong>
                          </span>
                          <div className="text-[11px] font-bold text-slate-600">
                            Vers : <span className="text-emerald-700">{target?.name || '🏛️ Coordination PCO'}</span>
                          </div>
                        </div>

                        {/* Badge Urgence */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCrit 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : isHaute 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {need.urgency}
                        </span>
                      </div>

                      {/* Titre & Détails */}
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">
                          {need.title}
                        </h4>
                        {need.quantity && (
                          <p className="text-xs font-bold text-orange-700 mt-0.5">
                            Quantité : {need.quantity} {need.unit || ''}
                          </p>
                        )}
                        {need.details && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {need.details}
                          </p>
                        )}
                      </div>

                      {/* Date & Auteur */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Émis le {new Date(need.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {need.needed_by && (
                          <span className="font-semibold text-slate-600">Requis pour : {need.needed_by}</span>
                        )}
                      </div>
                    </div>

                    {/* Statut & Actions en bas de carte */}
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                        isSatisfait
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPrisEnCharge
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isSatisfait ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {need.status.replace('_', ' ')}
                      </span>

                      {/* Boutons d'action rapide */}
                      {!isSatisfait && (
                        <div className="flex items-center gap-1">
                          {need.status === 'ouvert' && (
                            <button
                              onClick={() => handleNeedStatusChange(need.id, 'pris_en_charge')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                            >
                              ✋ Prendre en charge
                            </button>
                          )}
                          <button
                            onClick={() => handleNeedStatusChange(need.id, 'satisfait')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Satisfait
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── CONTENU DU SOUS-ONGLET 2 : BILANS DES 11 COMMISSIONS ─── */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Transparence Totale : Tous les bilans sont ouverts à la consultation.
              </p>
              <p className="text-amber-800/90 mt-0.5">
                Cliquez sur "Consulter le Bilan" pour voir les indicateurs, faits marquants, besoins et difficultés d'une commission.
                Pour éditer ou soumettre le rapport d'une commission, sélectionnez cette dernière dans le bandeau supérieur à l'aide de son Code PIN.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commissions.map(commission => {
              const report = reports.find(r => r.commission_code === commission.code);
              const isSubmitted = report?.status === 'soumis';
              const isDraft = report?.status === 'brouillon';
              const canEdit = activeCommissionCode === 'coordination' || activeCommissionCode === commission.code;

              return (
                <div 
                  key={commission.code}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isSubmitted 
                      ? 'border-emerald-300 shadow-sm' 
                      : isDraft 
                      ? 'border-amber-200 shadow-2xs' 
                      : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Commission #{commission.sort_order}
                        </span>
                        <h4 className="font-black text-slate-900 text-base mt-0.5">
                          {commission.name}
                        </h4>
                      </div>

                      {/* Statut Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${
                        isSubmitted 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : isDraft 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isSubmitted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Soumis</span>
                          </>
                        ) : isDraft ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Brouillon</span>
                          </>
                        ) : (
                          <span>Non renseigné</span>
                        )}
                      </span>
                    </div>

                    {/* Aperçu du contenu */}
                    {report ? (
                      <div className="space-y-2 text-xs">
                        {report.done && (
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-700 block mb-0.5">Faits marquants :</span>
                            <p className="text-slate-600 line-clamp-2">{report.done}</p>
                          </div>
                        )}
                        {report.difficulties && (
                          <div className="bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                            <span className="font-bold text-red-700 block mb-0.5">Difficultés signalées :</span>
                            <p className="text-red-900 line-clamp-2">{report.difficulties}</p>
                          </div>
                        )}
                        {report.submitted_by_name && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Rapporteur : <span className="font-bold text-slate-700">{report.submitted_by_name}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Aucun bilan renseigné pour le {selectedDate}.
                      </div>
                    )}
                  </div>

                  {/* Boutons d'action */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {report ? (
                      <button
                        onClick={() => handleViewReport(commission, report)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Consulter</span>
                      </button>
                    ) : <div />}

                    <button
                      onClick={() => {
                        setEditingCommission(commission);
                        setIsEditReportOpen(true);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                        canEdit
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{report ? 'Modifier' : 'Rédiger le Bilan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CONTENU DU SOUS-ONGLET 3 : SYNTHÈSE PCO & IMPRESSION A4 ─── */}
      {activeSubTab === 'plenary' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Fiche de Synthèse Plénière du Soir (PCO)</h3>
              <p className="text-xs text-slate-500">
                Génération automatique du document récapitulatif pour la réunion d'évaluation quotidienne.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer la Fiche A4 (Plénière)</span>
            </button>
          </div>

          {/* FICHE A4 IMPRIMABLE */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Header Document */}
            <div className="border-b-2 border-emerald-800 pb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">
                  AEEMCI — Région du Gôh • SERFIG 2027
                </p>
                <h1 className="text-xl font-black text-slate-900 mt-0.5">
                  SYNTHÈSE QUOTIDIENNE D'ÉVALUATION & BILAN DU SÉMINAIRE
                </h1>
                <p className="text-xs text-slate-500">
                  Comité d'Organisation SERFIG 2027 • Date d'évaluation : <strong>{selectedDate}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                  {reports.filter(r => r.status === 'soumis').length} / 11 Commissions Présentées
                </span>
              </div>
            </div>

            {/* Alertes & Besoins Critiques non résolus */}
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Besoins Urgents / Points de Blocage Signalés ({needs.filter(n => n.urgency === 'critique' || n.urgency === 'haute').length})</span>
              </div>
              {needs.filter(n => (n.urgency === 'critique' || n.urgency === 'haute') && n.status !== 'satisfait').length === 0 ? (
                <p className="text-xs text-red-700 italic">Aucune urgence critique non résolue ce jour.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-red-950">
                  {needs
                    .filter(n => (n.urgency === 'critique' || n.urgency === 'haute') && n.status !== 'satisfait')
                    .map(n => (
                      <li key={n.id} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-red-200">
                        <span className="font-black text-red-700 uppercase shrink-0">[{n.urgency}]</span>
                        <div className="flex-1">
                          <strong>{n.title}</strong> — Émis par {commissions.find(c => c.code === n.commission_code)?.name}
                          {n.quantity && <span className="ml-1 font-bold">({n.quantity} {n.unit})</span>}
                          {n.details && <span className="block text-slate-600 text-[11px] mt-0.5">{n.details}</span>}
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 shrink-0">
                          {n.status}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Tableau Récapitulatif par Commission */}
            <div className="space-y-3">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">
                État d'avancement des 11 Commissions Techniques
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black border-y border-slate-300">
                      <th className="py-2 px-3">Commission</th>
                      <th className="py-2 px-3">Statut</th>
                      <th className="py-2 px-3">Faits marquants / Réalisations</th>
                      <th className="py-2 px-3">Tâches restantes / Difficultés</th>
                      <th className="py-2 px-3">Rapporteur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {commissions.map(c => {
                      const rep = reports.find(r => r.commission_code === c.code);
                      return (
                        <tr key={c.code} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {c.name}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rep?.status === 'soumis'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rep?.status === 'brouillon'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {rep ? rep.status : 'Non reçu'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-xs">
                            {rep?.done || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-xs">
                            {rep?.difficulties || rep?.remaining || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-medium">
                            {rep?.submitted_by_name || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures en bas de page */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="font-bold text-slate-700">Le Secrétaire de Séance / Rapporteur Général</p>
                <div className="h-16"></div>
                <p className="text-slate-400 text-[10px]">Signature</p>
              </div>
              <div>
                <p className="font-bold text-slate-700">Le Président du Comité d'Organisation (PCO)</p>
                <div className="h-16"></div>
                <p className="text-slate-400 text-[10px]">Signature & Cachet</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONTENU DU SOUS-ONGLET 4 : GESTION DES CODES PIN ─── */}
      {activeSubTab === 'pins' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="font-black text-slate-900 text-base">Configuration des Codes PIN d'Accès Terrain</h3>
            <p className="text-xs text-slate-500">
              Chaque chef de commission peut accéder à son module d'édition rapidement sur smartphone grâce à son code PIN.
              Le code universel par défaut est <strong className="text-emerald-700">2027</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {commissions.map(c => {
              const currentPin = getCommissionPinCode(c.code);
              return (
                <div key={c.code} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">{c.name}</span>
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      defaultValue={currentPin}
                      onBlur={e => {
                        const newPin = e.target.value.trim() || '2027';
                        setCommissionPinCode(c.code, newPin);
                      }}
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-black text-center text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400">Code PIN</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODALE CRÉATION BESOIN ─── */}
      <CreateNeedModal
        isOpen={isCreateNeedOpen}
        onClose={() => setIsCreateNeedOpen(false)}
        commissions={commissions}
        currentCommissionCode={activeCommissionCode === 'coordination' ? 'restauration' : activeCommissionCode}
        onNeedCreated={newNeed => {
          setNeeds(prev => [newNeed, ...prev]);
        }}
      />

      {/* ─── MODALE ÉDITION BILAN ─── */}
      {editingCommission && (
        <EditDailyReportModal
          isOpen={isEditReportOpen}
          onClose={() => {
            setIsEditReportOpen(false);
            setEditingCommission(null);
          }}
          commission={editingCommission}
          date={selectedDate}
          existingReport={reports.find(r => r.commission_code === editingCommission.code)}
          onReportSaved={saved => {
            setReports(prev => {
              const idx = prev.findIndex(r => r.commission_code === saved.commission_code);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [...prev, saved];
            });
          }}
        />
      )}

      {/* ─── MODALE CONSULTATION COMPLÈTE BILAN (TOUT VISIBLE) ─── */}
      {viewingReportModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingReportModal(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {viewingReportModal.commission.name}
                </span>
                <h3 className="font-black text-slate-900 text-lg mt-1">
                  Bilan du {viewingReportModal.report.report_date}
                </h3>
              </div>
              <button 
                onClick={() => setViewingReportModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenu détaillé */}
            <div className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Indicateurs */}
              {Object.keys(viewingReportModal.metrics).length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase">Indicateurs chiffrés :</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(viewingReportModal.metrics).map(([key, val]) => (
                      <div key={key} className="bg-white p-2 rounded-xl border border-slate-200 flex justify-between">
                        <span className="text-slate-600 font-medium">{key.replace(/^ind-[^-]+-/, '').replace(/_/g, ' ')}</span>
                        <strong className="text-slate-900">{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Réalisations */}
              {viewingReportModal.report.done && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">✅ Activités réalisées :</h4>
                  <p className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-line border border-slate-100">
                    {viewingReportModal.report.done}
                  </p>
                </div>
              )}

              {/* Restant */}
              {viewingReportModal.report.remaining && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">⏳ Reste à faire :</h4>
                  <p className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-line border border-slate-100">
                    {viewingReportModal.report.remaining}
                  </p>
                </div>
              )}

              {/* Perspectives */}
              {viewingReportModal.report.perspectives && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">🚀 Perspectives pour demain :</h4>
                  <p className="bg-slate-50 p-3 rounded-xl text-slate-700 whitespace-pre-line border border-slate-100">
                    {viewingReportModal.report.perspectives}
                  </p>
                </div>
              )}

              {/* Difficultés */}
              {viewingReportModal.report.difficulties && (
                <div>
                  <h4 className="font-bold text-red-700 mb-1">⚠️ Difficultés rencontrées :</h4>
                  <p className="bg-red-50/60 p-3 rounded-xl text-red-900 whitespace-pre-line border border-red-200">
                    {viewingReportModal.report.difficulties}
                  </p>
                </div>
              )}

              {/* Items consommations et manques */}
              {viewingReportModal.items.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-black text-slate-800 text-xs uppercase">Détails matériels / vivres / manques :</h4>
                  <div className="space-y-1.5">
                    {viewingReportModal.items.map((it, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            it.kind === 'consommation'
                              ? 'bg-emerald-100 text-emerald-800'
                              : it.kind === 'manque'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {it.kind}
                          </span>
                          <span className="font-bold text-slate-800">{it.label}</span>
                        </div>
                        {it.quantity && (
                          <span className="font-black text-slate-700">{it.quantity} {it.unit || ''}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingReportModal.report.submitted_by_name && (
                <p className="text-[11px] text-slate-400 italic">
                  Présenté par : {viewingReportModal.report.submitted_by_name}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingReportModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
