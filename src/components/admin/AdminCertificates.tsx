import React, { useState, useMemo } from 'react';
import { Participant, SeminarConfig } from '../../types';
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
  Check
} from 'lucide-react';

interface AdminCertificatesProps {
  participants: Participant[];
  config: SeminarConfig;
  userEmail: string;
}

export const AdminCertificates: React.FC<AdminCertificatesProps> = ({
  participants,
  config,
  userEmail
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attestations' | 'bilan'>('attestations');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');

  // Participants éligibles aux attestations (ceux qui sont présents ou payés/gratuits)
  const eligibleParticipants = useMemo(() => {
    return participants.filter(p => {
      // Priorité à ceux qui ont pointé ou payé
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sélecteur de sous-onglets */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attestations & Bilan Final (Phase 2)</h2>
            <p className="text-xs text-slate-500">
              Génération des attestations officielles avec QR code et bilan statistique complet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveSubTab('attestations'); setSelectedParticipant(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'attestations'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Attestations de Présence
          </button>
          <button
            onClick={() => setActiveSubTab('bilan')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'bilan'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bilan Final du Séminaire
          </button>
        </div>
      </div>

      {/* ─── VUE 1 : ATTESTATIONS DE PARTICIPATION ───────────────────── */}
      {activeSubTab === 'attestations' && !selectedParticipant && (
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
                    onClick={() => setSelectedParticipant(p)}
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
      {activeSubTab === 'attestations' && selectedParticipant && (
        <div className="space-y-4">
          <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedParticipant(null)}
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
                  {selectedParticipant.subCommittee}
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
                N° Certificat : ATT-SERFIG-2027-{selectedParticipant.matricule}
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
                  {selectedParticipant.fullName}
                </span>
                <span className="text-xs text-orange-700 font-mono font-bold mt-1 block">
                  Matricule officiel : {selectedParticipant.matricule} • {selectedParticipant.type.toUpperCase()}
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
                <span className="text-[9px] font-mono text-slate-400 block">
                  Vérification : {selectedParticipant.matricule}
                </span>
              </div>

              <div className="text-center w-52 space-y-12">
                <p className="text-xs font-bold text-slate-800">
                  Le Secrétaire Régional AEEMCI Gôh
                </p>
                <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-600">
                  Oustaz Cissé I.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VUE 2 : BILAN FINAL DU SÉMINAIRE (A4 PRINTABLE) ─────────── */}
      {activeSubTab === 'bilan' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between print:hidden bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              Rapport récapitulatif prêt pour le Bureau Exécutif et les partenaires
            </span>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Bilan Final (PDF / A4)</span>
            </button>
          </div>

          <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:p-0">
            {/* En-tête Bilan */}
            <div className="flex items-center justify-between border-b-2 border-orange-500 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border border-orange-200 p-1 bg-white">
                  <img 
                    src="/assets/aistudio/1771719145696_b78691d8.png" 
                    alt="Logo homologué AEEMCI" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase">
                    Rapport & Bilan Final de Clôture
                  </h1>
                  <p className="text-xs text-orange-600 font-bold">
                    {config.editionName} • AEEMCI Secrétariat Régional du Gôh
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <p>Édité le : {new Date().toLocaleDateString('fr-FR')}</p>
                <p>Responsable : {userEmail}</p>
              </div>
            </div>

            {/* Cartes KPI Principaux */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-bold block">Total Inscrits</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.total}</span>
                <span className="text-[10px] text-slate-400">participants</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs text-emerald-800 font-bold block">Taux de Présence</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  {stats.total > 0 ? Math.round((stats.checkedInCount / stats.total) * 100) : 0}%
                </span>
                <span className="text-[10px] text-emerald-600">{stats.checkedInCount} arrivées validées</span>
              </div>

              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-center">
                <span className="text-xs text-orange-800 font-bold block">Recettes Encaissées</span>
                <span className="text-xl font-black text-orange-700 mt-1 block">
                  {stats.totalCollected.toLocaleString('fr-FR')} F
                </span>
                <span className="text-[10px] text-orange-600">sur {stats.totalExpected.toLocaleString('fr-FR')} F</span>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-xs text-purple-800 font-bold block">Polos Commandés</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{stats.polosCount}</span>
                <span className="text-[10px] text-purple-600">tenues officielles</span>
              </div>
            </div>

            {/* Détail Démographique & Rôles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Répartition par Profils
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Séminaristes :</span>
                    <span className="font-bold text-slate-900">{stats.seminaristes} ({stats.total > 0 ? Math.round((stats.seminaristes / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Formateurs & Encadreurs :</span>
                    <span className="font-bold text-slate-900">{stats.formateurs} ({stats.total > 0 ? Math.round((stats.formateurs / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">Commissions d'Organisation :</span>
                    <span className="font-bold text-slate-900">{stats.commission} ({stats.total > 0 ? Math.round((stats.commission / stats.total) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
                  Genre & Hébergement
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Frères (Hommes) :</span>
                    <span className="font-bold text-blue-700">{stats.hommes} ({stats.total > 0 ? Math.round((stats.hommes / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Sœurs (Femmes) :</span>
                    <span className="font-bold text-rose-700">{stats.femmes} ({stats.total > 0 ? Math.round((stats.femmes / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">Statut Financier :</span>
                    <span className="font-bold text-emerald-700">{stats.payes} Payés • {stats.enAttente} En attente • {stats.gratuits} Gratuits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Répartition par Sous-Comité */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
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
    </div>
  );
};
