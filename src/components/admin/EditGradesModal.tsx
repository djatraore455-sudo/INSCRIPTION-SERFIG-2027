import React, { useState } from 'react';
import { Participant, ParticipantGrades } from '../../types';
import { X, Save, Calculator, Award, CheckCircle } from 'lucide-react';

interface EditGradesModalProps {
  participant: Participant;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedGrades: ParticipantGrades) => void;
}

export const EditGradesModal: React.FC<EditGradesModalProps> = ({
  participant,
  isOpen,
  onClose,
  onSave
}) => {
  const existing = participant.grades || {};

  const [entryTest, setEntryTest] = useState<number>(existing.entryTest ?? 14);
  const [entryCoeff, setEntryCoeff] = useState<number>(existing.entryTestCoeff ?? 1);

  const [exitTest, setExitTest] = useState<number>(existing.exitTest ?? 15.5);
  const [exitCoeff, setExitCoeff] = useState<number>(existing.exitTestCoeff ?? 2);

  const [conduct, setConduct] = useState<number>(existing.conduct ?? 17);
  const [conductCoeff, setConductCoeff] = useState<number>(existing.conductCoeff ?? 1);

  const [currentLevel, setCurrentLevel] = useState<string>(existing.currentLevel || participant.schoolLevel || 'Niveau 1');
  const [targetLevel, setTargetLevel] = useState<string>(existing.targetLevel || 'Niveau 2');

  const [rank, setRank] = useState<number>(existing.rank ?? 1);
  const [totalRanked, setTotalRanked] = useState<number>(existing.totalRanked ?? 45);

  const [isAutoMention, setIsAutoMention] = useState<boolean>(!existing.mention);
  const [customMention, setCustomMention] = useState<string>(existing.mention || '');

  const [isAutoDecision, setIsAutoDecision] = useState<boolean>(!existing.decision);
  const [customDecision, setCustomDecision] = useState<string>(existing.decision || '');

  const [date, setDate] = useState<string>(existing.date || '22 Avril 2027');
  const [isPublished, setIsPublished] = useState<boolean>(existing.isPublished ?? true);

  if (!isOpen) return null;

  // Calculs en temps réel
  const totalCoeff = entryCoeff + exitCoeff + conductCoeff;
  const entryWeighted = entryTest * entryCoeff;
  const exitWeighted = exitTest * exitCoeff;
  const conductWeighted = conduct * conductCoeff;
  const totalWeighted = entryWeighted + exitWeighted + conductWeighted;
  const generalAverage = totalCoeff > 0 ? Number((totalWeighted / totalCoeff).toFixed(2)) : 0;

  const calculatedMention = (() => {
    if (generalAverage >= 16) return 'Très Bien';
    if (generalAverage >= 14) return 'Bien';
    if (generalAverage >= 12) return 'Assez Bien';
    if (generalAverage >= 10) return 'Passable';
    return 'Insuffisant';
  })();

  const calculatedDecision = (() => {
    if (generalAverage >= 10) {
      return `ADMIS(E) AU ${targetLevel.toUpperCase()}`;
    }
    return 'AJOURNÉ(E)';
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: ParticipantGrades = {
      entryTest,
      entryTestCoeff: entryCoeff,
      exitTest,
      exitTestCoeff: exitCoeff,
      conduct,
      conductCoeff,
      currentLevel,
      targetLevel,
      rank,
      totalRanked,
      mention: isAutoMention ? calculatedMention : customMention,
      decision: isAutoDecision ? calculatedDecision : customDecision,
      date,
      isPublished
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0b5334] to-emerald-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-base">Saisie des Notes • Bulletin SERFIG</h3>
              <p className="text-xs text-emerald-100">
                {participant.fullName} ({participant.matricule})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Niveaux & Classement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Niveau actuel du Séminariste
              </label>
              <input
                type="text"
                value={currentLevel}
                onChange={e => setCurrentLevel(e.target.value)}
                placeholder="ex: Niveau 1, Niveau 2, Débutant..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Niveau visé / RÉSULTAT
              </label>
              <input
                type="text"
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
                placeholder="ex: Niveau 2, Niveau Supérieur..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rang dans le niveau
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={rank}
                  onChange={e => setRank(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <span className="text-xs text-slate-500">sur total de</span>
                <input
                  type="number"
                  min={1}
                  value={totalRanked}
                  onChange={e => setTotalRanked(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date du document
              </label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Table des 3 Épreuves */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200">
              Grille d'évaluation pédagogique
            </div>
            
            <div className="p-4 space-y-4">
              {/* 1. Test d'entrée */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-5">
                  <span className="font-bold text-xs text-slate-900 block">Test d'entrée</span>
                  <span className="text-[11px] text-slate-500">Évaluation diagnostique initiale</span>
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Note / 20</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={entryTest}
                    onChange={e => setEntryTest(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={entryCoeff}
                    onChange={e => setEntryCoeff(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* 2. Test de Sortie */}
              <div className="grid grid-cols-12 gap-3 items-center pt-3 border-t border-slate-100">
                <div className="col-span-5">
                  <span className="font-bold text-xs text-slate-900 block">Test de Sortie</span>
                  <span className="text-[11px] text-slate-500">Examen final du séminaire</span>
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Note / 20</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={exitTest}
                    onChange={e => setExitTest(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exitCoeff}
                    onChange={e => setExitCoeff(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* 3. Conduite */}
              <div className="grid grid-cols-12 gap-3 items-center pt-3 border-t border-slate-100">
                <div className="col-span-5">
                  <span className="font-bold text-xs text-slate-900 block">Conduite</span>
                  <span className="text-[11px] text-slate-500">Discipline, prières, assiduité</span>
                </div>
                <div className="col-span-4">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Note / 20</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    value={conduct}
                    onChange={e => setConduct(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold"
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Coefficient</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={conductCoeff}
                    onChange={e => setConductCoeff(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Synthèse en direct : Total & Moyenne */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider block">
                Total Pondéré
              </span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {totalWeighted.toFixed(2)} pts <span className="text-xs font-normal text-slate-500">(Coeff : {totalCoeff})</span>
              </span>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Moyenne Générale
              </span>
              <span className="text-2xl font-black text-[#0b5334] font-mono">
                {generalAverage.toFixed(2)} / 20
              </span>
            </div>
          </div>

          {/* Décision & Mention */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Décision d'Admission</span>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoDecision}
                    onChange={e => setIsAutoDecision(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Calcul automatique ({calculatedDecision})</span>
                </label>
              </div>

              {!isAutoDecision && (
                <input
                  type="text"
                  value={customDecision}
                  onChange={e => setCustomDecision(e.target.value)}
                  placeholder="ex: ADMIS(E) AU NIVEAU SUPÉRIEUR"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Mention Pédagogique</span>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoMention}
                    onChange={e => setIsAutoMention(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Automatique ({calculatedMention})</span>
                </label>
              </div>

              {!isAutoMention && (
                <input
                  type="text"
                  value={customMention}
                  onChange={e => setCustomMention(e.target.value)}
                  placeholder="ex: Très Bien, Félicitations..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
            </div>
          </div>

          {/* Publication dans l'espace séminariste */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                Publier ce bulletin dans l'Espace Séminariste
              </span>
              <span className="text-[11px] text-emerald-700">
                Le participant pourra consulter et télécharger son bulletin depuis son compte
              </span>
            </div>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les Notes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
