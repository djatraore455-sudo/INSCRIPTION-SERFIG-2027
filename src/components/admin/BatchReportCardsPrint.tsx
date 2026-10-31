import React, { useState, useMemo } from 'react';
import { Participant, SeminarConfig } from '../../types';
import { SeminaristReportCard } from '../SeminaristReportCard';
import { Printer, Download, Filter, Search, ArrowLeft, CheckSquare, Sparkles } from 'lucide-react';

interface BatchReportCardsPrintProps {
  participants: Participant[];
  config: SeminarConfig;
  onBack: () => void;
  onEditParticipantGrades?: (participant: Participant) => void;
}

export const BatchReportCardsPrint: React.FC<BatchReportCardsPrintProps> = ({
  participants,
  config,
  onBack,
  onEditParticipantGrades
}) => {
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Uniquement les participants de type 'seminariste'
  const seminaristes = useMemo(() => {
    return participants.filter(p => p.type === 'seminariste');
  }, [participants]);

  // Filtrage selon les critères
  const filteredSeminaristes = useMemo(() => {
    return seminaristes.filter(p => {
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;
      if (filterLevel !== 'all') {
        const level = p.grades?.currentLevel || p.schoolLevel || 'Niveau 1';
        if (level !== filterLevel) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.fullName.toLowerCase().includes(q) || p.matricule.toLowerCase().includes(q);
      }
      return true;
    });
  }, [seminaristes, filterSubCommittee, filterLevel, searchQuery]);

  const handlePrintBatch = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôle (Masquée à l'impression) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Impression Groupée des Bulletins de Note (SERFIG 2027)
              </h3>
              <p className="text-xs text-slate-500">
                {filteredSeminaristes.length} bulletin(s) prêt(s) pour impression ou téléchargement PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBatch}
              disabled={filteredSeminaristes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Tout le Lot ({filteredSeminaristes.length})</span>
            </button>
          </div>
        </div>

        {/* Filtres de sélection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom ou matricule..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div>
            <select
              value={filterSubCommittee}
              onChange={e => setFilterSubCommittee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">Tous les sous-comités ({seminaristes.length})</option>
              {config.subCommittees.map(sc => (
                <option key={sc.id} value={sc.name}>{sc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              <option value="all">Tous les niveaux</option>
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

      {/* Liste des bulletins à imprimer */}
      {filteredSeminaristes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs print:hidden">
          Aucun séminariste ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div className="space-y-10">
          {filteredSeminaristes.map((participant, index) => (
            <div
              key={participant.id || participant.matricule}
              className="break-after-page page-break-always"
              style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
            >
              <SeminaristReportCard
                participant={participant}
                config={config}
                onEditGrades={onEditParticipantGrades}
                showActions={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
