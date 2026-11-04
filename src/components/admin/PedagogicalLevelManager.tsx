import React, { useState, useMemo } from 'react';
import { Participant, SeminarConfig } from '../../types';
import { updateParticipantStatus } from '../../services/storage';
import { 
  GraduationCap, 
  Printer, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  SlidersHorizontal, 
  Save, 
  Award, 
  DoorOpen, 
  FileText, 
  Building2, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Clock,
  Check,
  QrCode,
  ExternalLink,
  Globe
} from 'lucide-react';

interface PedagogicalLevelManagerProps {
  participants: Participant[];
  config: SeminarConfig;
  onUpdateParticipant?: (updated: Participant) => void;
  onBatchUpdateParticipants?: (updatedList: Participant[]) => void;
}

export const PedagogicalLevelManager: React.FC<PedagogicalLevelManagerProps> = ({
  participants,
  config,
  onUpdateParticipant,
  onBatchUpdateParticipants
}) => {
  // Onglet interne
  const [activeTab, setActiveTab] = useState<'scoring' | 'rooms' | 'posters' | 'online-test'>('scoring');
  
  // Paramètres de seuils de notation configurables
  const [level1Max, setLevel1Max] = useState<number>(9.5);
  const [level2Max, setLevel2Max] = useState<number>(13.5);
  const [maxPerRoom, setMaxPerRoom] = useState<number>(35);
  const [autoExecutiveRule, setAutoExecutiveRule] = useState<boolean>(true);

  // Recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Uniquement les séminaristes
  const seminaristes = useMemo(() => {
    return participants.filter(p => p.type === 'seminariste');
  }, [participants]);

  // Détermination du niveau en fonction de la note et du statut de membre du bureau
  const determineLevel = (score: number | undefined, isExecutive: boolean | undefined): string => {
    if (autoExecutiveRule && isExecutive) {
      return 'Responsable de Base';
    }
    if (score === undefined || score === null) {
      return 'Niveau 1';
    }
    if (score < 10) return 'Niveau 1';
    if (score <= 13.5) return 'Niveau 2';
    return 'Niveau 3';
  };

  // Enregistrement rapide d'une note de test d'entrée
  const handleScoreChange = (participant: Participant, scoreVal: number) => {
    const clampedScore = Math.min(20, Math.max(0, scoreVal));
    const targetLevel = determineLevel(clampedScore, participant.isExecutiveMember);

    const updatedParticipant: Participant = {
      ...participant,
      entryTestScore: clampedScore,
      assignedLevel: targetLevel,
      assignedClass: participant.assignedClass || targetLevel,
      grades: {
        ...(participant.grades || {}),
        entryTest: clampedScore,
        currentLevel: targetLevel,
        isPublished: true
      }
    };

    updateParticipantStatus(participant.id, {
      entryTestScore: clampedScore,
      assignedLevel: targetLevel,
      assignedClass: updatedParticipant.assignedClass,
      grades: updatedParticipant.grades
    });

    if (onUpdateParticipant) {
      onUpdateParticipant(updatedParticipant);
    }
  };

  // Bascule du statut de membre de bureau (Section / Sous-comité)
  const handleToggleExecutive = (participant: Participant) => {
    const nextExecutive = !participant.isExecutiveMember;
    const nextLevel = nextExecutive && autoExecutiveRule ? 'Responsable de Base' : determineLevel(participant.entryTestScore, false);

    const updatedParticipant: Participant = {
      ...participant,
      isExecutiveMember: nextExecutive,
      executiveRole: nextExecutive ? (participant.executiveRole || 'Membre de bureau') : undefined,
      assignedLevel: nextLevel,
      assignedClass: nextExecutive ? 'Responsable de Base' : nextLevel,
      grades: {
        ...(participant.grades || {}),
        currentLevel: nextLevel
      }
    };

    updateParticipantStatus(participant.id, {
      isExecutiveMember: nextExecutive,
      executiveRole: updatedParticipant.executiveRole,
      assignedLevel: nextLevel,
      assignedClass: updatedParticipant.assignedClass,
      grades: updatedParticipant.grades
    });

    if (onUpdateParticipant) {
      onUpdateParticipant(updatedParticipant);
    }
  };

  // ─── ALGORITHME D'AFFECTATION AUTOMATIQUE DANS LES SALLES (1A, 1B, 1C...) ───
  const handleAutoAssignRoomsAndClasses = () => {
    // 1. Regrouper par niveau
    const groups: Record<string, Participant[]> = {
      'Responsable de Base': [],
      'Niveau 1': [],
      'Niveau 2': [],
      'Niveau 3': []
    };

    seminaristes.forEach(p => {
      const lvl = p.assignedLevel || determineLevel(p.entryTestScore, p.isExecutiveMember);
      if (groups[lvl]) {
        groups[lvl].push(p);
      } else {
        groups['Niveau 1'].push(p);
      }
    });

    let globalRoomIndex = 1;
    const updatedList: Participant[] = [];

    // Traitement de chaque niveau
    Object.entries(groups).forEach(([lvlName, studentList]) => {
      if (studentList.length === 0) return;

      if (lvlName === 'Responsable de Base') {
        const roomName = `Salle ${globalRoomIndex < 10 ? '0' + globalRoomIndex : globalRoomIndex} (Amphi Leadership)`;
        globalRoomIndex++;

        studentList.forEach(p => {
          const updated: Participant = {
            ...p,
            assignedLevel: 'Responsable de Base',
            assignedClass: 'Responsable de Base',
            assignedRoom: roomName,
            grades: {
              ...(p.grades || {}),
              currentLevel: 'Responsable de Base'
            }
          };
          updateParticipantStatus(p.id, {
            assignedLevel: updated.assignedLevel,
            assignedClass: updated.assignedClass,
            assignedRoom: updated.assignedRoom,
            grades: updated.grades
          });
          updatedList.push(updated);
        });
        return;
      }

      // Pour Niveau 1, Niveau 2, Niveau 3 : découpage en classes alphabétiques A, B, C...
      const numClassesNeeded = Math.ceil(studentList.length / maxPerRoom);

      studentList.forEach((p, idx) => {
        const classLetter = String.fromCharCode(65 + Math.floor(idx / maxPerRoom)); // A, B, C...
        const assignedClass = numClassesNeeded > 1 ? `${lvlName} ${classLetter}` : lvlName;
        const roomNum = globalRoomIndex + Math.floor(idx / maxPerRoom);
        const assignedRoom = `Salle ${roomNum < 10 ? '0' + roomNum : roomNum}`;

        const updated: Participant = {
          ...p,
          assignedLevel: lvlName,
          assignedClass,
          assignedRoom,
          grades: {
            ...(p.grades || {}),
            currentLevel: assignedClass
          }
        };

        updateParticipantStatus(p.id, {
          assignedLevel: updated.assignedLevel,
          assignedClass: updated.assignedClass,
          assignedRoom: updated.assignedRoom,
          grades: updated.grades
        });
        updatedList.push(updated);
      });

      globalRoomIndex += numClassesNeeded;
    });

    if (onBatchUpdateParticipants) {
      onBatchUpdateParticipants(updatedList);
    }

    setSuccessMsg(`Affectation terminée ! ${updatedList.length} séminaristes répartis avec succès dans les salles.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Pré-remplissage pédagogique automatique si besoin
  const handleAutoFillEntryScores = () => {
    let count = 0;
    seminaristes.forEach((p, i) => {
      if (p.entryTestScore === undefined) {
        // Note simulée réaliste
        const simulatedScore = Number((8 + (i % 11) + Math.random() * 1.5).toFixed(1));
        handleScoreChange(p, Math.min(20, simulatedScore));
        count++;
      }
    });
    setSuccessMsg(`${count} notes de test d'entrée générées automatiquement.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filtrage des séminaristes pour la vue de saisie
  const filteredList = useMemo(() => {
    return seminaristes.filter(p => {
      if (filterLevel !== 'all') {
        const lvl = p.assignedLevel || determineLevel(p.entryTestScore, p.isExecutiveMember);
        if (lvl !== filterLevel) return false;
      }
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.fullName.toLowerCase().includes(q) || p.matricule.toLowerCase().includes(q);
      }
      return true;
    });
  }, [seminaristes, filterLevel, filterSubCommittee, searchQuery, autoExecutiveRule]);

  // Regroupement par classe et salle pour les fiches d'affichage des portes
  const roomsMap = useMemo(() => {
    const map: Record<string, { className: string; roomName: string; students: Participant[] }> = {};

    seminaristes.forEach(p => {
      const cls = p.assignedClass || p.assignedLevel || 'Niveau 1';
      const room = p.assignedRoom || 'Salle 01';
      const key = `${cls} - ${room}`;

      if (!map[key]) {
        map[key] = {
          className: cls,
          roomName: room,
          students: []
        };
      }
      map[key].students.push(p);
    });

    // Trier les élèves par ordre alphabétique dans chaque salle
    Object.values(map).forEach(r => {
      r.students.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });

    return map;
  }, [seminaristes]);

  // Statistiques de répartition
  const stats = useMemo(() => {
    const total = seminaristes.length;
    const withScore = seminaristes.filter(p => p.entryTestScore !== undefined).length;
    const executives = seminaristes.filter(p => p.isExecutiveMember).length;
    const n1 = seminaristes.filter(p => (p.assignedLevel || determineLevel(p.entryTestScore, p.isExecutiveMember)) === 'Niveau 1').length;
    const n2 = seminaristes.filter(p => (p.assignedLevel || determineLevel(p.entryTestScore, p.isExecutiveMember)) === 'Niveau 2').length;
    const n3 = seminaristes.filter(p => (p.assignedLevel || determineLevel(p.entryTestScore, p.isExecutiveMember)) === 'Niveau 3').length;

    return { total, withScore, executives, n1, n2, n3 };
  }, [seminaristes, autoExecutiveRule]);

  return (
    <div className="space-y-6">
      
      {/* ─── BANDEAU SUPÉRIEUR & SOUS-NAVIGATION ───────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Orientation Pédagogique & Affectation des Salles (Jour 1)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Automatisé
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Saisie des notes du Test d'Entrée, règle "Responsable de Base", découpage en classes (A, B, C) et fiches d'affichage A4.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('scoring')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scoring'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Saisie des Notes (J1)</span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rooms'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <DoorOpen className="w-4 h-4" />
              <span>Salles & Découpage (A, B, C)</span>
            </button>

            <button
              onClick={() => setActiveTab('online-test')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'online-test'
                  ? 'bg-[#0b5334] text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-300" />
              <span>Suivi Test en Ligne (J1)</span>
            </button>

            <button
              onClick={() => setActiveTab('posters')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'posters'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Listes Affichage Portes (A4)</span>
            </button>
          </div>
        </div>

        {/* Message de confirmation */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Cartouches de statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Séminaristes</span>
            <span className="text-lg font-black text-slate-900 font-mono">{stats.total}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">{stats.withScore} notés</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
            <span className="text-[11px] text-purple-700 block font-bold">Resp. de Base</span>
            <span className="text-lg font-black text-purple-950 font-mono">{stats.executives}</span>
            <span className="text-[10px] text-purple-600 block mt-0.5">Membres de bureau</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] text-amber-700 block font-bold">Niveau 1</span>
            <span className="text-lg font-black text-amber-950 font-mono">{stats.n1}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Note &lt; 10/20</span>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[11px] text-blue-700 block font-bold">Niveau 2</span>
            <span className="text-lg font-black text-blue-950 font-mono">{stats.n2}</span>
            <span className="text-[10px] text-blue-600 block mt-0.5">10 à 13.5/20</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] text-emerald-700 block font-bold">Niveau 3</span>
            <span className="text-lg font-black text-emerald-950 font-mono">{stats.n3}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">&ge; 14/20</span>
          </div>
        </div>
      </div>

      {/* ─── ONGLET 1 : SAISIE RAPIDE DES NOTES DU TEST D'ENTRÉE ───────── */}
      {activeTab === 'scoring' && (
        <div className="space-y-4 print:hidden">
          
          {/* Outils & Barème paramétrable */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-800">Règle d'affectation :</span>
              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={autoExecutiveRule}
                  onChange={e => setAutoExecutiveRule(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-semibold text-slate-700">
                  Membres de bureau &rarr; Responsable de Base
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoFillEntryScores}
                className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Simuler les notes du test d'entrée pour la démonstration"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simuler les Notes</span>
              </button>

              <button
                onClick={handleAutoAssignRoomsAndClasses}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Affecter Salles & Classes</span>
              </button>
            </div>
          </div>

          {/* Filtres de recherche */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom ou matricule..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={filterLevel}
                onChange={e => setFilterLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="all">Tous les niveaux d'affectation</option>
                <option value="Responsable de Base">Responsable de Base</option>
                <option value="Niveau 1">Niveau 1 (&lt; 10)</option>
                <option value="Niveau 2">Niveau 2 (10 à 13.5)</option>
                <option value="Niveau 3">Niveau 3 (&ge; 14)</option>
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
                  <option key={sc.id} value={sc.name}>{sc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grille de saisie ultra-rapide */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {filteredList.length} séminariste(s) à évaluer
              </span>
              <span className="text-[11px] text-slate-500">
                Saisissez la note du test (/20) : le niveau, la salle et le badge se mettent à jour automatiquement
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
              {filteredList.map(p => {
                const calculatedLevel = determineLevel(p.entryTestScore, p.isExecutiveMember);
                const currentScore = p.entryTestScore ?? '';

                return (
                  <div
                    key={p.id || p.matricule}
                    className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    {/* Infos séminariste */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                        {p.fullName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 truncate">
                            {p.fullName}
                          </span>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.matricule}
                          </span>
                          {p.isExecutiveMember && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px] flex items-center gap-1">
                              ⭐ Membre de bureau
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {p.subCommittee} • {p.schoolLevel || 'Séminariste'}
                        </p>
                      </div>
                    </div>

                    {/* Zone d'action : Membre bureau + Note + Niveau auto */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {/* Checkbox Membre de bureau */}
                      <label 
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                          p.isExecutiveMember 
                            ? 'bg-purple-50 text-purple-900 border-purple-300 font-bold' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Cochez si le séminariste est membre d'un bureau de section ou sous-comité"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(p.isExecutiveMember)}
                          onChange={() => handleToggleExecutive(p)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>Bureau AEEMCI</span>
                      </label>

                      {/* Saisie de la Note */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">Test d'entrée :</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="20"
                          placeholder="—"
                          value={currentScore}
                          onChange={e => handleScoreChange(p, parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-center font-mono font-black text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                        />
                        <span className="font-bold text-slate-400 text-xs">/20</span>
                      </div>

                      {/* Badge du Niveau Attribué */}
                      <div className="w-36 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide ${
                          calculatedLevel === 'Responsable de Base'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : calculatedLevel === 'Niveau 3'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : calculatedLevel === 'Niveau 2'
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {p.assignedClass || calculatedLevel}
                        </span>
                        {p.assignedRoom && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            📍 {p.assignedRoom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── ONGLET 2 : SALLES & DÉCOUPAGE ALPHABÉTIQUE (1A, 1B, 1C...) ─── */}
      {activeTab === 'rooms' && (
        <div className="space-y-6 print:hidden">
          {/* Panneau de configuration de capacité */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span>Paramètres des Salles de Cours</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Définissez le nombre maximum d'élèves par salle pour créer automatiquement les sections A, B, C...
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700">Capacité max par salle :</label>
                <input
                  type="number"
                  min="10"
                  max="80"
                  value={maxPerRoom}
                  onChange={e => setMaxPerRoom(parseInt(e.target.value) || 35)}
                  className="w-16 h-8 text-center font-bold text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-xs text-slate-500">élèves</span>
              </div>

              <button
                onClick={handleAutoAssignRoomsAndClasses}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Recalculer les Salles</span>
              </button>
            </div>
          </div>

          {/* Grille des salles configurées */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(roomsMap).map(([key, roomData]) => (
              <div key={key} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{roomData.className}</h4>
                    <p className="text-xs font-bold text-orange-600">📍 {roomData.roomName}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                    {roomData.students.length} élèves
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {roomData.students.map((st, i) => (
                    <div key={st.id || st.matricule} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <span className="truncate text-slate-800 font-medium max-w-[180px]">
                        {i + 1}. {st.fullName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {st.entryTestScore !== undefined ? `${st.entryTestScore}/20` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ONGLET 3 : LISTES D'AFFICHAGE DEVANT LES PORTES (FORMAT A4) ─── */}
      {activeTab === 'posters' && (
        <div className="space-y-6">
          {/* Bouton d'impression groupée pour toutes les portes */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between print:hidden">
            <div>
              <h3 className="font-black text-sm text-slate-900">
                Fiches d'Affichage Officielles pour Portes de Salles (A4)
              </h3>
              <p className="text-xs text-slate-500">
                Chaque salle dispose d'une page A4 prête avec en-tête, liste des élèves et note d'entrée.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Toutes les Fiches de Portes (PDF)</span>
            </button>
          </div>

          {/* Fiches A4 individuelles par salle (Sauts de page pour impression) */}
          <div className="space-y-12">
            {Object.entries(roomsMap).map(([key, roomData], idx) => (
              <div
                key={key}
                className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border-2 border-slate-900 shadow-xl print:shadow-none print:m-0 print:p-6 print:border-2 print:border-black rounded-sm space-y-6"
                style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
              >
                {/* En-tête de la fiche de porte */}
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                  <div className="text-left w-60">
                    <p className="text-[11px] font-black text-slate-900 uppercase">AEEMCI</p>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">Secrétariat Régional du Gôh</p>
                    <p className="text-[9px] text-slate-500">SERFIG 2027 • Gagnoa</p>
                  </div>

                  <div className="w-16 h-16 rounded-full border border-black p-1 flex items-center justify-center">
                    <img
                      src="/assets/aistudio/1771719145696_b78691d8.png"
                      alt="AEEMCI"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-right w-60">
                    <p className="text-[10px] font-extrabold text-slate-900 uppercase">Commission Pédagogique</p>
                    <p className="text-[9px] text-slate-600">Orientation & Enseignement</p>
                    <p className="text-[9px] text-slate-500">Avril 2027</p>
                  </div>
                </div>

                {/* Grand Titre de la Salle */}
                <div className="text-center bg-[#0b5334] text-white py-3 px-4 rounded-sm space-y-0.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200">
                    FICHE D'AFFECTATION PÉDAGOGIQUE
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-serif">
                    {roomData.className}
                  </h1>
                  <p className="text-sm font-bold text-[#f26315] font-mono">
                    {roomData.roomName} • {roomData.students.length} Séminaristes
                  </p>
                </div>

                {/* Tableau officiel affiché sur la porte */}
                <div className="border border-black overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-black border-b border-black font-extrabold divide-x divide-black">
                        <th className="py-2 px-2 text-center w-10">N°</th>
                        <th className="py-2 px-3">Nom & Prénom</th>
                        <th className="py-2 px-2 text-center w-28">Matricule</th>
                        <th className="py-2 px-3">Sous-comité</th>
                        <th className="py-2 px-2 text-center w-24">Note Test</th>
                        <th className="py-2 px-3 text-center w-28">Émargement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-slate-900 font-sans">
                      {roomData.students.map((st, i) => (
                        <tr key={st.id || st.matricule} className="divide-x divide-black hover:bg-slate-50">
                          <td className="py-2 px-2 text-center font-bold text-slate-700">{i + 1}</td>
                          <td className="py-2 px-3 font-black text-slate-900 uppercase">
                            {st.fullName}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                            {st.matricule}
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-medium">
                            {st.subCommittee}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                            {st.entryTestScore !== undefined ? `${st.entryTestScore} / 20` : '—'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {/* Espace pour signature / émargement */}
                            <div className="h-4 border-b border-dotted border-slate-300"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bas de page avec signature */}
                <div className="pt-6 border-t border-black flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">Fait à Gagnoa, le 17 Avril 2027</p>
                    <p className="text-[10px] text-slate-500 italic">Affichage obligatoire devant la salle de cours</p>
                  </div>

                  <div className="text-center w-60 space-y-8">
                    <p className="font-bold text-slate-800">Le Responsable de la Pédagogie</p>
                    <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-600">
                      Commission Formation SERFIG 2027
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SOUS-ONGLET 4 : SUIVI DES TESTS EN LIGNE (JOUR 1) ──────── */}
      {activeTab === 'online-test' && (
        <div className="space-y-6">
          {/* Cartes statistiques temps réel du Test en ligne */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Total Séminaristes</span>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{seminaristes.length}</p>
              <span className="text-[10px] text-slate-400">Inscrits officiels</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/30">
              <span className="text-[11px] font-bold text-emerald-800 block">Tests Complétés en Ligne</span>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">
                {seminaristes.filter(p => p.entryTestScore !== undefined).length}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">
                {seminaristes.length > 0 
                  ? Math.round((seminaristes.filter(p => p.entryTestScore !== undefined).length / seminaristes.length) * 100) 
                  : 0}% de participation
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/30">
              <span className="text-[11px] font-bold text-orange-800 block">En Attente de Passage</span>
              <p className="text-2xl font-black text-orange-600 mt-0.5">
                {seminaristes.filter(p => p.entryTestScore === undefined).length}
              </p>
              <span className="text-[10px] text-orange-700">À orienter au portail</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 block">Moyenne Générale Test</span>
              <p className="text-2xl font-black text-indigo-700 mt-0.5">
                {(() => {
                  const tested = seminaristes.filter(p => p.entryTestScore !== undefined);
                  if (tested.length === 0) return '—';
                  const sum = tested.reduce((acc, curr) => acc + (curr.entryTestScore || 0), 0);
                  return (sum / tested.length).toFixed(1) + ' / 20';
                })()}
              </p>
              <span className="text-[10px] text-slate-400">Barème officiel 20 pts</span>
            </div>
          </div>

          {/* Bannière Affiche & QR Code d'Accès pour le Jour 1 */}
          <div className="bg-gradient-to-r from-[#0b5334] to-emerald-950 text-white rounded-3xl p-6 shadow-md border border-emerald-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-black uppercase">
                <QrCode className="w-4 h-4 text-emerald-300" />
                Affichage d'Accueil • Jour 1
              </div>
              <h3 className="text-xl font-black text-white">
                Portail du Test d'Entrée en Ligne pour les Séminaristes
              </h3>
              <p className="text-xs text-emerald-100/90 max-w-xl leading-relaxed">
                Le jour de l'arrivée, les séminaristes scannent le QR Code ou accèdent avec leur matricule. Ils passent le QCM sur leur smartphone, découvrent leur niveau et sont directement dirigés vers leur salle.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <code className="text-[11px] font-mono bg-black/30 px-3 py-1.5 rounded-xl text-emerald-200 border border-white/10 select-all">
                  {window.location.origin}/?test=true
                </code>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/?test=true`);
                  setSuccessMsg('Lien du test d\'entrée copié dans le presse-papier !');
                  setTimeout(() => setSuccessMsg(''), 3000);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
              >
                Copier le lien direct
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer Affiche QR Code</span>
              </button>
            </div>
          </div>

          {/* Tableau des Résultats en direct */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Résultats des Tests d'Entrée Enregistrés ({seminaristes.filter(p => p.entryTestScore !== undefined).length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Notes enregistrées en temps réel dans Supabase.
                </p>
              </div>

              {/* Recherche */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrer un candidat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {seminaristes
                .filter(p => {
                  if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    return p.fullName.toLowerCase().includes(q) || p.matricule.toLowerCase().includes(q) || p.subCommittee.toLowerCase().includes(q);
                  }
                  return true;
                })
                .map(p => {
                  const hasPassed = p.entryTestScore !== undefined && p.entryTestScore !== null;
                  const score = p.entryTestScore || 0;
                  const level = p.assignedLevel || (p.isExecutiveMember ? 'Responsable de Base' : score >= 14 ? 'Niveau 3' : score >= 10 ? 'Niveau 2' : 'Niveau 1');
                  const room = p.assignedRoom || 'Non affecté';

                  return (
                    <div key={p.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          hasPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {hasPassed ? '✓' : '⏳'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900">{p.fullName}</span>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {p.matricule}
                            </span>
                            {p.isExecutiveMember && (
                              <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                                Membre de bureau
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {p.subCommittee}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                        {hasPassed ? (
                          <>
                            <div className="text-right">
                              <span className="text-base font-black text-amber-600 font-mono">
                                {score.toFixed(score % 1 === 0 ? 0 : 1)} / 20
                              </span>
                              <span className="text-[10px] text-slate-400 block">Note obtenue</span>
                            </div>

                            <div className="text-right">
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-800 block">
                                {level}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                📍 {room}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleScoreChange(p, 0);
                                updateParticipantStatus(p.id, {
                                  entryTestScore: undefined,
                                  entryTestPassedAt: undefined
                                });
                                setSuccessMsg(`Test réinitialisé pour ${p.fullName}.`);
                                setTimeout(() => setSuccessMsg(''), 3000);
                              }}
                              className="text-[10px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                              title="Réinitialiser pour permettre un repassage"
                            >
                              Réinitialiser
                            </button>
                          </>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold">
                            En attente de passage
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
