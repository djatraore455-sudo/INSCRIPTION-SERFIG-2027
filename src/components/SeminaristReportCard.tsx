import React from 'react';
import { Participant, SeminarConfig } from '../types';
import { Printer, Download, Award, Edit3, Check, Sparkles } from 'lucide-react';

interface SeminaristReportCardProps {
  participant: Participant;
  config: SeminarConfig;
  onEditGrades?: (participant: Participant) => void;
  showActions?: boolean;
  className?: string;
}

export const SeminaristReportCard: React.FC<SeminaristReportCardProps> = ({
  participant,
  config,
  onEditGrades,
  showActions = true,
  className = ''
}) => {
  // Valeurs par défaut des notes si non encore saisies
  const grades = participant.grades || {};
  const entryTest = grades.entryTest ?? 14;
  const exitTest = grades.exitTest ?? 15.5;
  const conduct = grades.conduct ?? 17;

  const entryCoeff = grades.entryTestCoeff ?? 1;
  const exitCoeff = grades.exitTestCoeff ?? 2;
  const conductCoeff = grades.conductCoeff ?? 1;

  const entryWeighted = Number((entryTest * entryCoeff).toFixed(2));
  const exitWeighted = Number((exitTest * exitCoeff).toFixed(2));
  const conductWeighted = Number((conduct * conductCoeff).toFixed(2));

  const totalCoeff = entryCoeff + exitCoeff + conductCoeff;
  const totalWeighted = Number((entryWeighted + exitWeighted + conductWeighted).toFixed(2));

  const generalAverage = totalCoeff > 0 ? Number((totalWeighted / totalCoeff).toFixed(2)) : 0;

  // Calcul automatique de la mention
  const defaultMention = (() => {
    if (grades.mention) return grades.mention;
    if (generalAverage >= 16) return 'Très Bien';
    if (generalAverage >= 14) return 'Bien';
    if (generalAverage >= 12) return 'Assez Bien';
    if (generalAverage >= 10) return 'Passable';
    return 'Insuffisant';
  })();

  // Calcul automatique de la décision d'admission
  const defaultDecision = (() => {
    if (grades.decision) return grades.decision;
    if (generalAverage >= 10) {
      const target = grades.targetLevel || 'NIVEAU SUPÉRIEUR';
      return `ADMIS(E) AU ${target.toUpperCase()}`;
    }
    return 'AJOURNÉ(E)';
  })();

  const currentLevel = grades.currentLevel || participant.schoolLevel || 'Niveau 1';
  const targetLevel = grades.targetLevel || 'Niveau 2';
  const rank = grades.rank ?? 1;
  const totalRanked = grades.totalRanked ?? 45;
  const issuanceDate = grades.date || '22 Avril 2027';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre d'action supérieure (masquée lors de l'impression) */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                Bulletin Officiel • {participant.fullName}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Matricule : {participant.matricule} • {currentLevel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditGrades && (
              <button
                onClick={() => onEditGrades(participant)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                <span>Modifier les notes</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Imprimer ce Bulletin (A4)</span>
            </button>
          </div>
        </div>
      )}

      {/* Cadre du Bulletin conforme au modèle AEEMCI SERFIG 2027 */}
      <div className="max-w-[800px] mx-auto bg-white p-4 sm:p-7 border-[6px] border-[#0c4a2a] rounded-sm shadow-xl print:shadow-none print:m-0 print:p-4 print:border-[6px] print:border-[#0c4a2a] relative overflow-hidden select-text text-slate-900 font-sans">
        
        {/* Double bordure intérieure fine */}
        <div className="border-2 border-[#0c4a2a] p-3 sm:p-5 relative bg-white min-h-[960px] flex flex-col justify-between">
          
          {/* Filigrane d'arrière-plan discret */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none z-0">
            <img
              src="/assets/aistudio/1771719145696_b78691d8.png"
              alt="AEEMCI Filigrane"
              className="w-[450px] h-[450px] object-contain"
            />
          </div>

          <div className="relative z-10 space-y-4">
            
            {/* ─── EN-TÊTE VERT SOMBRE HOMOLOGUÉ ─────────────────────────── */}
            <div className="bg-[#0b5334] text-white p-3 sm:p-4 rounded-sm flex items-center gap-3 sm:gap-4 shadow-xs">
              {/* Logo AEEMCI gauche */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-1 flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                <img
                  src="/assets/aistudio/1771719145696_b78691d8.png"
                  alt="Logo AEEMCI"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Textes officiels centrés */}
              <div className="flex-1 text-center pr-2">
                <p className="text-[11px] sm:text-xs font-black tracking-widest text-white uppercase">
                  AEEMCI
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-100 uppercase">
                  SECRETARIAT RÉGIONAL DU GÔH
                </p>
                <p className="text-[9px] sm:text-[10px] font-medium text-emerald-100 tracking-wide">
                  SEMINAIRE RÉGIONAL DE FORMATION ISLAMIQUE DU GÔH (SERFIG ) 2027
                </p>

                {/* Grand Titre BULLETIN DE NOTE en Orange vif */}
                <h1 className="text-xl sm:text-3xl font-black text-[#f26315] tracking-wider uppercase font-serif mt-1 drop-shadow-xs">
                  BULLETIN DE NOTE
                </h1>

                {/* Sous-titre Niveau & Résultat */}
                <p className="text-[10px] sm:text-xs text-white/95 italic font-medium mt-0.5">
                  Niveau {currentLevel} - RESULTAT - Niveau {targetLevel}
                </p>
              </div>
            </div>

            {/* ─── BLOC IDENTITÉ DU SÉMINARISTE ──────────────────────────── */}
            <div className="flex items-center gap-4 sm:gap-6 pt-2 pb-1 px-1">
              {/* Photo du participant ou illustration placeholder officielle */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                {participant.photoUrl ? (
                  <img
                    src={participant.photoUrl}
                    alt={participant.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-100 text-slate-500 relative">
                    {/* Dessin nuage & colline identique au placeholder du modèle */}
                    <div className="w-12 h-6 bg-white/80 rounded-full mb-1 flex items-center justify-center shadow-2xs">
                      <span className="text-[10px] font-bold text-slate-400">PHOTO</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-7 bg-emerald-400/40 rounded-t-full"></div>
                  </div>
                )}
              </div>

              {/* Coordonnées académiques */}
              <div className="flex-1 space-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {participant.fullName}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-800">
                  <p>
                    <span className="font-semibold text-slate-600">Matricule : </span>
                    <span className="font-mono font-bold text-slate-900">{participant.matricule}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">Sous-comité : </span>
                    <span className="font-bold text-slate-900">{participant.subCommittee}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">Niveau : </span>
                    <span className="font-bold text-slate-900">{currentLevel}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-600">Rang : </span>
                    <span className="font-bold text-slate-900">
                      {rank} <span className="font-normal text-slate-500">/ {totalRanked}</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* ─── TABLEAU DES NOTES (CONFORME AU MODÈLE) ────────────────── */}
            <div className="overflow-hidden border-2 border-black rounded-none">
              <table className="w-full text-center border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0b5334] text-white border-b-2 border-black divide-x-2 divide-black">
                    <th className="py-2.5 px-3 text-left sm:text-center font-bold tracking-wide w-[36%]">
                      Épreuve
                    </th>
                    <th className="py-2.5 px-2 font-bold tracking-wide w-[20%]">
                      Note / 20
                    </th>
                    <th className="py-2.5 px-2 font-bold tracking-wide w-[20%]">
                      Coefficient
                    </th>
                    <th className="py-2.5 px-2 font-bold tracking-wide w-[24%]">
                      Note pondérée
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black text-slate-900">
                  {/* Ligne 1 : Test d'entrée */}
                  <tr className="divide-x-2 divide-black hover:bg-slate-50/50">
                    <td className="py-3 px-3 sm:px-4 text-left sm:text-center font-extrabold text-slate-900">
                      Test d'entrée
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {entryTest !== undefined ? entryTest.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-2 font-medium font-mono text-slate-800">
                      {entryCoeff}
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {entryWeighted.toFixed(2)}
                    </td>
                  </tr>

                  {/* Ligne 2 : Test de Sortie */}
                  <tr className="divide-x-2 divide-black hover:bg-slate-50/50">
                    <td className="py-3 px-3 sm:px-4 text-left sm:text-center font-extrabold text-slate-900">
                      Test de Sortie
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {exitTest !== undefined ? exitTest.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-2 font-medium font-mono text-slate-800">
                      {exitCoeff}
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {exitWeighted.toFixed(2)}
                    </td>
                  </tr>

                  {/* Ligne 3 : Conduite */}
                  <tr className="divide-x-2 divide-black hover:bg-slate-50/50">
                    <td className="py-3 px-3 sm:px-4 text-left sm:text-center font-extrabold text-slate-900">
                      Conduite
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {conduct !== undefined ? conduct.toFixed(1) : '—'}
                    </td>
                    <td className="py-3 px-2 font-medium font-mono text-slate-800">
                      {conductCoeff}
                    </td>
                    <td className="py-3 px-2 font-bold font-mono text-slate-900">
                      {conductWeighted.toFixed(2)}
                    </td>
                  </tr>

                  {/* Ligne 4 : TOTAL (Orange vif exact du modèle) */}
                  <tr className="bg-[#f26315] text-slate-950 font-black divide-x-2 divide-black">
                    <td className="py-2.5 px-3 sm:px-4 text-left sm:text-center uppercase tracking-wider font-extrabold text-black">
                      TOTAL
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      {/* Cellule vide ou récapitulatif */}
                      —
                    </td>
                    <td className="py-2.5 px-2 font-mono text-base font-bold text-black">
                      {totalCoeff}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-base font-black text-black">
                      {totalWeighted.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ─── BLOC MOYENNE GÉNÉRALE SUR FOND VERT TRÈS CLAIR ─────────── */}
            <div className="bg-[#eaf6ec] border border-[#a7d7b5] rounded-xl py-3 px-4 text-center space-y-1">
              <span className="text-xs sm:text-sm font-extrabold text-[#0c4a2a] uppercase tracking-wider block">
                MOYENNE GÉNÉRALE
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#0c4a2a] tracking-tight font-serif">
                {generalAverage.toFixed(2)} <span className="text-xl sm:text-2xl font-bold">/ 20</span>
              </div>
            </div>

            {/* ─── MENTION & DÉCISION D'ADMISSION ────────────────────────── */}
            <div className="text-center space-y-3 pt-1">
              <p className="text-xs sm:text-sm text-slate-800">
                <span className="font-medium text-slate-600">Mention : </span>
                <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                  {defaultMention}
                </span>
              </p>

              {/* Boîte Décision d'Admission avec cadre vert épais et texte orange */}
              <div className="inline-block border-[3.5px] border-[#0c4a2a] rounded-2xl px-6 sm:px-12 py-2.5 sm:py-3 bg-white shadow-xs max-w-full">
                <span className="text-base sm:text-xl font-black text-[#f26315] uppercase tracking-wide drop-shadow-2xs">
                  {defaultDecision}
                </span>
              </div>
            </div>

          </div>

          {/* ─── PIED DE PAGE : LIEU, DATE, DEVISE ET SIGNATURE ────────── */}
          <div className="pt-8 border-t border-slate-200 mt-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {/* Gauche : Fait à Gagnoa */}
            <div className="text-left w-full sm:w-auto">
              <p className="font-medium text-slate-700">
                Fait à Gagnoa, le {issuanceDate}
              </p>
            </div>

            {/* Centre : Devise officielle AEEMCI */}
            <div className="text-center font-extrabold text-slate-900 tracking-wide text-xs sm:text-sm italic">
              AEEMCI, Pour une identité islamique !
            </div>

            {/* Droite : Signature Responsable */}
            <div className="text-center w-full sm:w-56 space-y-7">
              <div className="border-t border-slate-500 pt-1 text-[11px] font-bold text-slate-800">
                Le Responsable de la Formation
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
