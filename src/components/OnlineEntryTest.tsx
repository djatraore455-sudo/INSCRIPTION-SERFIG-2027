import React, { useState, useEffect } from 'react';
import { Participant, SeminarConfig } from '../types';
import { 
  ENTRY_TEST_QUESTIONS, 
  ENTRY_TEST_SECTIONS, 
  TestQuestion, 
  calculateScore 
} from '../data/entryTestQuestions';
import { updateParticipantStatus } from '../services/storage';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight, 
  FileText, 
  IdCard, 
  Sparkles,
  Lock,
  RotateCcw,
  Info
} from 'lucide-react';

interface OnlineEntryTestProps {
  participant: Participant;
  config: SeminarConfig;
  onTestCompleted: (updatedParticipant: Participant) => void;
  onViewBulletin?: () => void;
  onViewBadge?: () => void;
}

export const OnlineEntryTest: React.FC<OnlineEntryTestProps> = ({
  participant,
  config,
  onTestCompleted,
  onViewBulletin,
  onViewBadge
}) => {
  // Vérifier si le test a déjà été passé
  const hasAlreadyPassed = participant.entryTestScore !== undefined && participant.entryTestScore !== null;

  // États du QCM
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showDetailedCorrection, setShowDetailedCorrection] = useState<boolean>(false);

  // Chronomètre (25 minutes par défaut)
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerActive, setTimerActive] = useState<boolean>(!hasAlreadyPassed);

  useEffect(() => {
    if (!timerActive || hasAlreadyPassed) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, hasAlreadyPassed]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (question: TestQuestion, optionIndex: number) => {
    if (hasAlreadyPassed) return;

    if (question.type === 'single') {
      setAnswers(prev => ({
        ...prev,
        [question.id]: [optionIndex]
      }));
    } else {
      // Multiple choices
      setAnswers(prev => {
        const current = prev[question.id] || [];
        const exists = current.includes(optionIndex);
        const updated = exists 
          ? current.filter(idx => idx !== optionIndex)
          : [...current, optionIndex];
        return {
          ...prev,
          [question.id]: updated
        };
      });
    }
  };

  // Calcul du nombre de questions répondues
  const answeredCount = Object.keys(answers).filter(qId => (answers[qId] || []).length > 0).length;
  const totalQuestions = ENTRY_TEST_QUESTIONS.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  // Soumission et enregistrement du test
  const handleSubmitTest = () => {
    setIsSubmitting(true);
    setTimerActive(false);

    const result = calculateScore(answers);
    const totalScore = result.totalScore;

    // Déterminer le niveau pédagogique
    let targetLevel = 'Niveau 1';
    if (participant.isExecutiveMember) {
      targetLevel = 'Responsable de Base';
    } else if (totalScore >= 14) {
      targetLevel = 'Niveau 3';
    } else if (totalScore >= 10) {
      targetLevel = 'Niveau 2';
    } else {
      targetLevel = 'Niveau 1';
    }

    const assignedRoom = participant.assignedRoom || 
      (targetLevel === 'Responsable de Base' ? 'Amphithéâtre (Leadership)' : 
       targetLevel === 'Niveau 3' ? 'Salle 03' : 
       targetLevel === 'Niveau 2' ? 'Salle 02' : 'Salle 01');

    const updatedParticipant: Participant = {
      ...participant,
      entryTestScore: totalScore,
      entryTestPassedAt: new Date().toISOString(),
      assignedLevel: targetLevel,
      assignedClass: participant.assignedClass || targetLevel,
      assignedRoom,
      grades: {
        ...(participant.grades || {}),
        entryTest: totalScore,
        entryTestCoeff: 1,
        currentLevel: targetLevel,
        isPublished: true
      }
    };

    // Mettre à jour Supabase et LocalStorage
    updateParticipantStatus(participant.id, {
      entryTestScore: totalScore,
      entryTestPassedAt: updatedParticipant.entryTestPassedAt,
      assignedLevel: targetLevel,
      assignedClass: updatedParticipant.assignedClass,
      assignedRoom: updatedParticipant.assignedRoom,
      grades: updatedParticipant.grades
    });

    onTestCompleted(updatedParticipant);
    setIsSubmitting(false);
    setShowConfirmModal(false);
  };

  const activeSection = ENTRY_TEST_SECTIONS[activeSectionIndex];
  const sectionQuestions = ENTRY_TEST_QUESTIONS.filter(q => q.section === activeSection.id);

  // ─────────────────────────────────────────────────────────────────────────────
  // VUE 1 : RÉSULTATS DU TEST (SI LE SÉMINARISTE A DÉJÀ PASSÉ LE TEST)
  // ─────────────────────────────────────────────────────────────────────────────
  if (hasAlreadyPassed) {
    const score = participant.entryTestScore || 0;
    const isExecutive = participant.isExecutiveMember;
    const level = participant.assignedLevel || (isExecutive ? 'Responsable de Base' : score >= 14 ? 'Niveau 3' : score >= 10 ? 'Niveau 2' : 'Niveau 1');
    const room = participant.assignedRoom || 'Salle de cours';

    const getMention = (s: number) => {
      if (s >= 16) return { text: 'Très Bien', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
      if (s >= 14) return { text: 'Bien', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
      if (s >= 12) return { text: 'Assez Bien', color: 'text-blue-700 bg-blue-100 border-blue-300' };
      if (s >= 10) return { text: 'Passable', color: 'text-amber-800 bg-amber-100 border-amber-300' };
      return { text: 'À renforcer', color: 'text-orange-800 bg-orange-100 border-orange-300' };
    };

    const mention = getMention(score);

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Carte Principale de Résultat */}
        <div className="bg-gradient-to-br from-[#0b5334] via-[#084128] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner">
              <Award className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>

            <div>
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Test d'Entrée Validé & Enregistré
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Résultat de {participant.fullName}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                Matricule : <span className="font-mono font-bold text-white">{participant.matricule}</span> • {participant.subCommittee}
              </p>
            </div>

            {/* Note géante */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-5 flex flex-col items-center shadow-lg my-2">
              <span className="text-xs uppercase font-extrabold text-emerald-200 tracking-wider">Note Obtenue</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-5xl sm:text-6xl font-black text-amber-300">
                  {score.toFixed(score % 1 === 0 ? 0 : 1)}
                </span>
                <span className="text-2xl font-bold text-white/70">/ 20</span>
              </div>
              <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-black border ${mention.color}`}>
                Mention : {mention.text}
              </span>
            </div>

            {/* Cadre d'Orientation Officielle */}
            <div className="w-full bg-white text-slate-800 rounded-2xl p-5 shadow-lg border-2 border-amber-400 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Niveau d'Affectation Pédagogique
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm shrink-0">
                    📚
                  </div>
                  <span className="text-lg font-black text-orange-700">
                    {level.toUpperCase()}
                  </span>
                </div>
                {isExecutive && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                    👑 Règle spéciale Membre du Bureau
                  </span>
                )}
              </div>

              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                  Salle de Cours Assignée
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                    📍
                  </div>
                  <span className="text-lg font-black text-emerald-800">
                    {room}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Consultez la fiche d'affichage sur la porte de votre salle.
                </span>
              </div>
            </div>

            {/* Boutons d'Action Rapides */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 w-full">
              {onViewBulletin && (
                <button
                  onClick={onViewBulletin}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Consulter mon Bulletin de Note Officiel</span>
                </button>
              )}

              {onViewBadge && (
                <button
                  onClick={onViewBadge}
                  className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all border border-white/30 flex items-center gap-2 cursor-pointer"
                >
                  <IdCard className="w-4 h-4" />
                  <span>Voir mon Badge avec mon Niveau</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Détail des Questions & Corrigé Pédagogique */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-700" />
              <h3 className="font-black text-slate-900 text-base">
                Corrigé Pédagogique du Test (20 Points)
              </h3>
            </div>
            <button
              onClick={() => setShowDetailedCorrection(!showDetailedCorrection)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer underline"
            >
              {showDetailedCorrection ? 'Masquer le corrigé' : 'Afficher les explications'}
            </button>
          </div>

          {showDetailedCorrection && (
            <div className="space-y-4 pt-2 divide-y divide-slate-100">
              {ENTRY_TEST_QUESTIONS.map((q, idx) => {
                const userChoice = answers[q.id];
                return (
                  <div key={q.id} className="pt-4 first:pt-0 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-black text-slate-800">
                        Q{idx + 1}. {q.questionText}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                        {q.points} pt{q.points > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-1 pl-2">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswers.includes(oIdx);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg flex items-center gap-2 font-medium ${
                              isCorrect 
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold'
                                : 'text-slate-600'
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 border">
                              {isCorrect ? '✓' : oIdx + 1}
                            </span>
                            <span>{opt}</span>
                            {isCorrect && (
                              <span className="ml-auto text-[10px] font-black uppercase text-emerald-700">
                                Bonne réponse
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p><strong>Explication :</strong> {q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VUE 2 : QUESTIONNAIRE EN COURS DE PASSAGE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      
      {/* Barre d'en-tête du Test : Identité, Chronomètre & Avancement */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-2 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0b5334] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
            QCM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Test d'Entrée & Positionnement SERFIG
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black">
                20 Points
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Candidat : <strong className="text-slate-800">{participant.fullName}</strong> ({participant.matricule})
            </p>
          </div>
        </div>

        {/* Chronomètre & Statut */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 font-mono font-bold text-xs">
            <Clock className="w-4 h-4 text-orange-600 animate-pulse" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <span className="text-xs font-bold text-slate-500">
            {answeredCount} / {totalQuestions} répondues
          </span>
        </div>
      </div>

      {/* Barre de Progression */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Onglets des 3 Sections */}
      <div className="grid grid-cols-3 gap-2">
        {ENTRY_TEST_SECTIONS.map((sec, sIdx) => {
          const isCurrent = sIdx === activeSectionIndex;
          const questionsInSec = ENTRY_TEST_QUESTIONS.filter(q => q.section === sec.id);
          const answeredInSec = questionsInSec.filter(q => (answers[q.id] || []).length > 0).length;
          const isComplete = answeredInSec === questionsInSec.length;

          return (
            <button
              key={sec.id}
              onClick={() => setActiveSectionIndex(sIdx)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                isCurrent 
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase ${isCurrent ? 'text-emerald-200' : 'text-slate-400'}`}>
                  Section {sIdx + 1}
                </span>
                {isComplete && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-300' : 'text-emerald-600'}`} />
                )}
              </div>
              <h4 className="font-extrabold text-xs sm:text-sm mt-0.5 truncate">
                {sec.title.split('—')[0]}
              </h4>
              <span className={`text-[10px] block mt-0.5 ${isCurrent ? 'text-emerald-200' : 'text-slate-500'}`}>
                {answeredInSec}/{questionsInSec.length} ({sec.totalPoints} pts)
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste des Questions de la Section Active */}
      <div className="space-y-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="font-black text-emerald-950 text-sm">
              {activeSection.title}
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Sélectionnez la ou les bonnes réponses selon l'intitulé de la question.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-xs">
            {activeSection.totalPoints} Points
          </span>
        </div>

        {sectionQuestions.map((q) => {
          const selected = answers[q.id] || [];

          return (
            <div 
              key={q.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 transition-all hover:border-slate-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {q.questionNumber}
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm leading-snug">
                      {q.questionText}
                    </h5>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">
                      {q.type === 'multiple' ? 'Plusieurs réponses possibles (Cases à cocher)' : 'Une seule réponse possible'}
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 font-bold text-[11px] shrink-0 border border-orange-200">
                  {q.points} pt{q.points > 1 ? 's' : ''}
                </span>
              </div>

              {/* Options de réponses */}
              <div className="space-y-2 pt-1 pl-8">
                {q.options.map((option, optIdx) => {
                  const isChecked = selected.includes(optIdx);

                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(q, optIdx)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-${q.type === 'multiple' ? 'md' : 'full'} border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="flex-1">{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Bas de Page : Précédent, Suivant & Valider */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveSectionIndex(prev => Math.max(0, prev - 1))}
          disabled={activeSectionIndex === 0}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Section Précédente</span>
        </button>

        {activeSectionIndex < ENTRY_TEST_SECTIONS.length - 1 ? (
          <button
            type="button"
            onClick={() => setActiveSectionIndex(prev => Math.min(ENTRY_TEST_SECTIONS.length - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Section Suivante</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 animate-pulse"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terminer & Soumettre le Test</span>
          </button>
        )}
      </div>

      {/* Modal de Confirmation avant Soumission Définitive */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Confirmer la soumission définitive ?
              </h3>
              <p className="text-xs text-slate-500">
                Vous avez répondu à <strong className="text-slate-800">{answeredCount} questions sur {totalQuestions}</strong>.
                {answeredCount < totalQuestions && (
                  <span className="block text-amber-700 font-bold mt-1">
                    ⚠️ Attention : {totalQuestions - answeredCount} question(s) sont restée(s) sans réponse !
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <p>• Votre note / 20 sera calculée immédiatement.</p>
              <p>• Votre niveau pédagogique et votre salle vous seront attribués.</p>
              <p>• Le test est verrouillé à 1 seule tentative par matricule.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Vérifier mes réponses
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitTest}
                className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Calcul en cours...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Oui, valider !</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
