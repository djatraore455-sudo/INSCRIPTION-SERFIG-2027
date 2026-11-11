import React, { useState, useEffect } from 'react';
import { Commission, CommissionIndicator, DailyReport, ReportItem } from '../../../types/commissions';
import { 
  fetchIndicatorsForCommission, 
  fetchReportMetrics, 
  fetchReportItems, 
  saveDailyReport 
} from '../../../services/commissionsService';
import { 
  X, 
  Save, 
  Send, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  TrendingUp,
  PackagePlus
} from 'lucide-react';

interface EditDailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: Commission;
  date: string;
  existingReport?: DailyReport | null;
  onReportSaved: (savedReport: DailyReport) => void;
  currentUserRole?: string;
}

export const EditDailyReportModal: React.FC<EditDailyReportModalProps> = ({
  isOpen,
  onClose,
  commission,
  date,
  existingReport,
  onReportSaved
}) => {
  const [indicators, setIndicators] = useState<CommissionIndicator[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [done, setDone] = useState('');
  const [remaining, setRemaining] = useState('');
  const [perspectives, setPerspectives] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [submittedByName, setSubmittedByName] = useState('');
  
  // Items de consommations et manques
  const [items, setItems] = useState<Array<{
    kind: 'consommation' | 'manque' | 'depense';
    label: string;
    quantity?: number;
    unit?: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Initialisation à l'ouverture
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Remplir les champs si rapport existant
    if (existingReport) {
      setDone(existingReport.done || '');
      setRemaining(existingReport.remaining || '');
      setPerspectives(existingReport.perspectives || '');
      setDifficulties(existingReport.difficulties || '');
      setSubmittedByName(existingReport.submitted_by_name || '');
    } else {
      setDone('');
      setRemaining('');
      setPerspectives('');
      setDifficulties('');
      setSubmittedByName('');
    }

    // Charger les indicateurs et items
    (async () => {
      try {
        const inds = await fetchIndicatorsForCommission(commission.code);
        if (!isMounted) return;
        setIndicators(inds);

        if (existingReport && existingReport.id) {
          const [loadedMetrics, loadedItems] = await Promise.all([
            fetchReportMetrics(existingReport.id),
            fetchReportItems(existingReport.id)
          ]);
          if (!isMounted) return;
          setMetrics(loadedMetrics);
          setItems(loadedItems.map(it => ({
            kind: it.kind,
            label: it.label,
            quantity: it.quantity,
            unit: it.unit
          })));
        } else {
          // Init métriques à 0
          const initialMetrics: Record<string, number> = {};
          inds.forEach(ind => {
            initialMetrics[ind.id] = 0;
          });
          setMetrics(initialMetrics);
          setItems([]);
        }
      } catch (err: any) {
        console.error('Erreur chargement données rapport :', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, commission.code, date, existingReport]);

  if (!isOpen) return null;

  const handleMetricChange = (indicatorId: string, val: string) => {
    const num = parseFloat(val);
    setMetrics(prev => ({
      ...prev,
      [indicatorId]: isNaN(num) ? 0 : num
    }));
  };

  const handleAddItem = (kind: 'consommation' | 'manque' | 'depense') => {
    setItems(prev => [
      ...prev,
      { kind, label: '', quantity: undefined, unit: '' }
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (targetStatus: 'brouillon' | 'soumis') => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const saved = await saveDailyReport(
        commission.code,
        date,
        {
          done,
          remaining,
          perspectives,
          difficulties,
          status: targetStatus,
          submitted_by_name: submittedByName.trim() || undefined
        },
        metrics,
        items
      );

      setSuccessMsg(
        targetStatus === 'soumis'
          ? 'Bilan soumis officiellement avec succès !'
          : 'Brouillon sauvegardé avec succès.'
      );
      onReportSaved(saved);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Erreur sauvegarde rapport :', err);
      setErrorMsg(err?.message || 'Erreur lors de la sauvegarde du bilan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-6 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                {commission.name}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Date : {date}
              </span>
              {existingReport?.status === 'soumis' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Soumis officiel
                </span>
              )}
            </div>
            <h3 className="font-black text-slate-900 text-lg sm:text-xl mt-1">
              Rapport & Bilan Quotidien d'Activité
            </h3>
            <p className="text-xs text-slate-500">
              Ce bilan sera directement visible par la Coordination PCO et toutes les commissions partenaires.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Corps scrollable */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Chargement des données du bilan...</span>
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto pr-1 text-xs">
            {/* 1. INDICATEURS CLÉS */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                  1. Indicateurs Clés de la Journée
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {indicators.map(ind => (
                  <div key={ind.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-xs">{ind.label}</p>
                      {ind.unit && <p className="text-[10px] text-slate-400 font-medium">Unité : {ind.unit}</p>}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={metrics[ind.id] ?? 0}
                      onChange={e => handleMetricChange(ind.id, e.target.value)}
                      className="w-24 px-2.5 py-1.5 text-right font-black text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. TEXTES EXPLICATIFS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Activités réalisées */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ✅ Activités réalisées / Faits marquants :
                </label>
                <textarea
                  rows={3}
                  value={done}
                  onChange={e => setDone(e.target.value)}
                  placeholder="Ce qui a été accompli avec succès aujourd'hui..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reste à faire */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ⏳ Tâches restantes ou reportées :
                </label>
                <textarea
                  rows={3}
                  value={remaining}
                  onChange={e => setRemaining(e.target.value)}
                  placeholder="Actions non finalisées à terminer ce soir ou demain..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Perspectives */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  🚀 Perspectives & Planning de demain :
                </label>
                <textarea
                  rows={3}
                  value={perspectives}
                  onChange={e => setPerspectives(e.target.value)}
                  placeholder="Objectifs clés pour la journée du lendemain..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Difficultés */}
              <div className="space-y-1">
                <label className="block font-bold text-red-700">
                  ⚠️ Difficultés & Points de blocage :
                </label>
                <textarea
                  rows={3}
                  value={difficulties}
                  onChange={e => setDifficulties(e.target.value)}
                  placeholder="Problèmes matériels, effectifs, retards rencontrés..."
                  className="w-full p-2.5 bg-red-50/50 border border-red-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* 3. DÉTAIL DES CONSOMMATIONS, MANQUES ET DÉPENSES */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                    3. Consommations, Manques & Dépenses du Jour
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddItem('consommation')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Consommation
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('manque')}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Manque
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('depense')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Dépense
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-4 text-slate-400 font-medium text-[11px] bg-white rounded-xl border border-dashed border-slate-200">
                  Aucun article spécifique ajouté. Utilisez les boutons ci-dessus pour détailler les vivres, matériels ou dépenses.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div 
                      key={idx}
                      className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2 text-xs"
                    >
                      <select
                        value={it.kind}
                        onChange={e => handleUpdateItem(idx, 'kind', e.target.value)}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] border ${
                          it.kind === 'consommation' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : it.kind === 'manque'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        <option value="consommation">Consommé</option>
                        <option value="manque">Manquant</option>
                        <option value="depense">Dépense (FCFA)</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Désignation (ex: Sac de riz 50kg, Bouteille gaz...)"
                        value={it.label}
                        onChange={e => handleUpdateItem(idx, 'label', e.target.value)}
                        className="flex-1 min-w-[150px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                      />

                      <input
                        type="number"
                        placeholder="Qté"
                        value={it.quantity ?? ''}
                        onChange={e => handleUpdateItem(idx, 'quantity', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-right text-slate-900"
                      />

                      <input
                        type="text"
                        placeholder="Unité"
                        value={it.unit || ''}
                        onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Renseigné par */}
            <div className="pt-2">
              <label className="block font-bold text-slate-700 mb-1">
                Rédigé / Présenté par (Nom du rapporteur) :
              </label>
              <input
                type="text"
                value={submittedByName}
                onChange={e => setSubmittedByName(e.target.value)}
                placeholder="ex: Frère Amadou - Chef Commission Restauration"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Pied de page avec actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('brouillon')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Enregistrer Brouillon</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave('soumis')}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-white" />
                  <span>Soumettre Officiellement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
