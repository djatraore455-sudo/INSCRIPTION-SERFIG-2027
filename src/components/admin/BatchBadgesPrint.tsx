import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { Participant, SeminarConfig } from '../../types';
import { AeemciLogo } from '../AeemciLogo';
import { calculateAge } from '../../services/storage';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  Filter, 
  Search, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  User, 
  QrCode as QrIcon, 
  Sparkles,
  Layers,
  FileText,
  Scissors
} from 'lucide-react';

interface BatchBadgesPrintProps {
  participants: Participant[];
  config: SeminarConfig;
  onBack: () => void;
  initialSelectedId?: string; // Pour imprimer directement un retardataire
}

// Composant Badge Compact optimisé pour la grille 4 par feuille A4 (format A6 ~ 96mm x 136mm)
const EconomicBadgeItem: React.FC<{
  participant: Participant;
  config: SeminarConfig;
}> = ({ participant, config }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(participant.matricule || '', {
      width: 140,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' }
    })
      .then(url => setQrUrl(url))
      .catch(() => {});
  }, [participant.matricule]);

  const getRoleHeaderColor = () => {
    switch (participant.type) {
      case 'formateur': return 'from-blue-700 to-indigo-900 border-blue-500';
      case 'commission': return 'from-orange-600 to-amber-800 border-orange-500';
      default: return 'from-emerald-700 to-teal-950 border-emerald-500';
    }
  };

  const getRoleBadgeTitle = () => {
    switch (participant.type) {
      case 'formateur': return participant.trainerSubtype === 'aine' ? "AÎNÉ AEEMCI" : 'FORMATEUR';
      case 'commission': return `COMMISSION ${(participant.commission || 'ORGANISATION').toUpperCase()}`;
      default: return 'SÉMINARISTE';
    }
  };

  const currentLevel = participant.assignedClass || participant.assignedLevel || (participant.isExecutiveMember ? 'Responsable de Base' : 'Niveau 1');

  return (
    <div className="economic-badge-card w-full h-[138mm] max-h-[138mm] bg-white rounded-2xl border-2 border-emerald-900 overflow-hidden relative flex flex-col justify-between text-slate-800 shadow-sm print:shadow-none select-none">
      
      {/* Repère de perforation pour cordon / lanière */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-200 rounded-full border border-slate-300 z-20 flex items-center justify-center">
        <div className="w-6 h-1 bg-slate-400 rounded-full"></div>
      </div>

      {/* En-tête officiel AEEMCI */}
      <div className={`pt-4 pb-2 px-3 bg-gradient-to-r ${getRoleHeaderColor()} text-white text-center relative border-b shrink-0`}>
        <div className="flex items-center justify-between gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-xs shrink-0 flex items-center justify-center">
            <AeemciLogo size="sm" src={config.logoUrl} />
          </div>
          <div className="flex-1 text-center min-w-0">
            <span className="text-[8px] tracking-wider uppercase font-black text-orange-300 block truncate">
              AEEMCI • RÉGION DU GÔH
            </span>
            <h3 className="font-black text-xs tracking-tight text-white leading-tight truncate">
              {config.editionName}
            </h3>
            <p className="text-[7.5px] text-emerald-100 font-medium truncate">{config.location.city} • 2027</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-black text-[8px] shrink-0">
            {config.durationDays}J
          </div>
        </div>
      </div>

      {/* Ruban Rôle */}
      <div className={`py-1 px-2 text-center font-black tracking-wider text-[9px] uppercase shrink-0 shadow-inner ${
        participant.type === 'formateur' 
          ? 'bg-blue-600 text-white' 
          : participant.type === 'commission'
            ? 'bg-orange-500 text-white'
            : 'bg-emerald-600 text-white'
      }`}>
        {getRoleBadgeTitle()}
      </div>

      {/* Corps du Badge */}
      <div className="px-3 py-2 flex-1 flex flex-col items-center justify-between text-center bg-radial from-emerald-50/40 via-white to-slate-50 min-h-0">
        
        {/* Photo et Genre */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-emerald-600 shadow-xs bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center overflow-hidden">
            {participant.photoUrl ? (
              <img src={participant.photoUrl} alt={participant.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-emerald-700" />
            )}
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-black px-2 py-0.2 rounded-full bg-slate-900 text-white shadow-2xs">
            {participant.gender === 'homme' ? 'Frère' : 'Sœur'}
          </span>
        </div>

        {/* Nom & Sous-comité */}
        <div className="space-y-0.5 my-1">
          <h2 className="text-xs font-black text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
            {participant.fullName}
          </h2>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[9px] font-bold">
            <span>📍</span>
            <span className="truncate max-w-[130px]">{participant.subCommittee}</span>
          </div>
        </div>

        {/* Niveau Pédagogique & Salle Attribuée */}
        {participant.type === 'seminariste' && (
          <div className="w-full py-1 px-2 rounded-lg bg-orange-50 border border-orange-300 text-orange-950 flex items-center justify-between text-[9px] font-black shrink-0">
            <span className="text-orange-700 uppercase">NIVEAU :</span>
            <span className="font-mono text-orange-950">{currentLevel}</span>
            {participant.assignedRoom && (
              <span className="text-emerald-800 border-l border-orange-200 pl-1 font-bold">
                📍 {participant.assignedRoom.replace('Salle ', 'S.')}
              </span>
            )}
          </div>
        )}

        {participant.isExecutiveMember && (
          <div className="text-[8px] font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 shrink-0 truncate max-w-full">
            ⭐ Membre Bureau {participant.executiveRole ? `• ${participant.executiveRole}` : ''}
          </div>
        )}

        {/* Bloc QR Code & Matricule */}
        <div className="w-full p-1.5 bg-white rounded-xl border border-dashed border-emerald-300 flex items-center justify-between gap-2 shadow-2xs shrink-0">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-emerald-100">
            {qrUrl ? (
              <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
            ) : (
              <QrIcon className="w-6 h-6 text-emerald-600 animate-pulse" />
            )}
          </div>

          <div className="flex-1 text-left min-w-0">
            <span className="text-[7.5px] uppercase font-bold text-slate-400 block">Matricule</span>
            <span className="text-[11px] font-mono font-black text-emerald-900 tracking-tight block truncate">
              {participant.matricule}
            </span>
            <span className={`inline-block text-[7.5px] font-black px-1.5 py-0.2 rounded ${
              participant.paymentStatus === 'paye' || participant.paymentStatus === 'gratuit'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-orange-100 text-orange-800'
            }`}>
              {participant.paymentStatus === 'paye' ? '✓ Payé' : participant.paymentStatus === 'gratuit' ? '✓ Gratuit' : '⏳ En attente'}
            </span>
          </div>
        </div>

        {/* Sceau de conformité */}
        <div className="w-full flex items-center justify-between text-[7px] text-slate-500 pt-0.5 border-t border-slate-100 shrink-0">
          <span className="font-bold text-emerald-800 flex items-center gap-0.5">
            <ShieldCheck className="w-2.5 h-2.5" /> Sceau Officiel
          </span>
          <span className="truncate">{config.displayDates}</span>
        </div>
      </div>

      {/* Pied de page Code-barres */}
      <div className="bg-slate-900 text-white px-2 py-1 flex items-center justify-between text-[7px] font-mono shrink-0">
        <span className="tracking-widest">||| | |||| | || |||</span>
        <span className="text-slate-400">SERFIG 2027</span>
      </div>
    </div>
  );
};

export const BatchBadgesPrint: React.FC<BatchBadgesPrintProps> = ({
  participants,
  config,
  onBack,
  initialSelectedId
}) => {
  // Mode : 'four_per_page' (4 par feuille RAM A4) ou 'single' (badge unitaire retardataire)
  const [printLayout, setPrintLayout] = useState<'four_per_page' | 'single'>(
    initialSelectedId ? 'single' : 'four_per_page'
  );

  // Filtres
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSingleParticipantId, setSelectedSingleParticipantId] = useState<string>(
    initialSelectedId || ''
  );

  // Filtrage des participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;
      if (filterPayment !== 'all' && p.paymentStatus !== filterPayment) return false;
      if (filterLevel !== 'all') {
        const lvl = p.assignedClass || p.assignedLevel || (p.isExecutiveMember ? 'Responsable de Base' : 'Niveau 1');
        if (!lvl.includes(filterLevel)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.fullName.toLowerCase().includes(q) || p.matricule.toLowerCase().includes(q);
      }
      return true;
    });
  }, [participants, filterType, filterSubCommittee, filterLevel, filterPayment, searchQuery]);

  // Si mode individuel, retrouver le participant sélectionné
  const singleParticipant = useMemo(() => {
    if (selectedSingleParticipantId) {
      return participants.find(p => p.id === selectedSingleParticipantId || p.matricule === selectedSingleParticipantId);
    }
    return filteredParticipants[0] || participants[0];
  }, [participants, selectedSingleParticipantId, filteredParticipants]);

  // Découpage en groupes de 4 badges par feuille A4
  const badgePages = useMemo(() => {
    const pages: Participant[][] = [];
    for (let i = 0; i < filteredParticipants.length; i += 4) {
      pages.push(filteredParticipants.slice(i, i + 4));
    }
    return pages;
  }, [filteredParticipants]);

  const totalSheetsNeeded = badgePages.length;
  const paperSheetsSaved = Math.max(0, filteredParticipants.length - totalSheetsNeeded);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* ─── BARRE DE CONTRÔLE SUPÉRIEURE (Masquée à l'impression) ───── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Retourner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Impression des Badges Officiels SERFIG 2027
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Économique & PDF
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Imprimez 4 badges par feuille RAM A4 ou un badge individuel pour un retardataire inscrit sur place.
              </p>
            </div>
          </div>

          {/* Bouton d'impression principal */}
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-2xl bg-[#0b5334] hover:bg-emerald-900 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimer / Télécharger en PDF</span>
          </button>
        </div>

        {/* Sélecteur de Mode : 4 par page VS Individuel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setPrintLayout('four_per_page')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                printLayout === 'four_per_page'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>4 Badges par Feuille A4 (Économique)</span>
            </button>

            <button
              onClick={() => setPrintLayout('single')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                printLayout === 'single'
                  ? 'bg-white text-orange-950 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-orange-600" />
              <span>Badge Individuel (Retardataire)</span>
            </button>
          </div>

          {/* Synthèse Économique du Papier RAM */}
          {printLayout === 'four_per_page' && (
            <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-900 px-3.5 py-2 rounded-xl border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {filteredParticipants.length} badge(s) = <strong>{totalSheetsNeeded} feuille(s) RAM A4</strong> ({paperSheetsSaved} feuilles économisées ! -75%)
              </span>
            </div>
          )}
        </div>

        {/* Filtres & Recherche */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher nom, matricule..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 font-medium"
            />
          </div>

          {/* Filtre Type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">Tous les types ({participants.length})</option>
            <option value="seminariste">Séminaristes uniquement</option>
            <option value="formateur">Formateurs uniquement</option>
            <option value="commission">Commissions uniquement</option>
          </select>

          {/* Filtre Niveau */}
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">Tous les niveaux pédagogiques</option>
            <option value="Niveau 1">Niveau 1</option>
            <option value="Niveau 2">Niveau 2</option>
            <option value="Niveau 3">Niveau 3</option>
            <option value="Responsable de Base">Responsable de Base</option>
          </select>

          {/* Filtre Sous-comité */}
          <select
            value={filterSubCommittee}
            onChange={e => setFilterSubCommittee(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">Tous les sous-comités</option>
            {config.subCommittees.map(sc => {
              const scName = typeof sc === 'string' ? sc : sc.name;
              return (
                <option key={scName} value={scName}>{scName}</option>
              );
            })}
          </select>
        </div>

        {/* Sélecteur de candidat si mode individuel */}
        {printLayout === 'single' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-bold text-orange-900">
              Choisir le participant retardataire à imprimer :
            </span>
            <select
              value={selectedSingleParticipantId || (singleParticipant?.id || '')}
              onChange={e => setSelectedSingleParticipantId(e.target.value)}
              className="flex-1 max-w-md px-3 py-1.5 bg-white border border-orange-300 rounded-xl font-bold text-slate-800 text-xs"
            >
              {filteredParticipants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.matricule}) — {p.subCommittee} [{p.assignedLevel || 'Niveau 1'}]
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-center gap-2">
          <span>💡 <strong>Astuce Téléchargement PDF :</strong> Cliquez sur <strong>« Imprimer »</strong> puis dans la destination de votre imprimante, sélectionnez <strong>« Enregistrer au format PDF »</strong> pour créer le fichier numérique.</span>
        </div>
      </div>

      {/* ─── VUE 1 : PLANCHE ÉCONOMIQUE (4 BADGES PAR FEUILLE A4) ────── */}
      {printLayout === 'four_per_page' && (
        <div className="batch-badges-container space-y-8">
          {badgePages.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
              Aucun participant ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            badgePages.map((pageGroup, pageIndex) => (
              <div
                key={pageIndex}
                className="a4-badge-sheet bg-white p-4 sm:p-6 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none print:m-0 print:p-0 max-w-[210mm] mx-auto min-h-[297mm] flex flex-col justify-between"
                style={{
                  pageBreakAfter: pageIndex < badgePages.length - 1 ? 'always' : 'auto',
                  breakAfter: pageIndex < badgePages.length - 1 ? 'page' : 'auto'
                }}
              >
                {/* En-tête de planche (visible à l'écran, discret ou masqué au massicotage) */}
                <div className="text-[10px] text-slate-400 font-mono pb-2 mb-2 border-b border-dashed border-slate-300 flex items-center justify-between print:text-[8px] print:pb-1 print:mb-1">
                  <span>SERFIG 2027 • PLANCHE BADGES #{pageIndex + 1} / {totalSheetsNeeded}</span>
                  <span className="flex items-center gap-1 font-sans text-slate-500">
                    <Scissors className="w-3 h-3" /> Découper selon les lignes de coupe
                  </span>
                </div>

                {/* Grille 2 x 2 de 4 Badges */}
                <div className="grid grid-cols-2 gap-4 print:gap-3 flex-1 items-stretch">
                  {pageGroup.map((participant) => (
                    <div key={participant.id} className="relative p-1">
                      <EconomicBadgeItem participant={participant} config={config} />
                      {/* Repères de coupe en pointillés */}
                      <div className="absolute inset-0 border border-dashed border-slate-300 pointer-events-none rounded-2xl"></div>
                    </div>
                  ))}

                  {/* Si la dernière page a moins de 4 badges, emplacements vides propres */}
                  {Array.from({ length: 4 - pageGroup.length }).map((_, emptyIdx) => (
                    <div 
                      key={`empty-${emptyIdx}`} 
                      className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 text-xs p-4"
                    >
                      <span>Emplacement badge libre</span>
                    </div>
                  ))}
                </div>

                {/* Pied de planche */}
                <div className="text-[9px] text-slate-400 text-center pt-2 mt-2 border-t border-dashed border-slate-300 print:text-[7px]">
                  AEEMCI Région du Gôh • Format A6 Plastification Standard (4 badges / feuille RAM A4)
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── VUE 2 : BADGE INDIVIDUEL RETARDATAIRE ────────────────────── */}
      {printLayout === 'single' && singleParticipant && (
        <div className="single-badge-container max-w-sm mx-auto bg-white p-6 rounded-3xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0">
          <div className="text-center mb-4 print:hidden">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-black uppercase">
              Impression Unitaire Retardataire
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Imprimez immédiatement ce badge individuel après inscription sur place et test en ligne.
            </p>
          </div>

          <div className="max-w-[96mm] mx-auto">
            <EconomicBadgeItem participant={singleParticipant} config={config} />
          </div>

          <div className="mt-4 text-center text-xs text-slate-400 print:hidden">
            Taille conforme pour pochette plastifiée avec lanière de cou.
          </div>
        </div>
      )}

    </div>
  );
};
