import React, { useState, useMemo } from 'react';
import { Participant, ParticipantGrades, SeminarConfig } from '../../types';
import { SeminaristReportCard } from '../SeminaristReportCard';
import { EditGradesModal } from './EditGradesModal';
import { BatchReportCardsPrint } from './BatchReportCardsPrint';
import { PedagogicalLevelManager } from './PedagogicalLevelManager';
import { updateParticipantStatus } from '../../services/storage';
import { 
  Award, 
  Printer, 
  Download, 
  CheckCircle, 
  Users, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  TrendingUp,
  CreditCard,
  QrCode,
  Shield,
  Eye,
  Check,
  Edit3,
  Sparkles,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  DoorOpen
} from 'lucide-react';

interface AdminCertificatesProps {
  participants: Participant[];
  config: SeminarConfig;
  userEmail: string;
  onUpdateParticipant?: (updated: Participant) => void;
  onBatchUpdateParticipants?: (updatedList: Participant[]) => void;
}

export const AdminCertificates: React.FC<AdminCertificatesProps> = ({
  participants,
  config,
  userEmail,
  onUpdateParticipant,
  onBatchUpdateParticipants
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'orientation' | 'bulletins' | 'attestations' | 'bilan'>('orientation');
  
  // États pour les Bulletins de Notes
  const [selectedBulletinParticipant, setSelectedBulletinParticipant] = useState<Participant | null>(null);
  const [editingParticipantGrades, setEditingParticipantGrades] = useState<Participant | null>(null);
  const [isBatchPrintingBulletins, setIsBatchPrintingBulletins] = useState<boolean>(false);
  const [bulletinFilterSubCommittee, setBulletinFilterSubCommittee] = useState<string>('all');
  const [bulletinFilterLevel, setBulletinFilterLevel] = useState<string>('all');
  const [bulletinSearchQuery, setBulletinSearchQuery] = useState<string>('');
  const [autoGenSuccess, setAutoGenSuccess] = useState<string>('');

  // États pour les Attestations
  const [selectedAttestationParticipant, setSelectedAttestationParticipant] = useState<Participant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');

  // Participants de type séminariste (pour les bulletins de note)
  const allSeminaristes = useMemo(() => {
    return participants.filter(p => p.type === 'seminariste');
  }, [participants]);

  // Séminaristes filtrés pour la gestion des bulletins
  const filteredSeminaristes = useMemo(() => {
    return allSeminaristes.filter(p => {
      if (bulletinFilterSubCommittee !== 'all' && p.subCommittee !== bulletinFilterSubCommittee) return false;
      if (bulletinFilterLevel !== 'all') {
        const level = p.grades?.currentLevel || p.schoolLevel || 'Niveau 1';
        if (level !== bulletinFilterLevel) return false;
      }
      if (bulletinSearchQuery.trim()) {
        const q = bulletinSearchQuery.toLowerCase();
        return p.fullName.toLowerCase().includes(q) || 
               p.matricule.toLowerCase().includes(q) || 
               p.subCommittee.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allSeminaristes, bulletinFilterSubCommittee, bulletinFilterLevel, bulletinSearchQuery]);

  // Participants éligibles aux attestations (ceux qui sont présents ou payés/gratuits)
  const eligibleParticipants = useMemo(() => {
    return participants.filter(p => {
      const isEligible = p.checkedIn || p.paymentStatus === 'paye' || p.paymentStatus === 'gratuit';
      if (!isEligible) return false;

      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.fullName.toLowerCase().includes(q) || 
               p.matricule.toLowerCase().includes(q) || 
               p.subCommittee.toLowerCase().includes(q);
      }
      return true;
    });
  }, [participants, filterType, filterSubCommittee, searchQuery]);

  // Statistiques pour le bilan final
  const stats = useMemo(() => {
    const total = participants.length;
    const seminaristes = participants.filter(p => p.type === 'seminariste').length;
    const formateurs = participants.filter(p => p.type === 'formateur').length;
    const commission = participants.filter(p => p.type === 'commission').length;
    const hommes = participants.filter(p => p.gender === 'homme').length;
    const femmes = participants.filter(p => p.gender === 'femme').length;
    const checkedInCount = participants.filter(p => p.checkedIn).length;
    const payes = participants.filter(p => p.paymentStatus === 'paye').length;
    const enAttente = participants.filter(p => p.paymentStatus === 'en_attente').length;
    const gratuits = participants.filter(p => p.paymentStatus === 'gratuit').length;

    const totalCollected = participants
      .filter(p => p.paymentStatus === 'paye')
      .reduce((sum, p) => sum + (p.totalFee || 0), 0);

    const totalExpected = participants
      .filter(p => p.paymentStatus !== 'gratuit')
      .reduce((sum, p) => sum + (p.totalFee || 0), 0);

    const polosCount = participants.filter(p => p.hasPolo).length;

    // Répartition par sous-comité
    const subCommitteeCounts: Record<string, { total: number; payes: number; checkedIn: number }> = {};
    participants.forEach(p => {
      const sc = p.subCommittee || 'Autre';
      if (!subCommitteeCounts[sc]) {
        subCommitteeCounts[sc] = { total: 0, payes: 0, checkedIn: 0 };
      }
      subCommitteeCounts[sc].total += 1;
      if (p.paymentStatus === 'paye') subCommitteeCounts[sc].payes += 1;
      if (p.checkedIn) subCommitteeCounts[sc].checkedIn += 1;
    });

    return {
      total,
      seminaristes,
      formateurs,
      commission,
      hommes,
      femmes,
      checkedInCount,
      payes,
      enAttente,
      gratuits,
      totalCollected,
      totalExpected,
      polosCount,
      subCommitteeCounts
    };
  }, [participants]);

  // Enregistrement des notes modifiées pour un séminariste
  const handleSaveParticipantGrades = (grades: ParticipantGrades) => {
    if (!editingParticipantGrades) return;

    const updatedParticipant: Participant = {
      ...editingParticipantGrades,
      grades
    };

    updateParticipantStatus(updatedParticipant.id, { grades });
    if (onUpdateParticipant) {
      onUpdateParticipant(updatedParticipant);
    }

    if (selectedBulletinParticipant?.id === updatedParticipant.id) {
      setSelectedBulletinParticipant(updatedParticipant);
    }
  };

  // Générer des notes simulées pour les séminaristes n'ayant pas encore de notes
  const handleGenerateDefaultGrades = () => {
    let count = 0;
    allSeminaristes.forEach((p, idx) => {
      if (!p.grades) {
        // Notes pédagogiques réalistes
        const entry = Number((11 + (idx % 6) + Math.random() * 2).toFixed(1));
        const exit = Number((12 + (idx % 7) + Math.random() * 2).toFixed(1));
        const cond = Number((14 + (idx % 5) + Math.random() * 1.5).toFixed(1));
        const totalWeighted = (entry * 1) + (exit * 2) + (cond * 1);
        const avg = Number((totalWeighted / 4).toFixed(2));
        const target = p.schoolLevel === 'Lycée' ? 'Niveau 2' : p.schoolLevel === 'Collège' ? 'Niveau 2' : 'Niveau 3';
        
        const autoGrades: ParticipantGrades = {
          entryTest: Math.min(20, entry),
          entryTestCoeff: 1,
          exitTest: Math.min(20, exit),
          exitTestCoeff: 2,
          conduct: Math.min(20, cond),
          conductCoeff: 1,
          currentLevel: p.schoolLevel || 'Niveau 1',
          targetLevel: target,
          rank: (idx % 30) + 1,
          totalRanked: Math.max(30, allSeminaristes.length),
          mention: avg >= 16 ? 'Très Bien' : avg >= 14 ? 'Bien' : avg >= 12 ? 'Assez Bien' : 'Passable',
          decision: avg >= 10 ? `ADMIS(E) AU ${target.toUpperCase()}` : 'AJOURNÉ(E)',
          date: '22 Avril 2027',
          isPublished: true
        };

        updateParticipantStatus(p.id, { grades: autoGrades });
        if (onUpdateParticipant) {
          onUpdateParticipant({ ...p, grades: autoGrades });
        }
        count++;
      }
    });

    setAutoGenSuccess(`${count} séminariste(s) initialisé(s) avec succès avec la grille d'évaluation.`);
    setTimeout(() => setAutoGenSuccess(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ─── SÉLECTEUR DE SOUS-ONGLETS ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            {activeSubTab === 'orientation' ? (
              <DoorOpen className="w-6 h-6" />
            ) : activeSubTab === 'bulletins' ? (
              <GraduationCap className="w-6 h-6" />
            ) : activeSubTab === 'attestations' ? (
              <Award className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {activeSubTab === 'orientation' && 'Test d\'Entrée, Niveaux & Salles (Jour 1)'}
                {activeSubTab === 'bulletins' && 'Bulletins de Note Officiels (SERFIG 2027)'}
                {activeSubTab === 'attestations' && 'Attestations de Présence & Participation'}
                {activeSubTab === 'bilan' && 'Bilan Final & Clôture du Séminaire'}
              </h2>
              {activeSubTab === 'orientation' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Pédagogie J1
                </span>
              )}
              {activeSubTab === 'bulletins' && (
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black uppercase">
                  Modèle Homologué
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeSubTab === 'orientation' && 'Saisie rapide des notes de test, règle "Responsable de Base", découpage en classes et affichage des portes'}
              {activeSubTab === 'bulletins' && 'Génération fidèle au modèle avec Test d\'entrée, Test de Sortie, Conduite et Décision d\'admission'}
              {activeSubTab === 'attestations' && 'Génération des attestations officielles A4 avec QR code pour séminaristes et formateurs'}
              {activeSubTab === 'bilan' && 'Synthèse statistique complète, taux de présence, finances et commissions'}
            </p>
          </div>
        </div>

        {/* Boutons d'onglets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab('orientation');
              setSelectedBulletinParticipant(null);
              setIsBatchPrintingBulletins(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'orientation'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Test d'Entrée & Salles (J1)</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('bulletins');
              setSelectedBulletinParticipant(null);
              setIsBatchPrintingBulletins(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'bulletins'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Bulletins de Notes</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('attestations');
              setSelectedAttestationParticipant(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'attestations'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Attestations</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bilan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'bilan'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Bilan Final</span>
          </button>
        </div>
      </div>

      {/* ─── VUE 0 : TEST D'ENTRÉE & AFFECTATION DES SALLES (JOUR 1) ──── */}
      {activeSubTab === 'orientation' && (
        <PedagogicalLevelManager
          participants={participants}
          config={config}
          onUpdateParticipant={onUpdateParticipant}
          onBatchUpdateParticipants={onBatchUpdateParticipants}
        />
      )}

      {/* ─── VUE 1 : GESTION DES BULLETINS DE NOTES ─────────────────────── */}
      {activeSubTab === 'bulletins' && (
        <>
          {/* Si mode impression groupée par lot (Batch Print) */}
          {isBatchPrintingBulletins ? (
            <BatchReportCardsPrint
              participants={participants}
              config={config}
              onBack={() => setIsBatchPrintingBulletins(false)}
              onEditParticipantGrades={(p) => setEditingParticipantGrades(p)}
            />
          ) : selectedBulletinParticipant ? (
            /* Aperçu individuel d'un bulletin */
            <div className="space-y-4">
              <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setSelectedBulletinParticipant(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Revenir à la liste des séminaristes</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingParticipantGrades(selectedBulletinParticipant)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Modifier les notes</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Imprimer ce Bulletin (A4)</span>
                  </button>
                </div>
              </div>

              {/* Rendu fidèle du composant Bulletin */}
              <SeminaristReportCard
                participant={selectedBulletinParticipant}
                config={config}
                onEditGrades={(p) => setEditingParticipantGrades(p)}
                showActions={false}
              />
            </div>
          ) : (
            /* Liste des séminaristes pour consultation et saisie des notes */
            <div className="space-y-4 print:hidden">
              
              {/* Message de succès après génération auto */}
              {autoGenSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{autoGenSuccess}</span>
                </div>
              )}

              {/* Barres d'actions et filtres */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Promotion des Séminaristes ({allSeminaristes.length} inscrits)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Gérez les évaluations académiques, calculez les moyennes et imprimez les bulletins par lot.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleGenerateDefaultGrades}
                      className="px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="Pré-remplir les notes pédagogiques pour les séminaristes sans évaluation"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pré-remplir les Notes</span>
                    </button>

                    <button
                      onClick={() => setIsBatchPrintingBulletins(true)}
                      disabled={allSeminaristes.length === 0}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer Tout le Lot des Bulletins</span>
                    </button>
                  </div>
                </div>

                {/* Filtres de recherche */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, matricule ou sous-comité..."
                      value={bulletinSearchQuery}
                      onChange={e => setBulletinSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <select
                      value={bulletinFilterSubCommittee}
                      onChange={e => setBulletinFilterSubCommittee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="all">Tous les sous-comités ({allSeminaristes.length})</option>
                      {config.subCommittees.map(sc => (
                        <option key={sc.id} value={sc.name}>{sc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={bulletinFilterLevel}
                      onChange={e => setBulletinFilterLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="all">Tous les niveaux d'enseignement</option>
                      <option value="Niveau 1">Niveau 1</option>
                      <option value="Niveau 2">Niveau 2</option>
                      <option value="Niveau 3">Niveau 3</option>
                      <option value="Collège">Collège</option>
                      <option value="Lycée">Lycée</option>
                      <option value="Université">Université</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tableau des séminaristes & notes */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {filteredSeminaristes.length} séminariste(s) répertorié(s)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Cliquez sur <strong>Aperçu</strong> pour visualiser le bulletin ou <strong>Notes</strong> pour modifier la grille
                  </span>
                </div>

                {filteredSeminaristes.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">
                    Aucun séminariste ne correspond aux filtres de recherche.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                    {filteredSeminaristes.map((p) => {
                      const g = p.grades || {};
                      const entry = g.entryTest ?? 14;
                      const exit = g.exitTest ?? 15.5;
                      const cond = g.conduct ?? 17;
                      const cEntry = g.entryTestCoeff ?? 1;
                      const cExit = g.exitTestCoeff ?? 2;
                      const cCond = g.conductCoeff ?? 1;
                      const totalC = cEntry + cExit + cCond;
                      const totalW = (entry * cEntry) + (exit * cExit) + (cond * cCond);
                      const avg = totalC > 0 ? (totalW / totalC).toFixed(2) : '—';
                      const level = g.currentLevel || p.schoolLevel || 'Niveau 1';
                      const target = g.targetLevel || 'Niveau 2';

                      return (
                        <div
                          key={p.id || p.matricule}
                          className="p-3.5 hover:bg-orange-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          {/* Identité */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                              {p.fullName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {p.fullName}
                                </span>
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {p.matricule}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {level} → {target}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {p.subCommittee} • {p.gender === 'femme' ? 'Sœur' : 'Frère'}
                              </p>
                            </div>
                          </div>

                          {/* Notes & Actions */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Pastille Moyenne */}
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">Moyenne</span>
                              <span className="font-mono font-black text-sm text-[#0c4a2a]">
                                {avg} <span className="text-[10px] text-slate-500 font-normal">/20</span>
                              </span>
                            </div>

                            <button
                              onClick={() => setEditingParticipantGrades(p)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Modifier la grille de notes"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                              <span className="hidden sm:inline">Notes</span>
                            </button>

                            <button
                              onClick={() => setSelectedBulletinParticipant(p)}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Aperçu et impression du bulletin officiel"
                            >
                              <Eye className="w-3.5 h-3.5 text-white" />
                              <span>Aperçu Bulletin</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── VUE 2 : ATTESTATIONS DE PARTICIPATION ───────────────────── */}
      {activeSubTab === 'attestations' && !selectedAttestationParticipant && (
        <div className="space-y-4 print:hidden">
          {/* Filtres */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un participant éligible..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="seminariste">Séminaristes</option>
                <option value="formateur">Formateurs</option>
                <option value="commission">Commission</option>
              </select>
            </div>

            <div>
              <select
                value={filterSubCommittee}
                onChange={e => setFilterSubCommittee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="all">Tous les sous-comités</option>
                {config.subCommittees.map(sc => (
                  <option key={sc.name} value={sc.name}>{sc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des éligibles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {eligibleParticipants.length} participant(s) éligible(s) à l'attestation
              </span>
              <span className="text-[11px] text-slate-500">
                Sélectionnez un participant pour visualiser et imprimer son attestation
              </span>
            </div>

            {eligibleParticipants.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Aucun participant ne correspond aux critères d'éligibilité.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {eligibleParticipants.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedAttestationParticipant(p)}
                    className="p-3.5 hover:bg-orange-50/60 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                        {p.fullName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{p.fullName}</span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.matricule}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {p.subCommittee} • {p.gender === 'femme' ? 'Sœur' : 'Frère'} • {p.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.checkedIn && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Présence Validée
                        </span>
                      )}
                      <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-orange-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── VISUALISATION ATTESTATION INDIVIDUELLE (FORMAT A4) ──────── */}
      {activeSubTab === 'attestations' && selectedAttestationParticipant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedAttestationParticipant(null)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
            >
              ← Revenir à la liste
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer l'Attestation Officielle (A4)</span>
            </button>
          </div>

          {/* Cadre de l'attestation imprimable */}
          <div className="max-w-3xl mx-auto bg-white p-10 sm:p-14 rounded-2xl border-4 border-double border-orange-500 shadow-2xl space-y-8 relative overflow-hidden print:border-4 print:shadow-none print:m-0 print:p-8">
            {/* Filigrane discret */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <img 
                src="/assets/aistudio/1771719145696_b78691d8.png" 
                alt="Filigrane AEEMCI" 
                className="w-96 h-96 object-contain"
              />
            </div>

            {/* En-tête officiel */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="text-center w-48">
                <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">RÉPUBLIQUE DE CÔTE D'IVOIRE</p>
                <p className="text-[9px] text-slate-500 italic">Union - Discipline - Travail</p>
                <div className="w-12 h-0.5 bg-orange-500 mx-auto my-1"></div>
                <p className="text-[10px] font-black text-slate-800">AEEMCI</p>
                <p className="text-[9px] text-slate-600">Secrétariat Régional du Gôh</p>
              </div>

              <div className="w-20 h-20 rounded-full p-1 border-2 border-orange-500 flex items-center justify-center">
                <img 
                  src="/assets/aistudio/1771719145696_b78691d8.png" 
                  alt="Logo Homologué AEEMCI" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center w-48">
                <p className="text-[10px] font-bold text-emerald-800 uppercase">SCIENCE - FOI - ACTION</p>
                <p className="text-[9px] text-slate-500">Sous-comité de rattachement :</p>
                <p className="text-[11px] font-black text-slate-800 mt-1 uppercase">
                  {selectedAttestationParticipant.subCommittee}
                </p>
              </div>
            </div>

            {/* Titre de l'attestation */}
            <div className="text-center space-y-2 pt-2">
              <span className="inline-block px-4 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black uppercase tracking-widest border border-orange-200">
                Document Officiel de Participation
              </span>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight font-serif uppercase">
                ATTESTATION DE PARTICIPATION
              </h1>
              <p className="text-xs font-mono text-slate-400">
                N° Certificat : ATT-SERFIG-2027-{selectedAttestationParticipant.matricule}
              </p>
            </div>

            {/* Corps du texte */}
            <div className="text-center space-y-6 text-sm text-slate-700 leading-relaxed px-4">
              <p>
                Le Secrétariat Régional de l'Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI)
                région du Gôh atteste par la présente que :
              </p>

              <div className="py-2 border-b-2 border-dashed border-orange-400 max-w-lg mx-auto">
                <span className="text-2xl font-black text-slate-900 block font-serif uppercase tracking-wide">
                  {selectedAttestationParticipant.fullName}
                </span>
                <span className="text-xs text-orange-700 font-mono font-bold mt-1 block">
                  Matricule officiel : {selectedAttestationParticipant.matricule} • {selectedAttestationParticipant.type.toUpperCase()}
                </span>
              </div>

              <p className="max-w-xl mx-auto">
                A pris part avec assiduité et engagement fraternel aux activités de formation spirituelle,
                académique et citoyenne lors du :
              </p>

              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 max-w-xl mx-auto space-y-1">
                <h3 className="font-bold text-orange-900 text-base">
                  {config.editionName} ({config.editionNumber})
                </h3>
                <p className="text-xs text-slate-600">
                  Thème : « {config.theme?.title || 'Jeunesse musulmane, éthique et excellence'} »
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  📍 {config.location?.venue || 'Gagnoa'} • 📅 {config.displayDates || 'Avril 2027'}
                </p>
              </div>

              <p className="text-xs italic text-slate-500">
                En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
              </p>
            </div>

            {/* Signatures & Cachets */}
            <div className="pt-8 flex items-end justify-between px-6">
              <div className="text-center w-52 space-y-12">
                <p className="text-xs font-bold text-slate-800">
                  Le Président du Comité d'Organisation (PCO)
                </p>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600">
                  Frère Traoré M.
                </div>
              </div>

              {/* QR Code de vérification */}
              <div className="text-center space-y-1">
                <div className="w-18 h-18 p-1 bg-white border border-slate-300 mx-auto rounded shadow-xs flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-800" />
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Authenticité certifiée</span>
              </div>

              <div className="text-center w-52 space-y-12">
                <p className="text-xs font-bold text-slate-800">
                  Le Secrétaire Régional AEEMCI Gôh
                </p>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600">
                  Secrétariat Régional
                </div>
              </div>
            </div>

            {/* Pied de page officiel */}
            <div className="text-center pt-6 border-t border-slate-200 text-[10px] text-slate-400">
              Document officiel délivré par le Secrétariat Régional AEEMCI Gôh • SERFIG 2027 Gagnoa
            </div>
          </div>
        </div>
      )}

      {/* ─── VUE 3 : BILAN STATISTIQUE ET CLÔTURE ─────────────────────── */}
      {activeSubTab === 'bilan' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bilan d'Activité & Clôture du Séminaire</h2>
                <p className="text-xs text-slate-500">
                  Rapport exécutif consolidé pour la commission et le Secrétariat Régional
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le Bilan A4</span>
              </button>
            </div>

            {/* Cartes de synthèse */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                <span className="text-xs font-bold text-orange-800">Total Participants</span>
                <span className="text-2xl font-black text-orange-950 block mt-1">{stats.total}</span>
                <span className="text-[11px] text-orange-700 mt-1 block">
                  {stats.seminaristes} séminaristes • {stats.formateurs} formateurs
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800">Taux de Présence</span>
                <span className="text-2xl font-black text-emerald-950 block mt-1">
                  {stats.total > 0 ? Math.round((stats.checkedInCount / stats.total) * 100) : 0}%
                </span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  {stats.checkedInCount} émargés sur place
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-800">Recouvrement Inscriptions</span>
                <span className="text-2xl font-black text-blue-950 block mt-1">
                  {stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0}%
                </span>
                <span className="text-[11px] text-blue-700 mt-1 block">
                  {stats.totalCollected.toLocaleString()} F encaissés
                </span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                <span className="text-xs font-bold text-purple-800">Polos & Tenues Livrés</span>
                <span className="text-2xl font-black text-purple-950 block mt-1">{stats.polosCount}</span>
                <span className="text-[11px] text-purple-700 mt-1 block">
                  Commandes confectionnées
                </span>
              </div>
            </div>

            {/* Détails genre et statuts */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Démographie & Répartition
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-600">Frères (Hommes) :</span>
                    <span className="font-bold text-blue-700">
                      {stats.hommes} ({stats.total > 0 ? Math.round((stats.hommes / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-600">Sœurs (Femmes) :</span>
                    <span className="font-bold text-rose-700">
                      {stats.femmes} ({stats.total > 0 ? Math.round((stats.femmes / stats.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-600">Inscriptions Payées :</span>
                    <span className="font-bold text-emerald-700">{stats.payes}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-600">En attente / Sur place :</span>
                    <span className="font-bold text-amber-700">{stats.enAttente}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Répartition par Sous-Comité */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Participation détaillée par Sous-comité
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Sous-Comité</th>
                      <th className="p-2.5 text-center">Inscrits</th>
                      <th className="p-2.5 text-center">Paiements à jour</th>
                      <th className="p-2.5 text-center">Présence Validée</th>
                      <th className="p-2.5 text-right">% Présence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(stats.subCommitteeCounts).map(([sc, scData]) => (
                      <tr key={sc} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{sc}</td>
                        <td className="p-2.5 text-center">{scData.total}</td>
                        <td className="p-2.5 text-center text-emerald-700 font-bold">{scData.payes}</td>
                        <td className="p-2.5 text-center text-blue-700 font-bold">{scData.checkedIn}</td>
                        <td className="p-2.5 text-right font-mono">
                          {scData.total > 0 ? Math.round((scData.checkedIn / scData.total) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommandations & Conclusion */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800">Conclusion & Clôture :</p>
              <p>
                L'édition {config.editionName} du séminaire régional s'est déroulée avec succès. 
                Les objectifs spirituels, fraternels et d'encadrement ont été atteints avec une forte mobilisation 
                des sous-comités de la région du Gôh.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL D'ÉDITION DES NOTES ───────────────────────────────── */}
      {editingParticipantGrades && (
        <EditGradesModal
          participant={editingParticipantGrades}
          isOpen={true}
          onClose={() => setEditingParticipantGrades(null)}
          onSave={handleSaveParticipantGrades}
        />
      )}

    </div>
  );
};
