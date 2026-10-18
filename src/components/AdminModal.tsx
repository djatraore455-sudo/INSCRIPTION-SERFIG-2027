import React, { useState, useMemo } from 'react';
import { Participant, SeminarConfig, ParticipantType, PaymentStatus, SubCommitteeConfig } from '../types';
import { 
  getParticipants, 
  saveParticipants, 
  updateParticipantStatus, 
  deleteParticipant, 
  checkInParticipant,
  saveSeminarConfig, 
  resetSeminarConfigToPreset, 
  exportParticipantsToCSV 
} from '../services/storage';
import { BadgeCard } from './BadgeCard';
import { 
  X, Lock, Shield, Users, CheckCircle, Clock, 
  Download, Search, Settings, QrCode, Trash2, 
  DollarSign, CheckSquare, RefreshCw, Plus, Shirt, Check, Award
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
  onConfigUpdated: (newConfig: SeminarConfig) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'checkin' | 'config'>('dashboard');
  const [participants, setParticipants] = useState<Participant[]>(() => getParticipants());

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [filterCheckIn, setFilterCheckIn] = useState<string>('all');

  // Badge preview modal inside admin
  const [selectedParticipantForBadge, setSelectedParticipantForBadge] = useState<Participant | null>(null);

  // Fast check-in scanner / manual input
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; message: string; participant?: Participant } | null>(null);

  // Editable config state
  const [editableConfig, setEditableConfig] = useState<SeminarConfig>(() => ({ ...config }));
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'aeemci2027' || password === 'admin' || password === 'serfig') {
      setIsAuthenticated(true);
      setAuthError('');
      setParticipants(getParticipants());
    } else {
      setAuthError('Mot de passe incorrect. Indice : utilisez "aeemci2027"');
    }
  };

  // Metrics computation
  const stats = useMemo(() => {
    const total = participants.length;
    const seminaristes = participants.filter(p => p.type === 'seminariste').length;
    const formateurs = participants.filter(p => p.type === 'formateur').length;
    const commissions = participants.filter(p => p.type === 'commission').length;

    const hommes = participants.filter(p => p.gender === 'homme').length;
    const femmes = participants.filter(p => p.gender === 'femme').length;

    const checkedInCount = participants.filter(p => p.checkedIn).length;
    const paidCount = participants.filter(p => p.paymentStatus === 'paye' || p.paymentStatus === 'gratuit').length;

    const totalCollected = participants
      .filter(p => p.paymentStatus === 'paye')
      .reduce((sum, p) => sum + p.totalFee, 0);

    const totalPending = participants
      .filter(p => p.paymentStatus === 'en_attente')
      .reduce((sum, p) => sum + p.totalFee, 0);

    const totalPolos = participants.filter(p => p.hasPolo).length;
    const poloSizes: Record<string, number> = {};
    participants.filter(p => p.hasPolo).forEach(p => {
      const size = p.poloSize || 'L';
      poloSizes[size] = (poloSizes[size] || 0) + 1;
    });

    return {
      total,
      seminaristes,
      formateurs,
      commissions,
      hommes,
      femmes,
      checkedInCount,
      paidCount,
      totalCollected,
      totalPending,
      totalPolos,
      poloSizes
    };
  }, [participants]);

  // Filtered participants list
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterPayment !== 'all' && p.paymentStatus !== filterPayment) return false;
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;
      if (filterCheckIn === 'checked' && !p.checkedIn) return false;
      if (filterCheckIn === 'not_checked' && p.checkedIn) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.fullName.toLowerCase().includes(q);
        const matchesMatricule = p.matricule.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesSub = p.subCommittee.toLowerCase().includes(q);
        return matchesName || matchesMatricule || matchesPhone || matchesSub;
      }

      return true;
    });
  }, [participants, filterType, filterPayment, filterSubCommittee, filterCheckIn, searchQuery]);

  const handleTogglePayment = (p: Participant) => {
    const nextStatus: PaymentStatus = p.paymentStatus === 'paye' ? 'en_attente' : 'paye';
    const updated = updateParticipantStatus(p.id, { paymentStatus: nextStatus });
    setParticipants(updated);
  };

  const handleToggleCheckIn = (p: Participant) => {
    const nextCheckIn = !p.checkedIn;
    const updated = updateParticipantStatus(p.id, { 
      checkedIn: nextCheckIn,
      checkedInAt: nextCheckIn ? new Date().toISOString() : undefined
    });
    setParticipants(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      const updated = deleteParticipant(id);
      setParticipants(updated);
    }
  };

  const handleFastCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInInput.trim()) return;

    const res = checkInParticipant(checkInInput);
    setCheckInResult(res);
    setParticipants(getParticipants());
    if (res.success) {
      setCheckInInput('');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSeminarConfig(editableConfig);
    onConfigUpdated(editableConfig);
    setConfigSaveSuccess(true);
    setTimeout(() => setConfigSaveSuccess(false), 3000);
  };

  const handleSwitchPreset = (preset: 'SERFIG_2027' | 'SEFIHA_2026') => {
    const loaded = resetSeminarConfigToPreset(preset);
    setEditableConfig(loaded);
    onConfigUpdated(loaded);
    setParticipants(getParticipants());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Administration & Back-Office
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-[10px] font-bold text-emerald-200">
                  {config.acronym}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black">
                Comité d'Organisation {config.editionName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        {!isAuthenticated ? (
          /* Login Screen */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-inner">
              <Lock className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Accès Sécurisé au Comité d'Organisation</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
              Cet espace est réservé au Secrétariat Régional et aux commissions pour la gestion des séminaristes, l'émargement et la configuration.
            </p>

            <form onSubmit={handleLogin} className="mt-6 w-full max-w-sm space-y-3">
              <div>
                <input
                  type="password"
                  placeholder="Code d'accès administrateur..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  💡 Code d'accès par défaut : <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-emerald-900">aeemci2027</code>
                </p>
              </div>

              {authError && (
                <p className="text-xs text-red-600 font-semibold">{authError}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Déverrouiller l'Espace Admin
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub Navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Statistiques</span>
                </button>
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'participants'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Participants ({participants.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('checkin')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'checkin'
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Émargement Accueil</span>
                </button>
                <button
                  onClick={() => setActiveTab('config')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'config'
                      ? 'bg-amber-500 text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configuration SERFIG 2027</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportParticipantsToCSV(participants)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Exporter la liste en Excel/CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
              </div>
            </div>

            {/* Main Tab Views */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60">
              {/* TAB 1: DASHBOARD STATS */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                        <span>Total Inscrits</span>
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {config.stats.capacity} max</span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                        <span>{stats.seminaristes} Séminaristes</span>
                        <span>{stats.formateurs} Form. • {stats.commissions} Com.</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                        <span>Fonds Collectés</span>
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-2">
                        <span className="text-xl sm:text-2xl font-black text-emerald-700">
                          {stats.totalCollected.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-amber-700 font-medium">
                        En attente : {stats.totalPending.toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                        <span>Émargement / Présence</span>
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-teal-700">{stats.checkedInCount}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          ({stats.total > 0 ? Math.round((stats.checkedInCount / stats.total) * 100) : 0}%)
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">
                        {stats.total - stats.checkedInCount} attendus sur le site
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                        <span>Polos Officiels</span>
                        <Shirt className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="mt-2">
                        <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.totalPolos}</span>
                        <span className="text-xs text-slate-500 ml-1">commandés</span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500">
                        {Object.entries(stats.poloSizes).map(([s, c]) => `${s}:${c}`).join(' • ') || 'Aucun'}
                      </div>
                    </div>
                  </div>

                  {/* Secondary info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gender breakdown */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                        Répartition par Genre & Hébergement
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Frères (Dortoir Garçons)</span>
                            <span>{stats.hommes} ({stats.total > 0 ? Math.round((stats.hommes / stats.total) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-600 rounded-full" 
                              style={{ width: `${stats.total > 0 ? (stats.hommes / stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Sœurs (Dortoir Filles)</span>
                            <span>{stats.femmes} ({stats.total > 0 ? Math.round((stats.femmes / stats.total) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-teal-500 rounded-full" 
                              style={{ width: `${stats.total > 0 ? (stats.femmes / stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub-committee breakdown */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                        Délégations par Sous-Comité ({config.region})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {config.subCommittees.map(sc => {
                          const count = participants.filter(p => p.subCommittee === sc.name).length;
                          return (
                            <div key={sc.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                              <span className="font-medium text-slate-700">{sc.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-emerald-800">
                                {count} inscrit{count > 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PARTICIPANTS TABLE */}
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  {/* Search and Filters Header */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Recherche par nom, matricule, téléphone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="all">Tous les types</option>
                        <option value="seminariste">Séminaristes</option>
                        <option value="formateur">Formateurs</option>
                        <option value="commission">Commissions</option>
                      </select>

                      <select
                        value={filterPayment}
                        onChange={e => setFilterPayment(e.target.value)}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="all">Tous les statuts paiement</option>
                        <option value="paye">Payé & Validé</option>
                        <option value="en_attente">En attente</option>
                        <option value="gratuit">Gratuit</option>
                      </select>

                      <select
                        value={filterCheckIn}
                        onChange={e => setFilterCheckIn(e.target.value)}
                        className="px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      >
                        <option value="all">Émargement</option>
                        <option value="checked">Émargés (Présents)</option>
                        <option value="not_checked">Non émargés</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-4 py-3">Matricule & Participant</th>
                            <th className="px-3 py-3">Type / Rôle</th>
                            <th className="px-3 py-3">Sous-Comité</th>
                            <th className="px-3 py-3">Polo</th>
                            <th className="px-3 py-3">Frais</th>
                            <th className="px-3 py-3">Paiement</th>
                            <th className="px-3 py-3">Présence</th>
                            <th className="px-3 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredParticipants.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div>
                                  <span className="font-mono text-[11px] font-bold text-emerald-800 block">
                                    {p.matricule}
                                  </span>
                                  <span className="font-bold text-slate-900 text-sm block">
                                    {p.fullName}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {p.gender === 'homme' ? '🧔 Frère' : '🧕 Sœur'} • {p.phone}
                                  </span>
                                </div>
                              </td>

                              <td className="px-3 py-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  p.type === 'formateur' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : p.type === 'commission'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {p.type}
                                </span>
                                {p.schoolLevel && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">{p.schoolLevel}</p>
                                )}
                                {p.teachingSubject && (
                                  <p className="text-[10px] text-blue-700 mt-0.5 font-medium">{p.teachingSubject}</p>
                                )}
                                {p.commission && (
                                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">{p.commission}</p>
                                )}
                              </td>

                              <td className="px-3 py-3 font-medium text-slate-700">
                                {p.subCommittee}
                              </td>

                              <td className="px-3 py-3">
                                {p.hasPolo ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                    <Shirt className="w-3.5 h-3.5" />
                                    <span>{p.poloSize}</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Non</span>
                                )}
                              </td>

                              <td className="px-3 py-3 font-bold text-slate-800">
                                {p.totalFee.toLocaleString('fr-FR')} F
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  onClick={() => handleTogglePayment(p)}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    p.paymentStatus === 'paye'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                      : p.paymentStatus === 'gratuit'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  }`}
                                  title="Cliquer pour basculer le statut"
                                >
                                  {p.paymentStatus === 'paye' ? (
                                    <>
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Payé</span>
                                    </>
                                  ) : p.paymentStatus === 'gratuit' ? (
                                    <span>Gratuit</span>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      <span>En attente</span>
                                    </>
                                  )}
                                </button>
                                {p.paymentReference && (
                                  <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                                    Réf: {p.paymentReference}
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  onClick={() => handleToggleCheckIn(p)}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    p.checkedIn
                                      ? 'bg-teal-700 text-white'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  {p.checkedIn ? 'Émargé' : 'Non émargé'}
                                </button>
                              </td>

                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedParticipantForBadge(p)}
                                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                                    title="Voir & Imprimer le Badge"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                                    title="Supprimer l'inscription"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredParticipants.length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        Aucun participant trouvé avec ces filtres.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CHECK-IN / ÉMARGEMENT ACCUEIL */}
              {activeTab === 'checkin' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-3">
                      <QrCode className="w-6 h-6 text-teal-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Module d'Émargement & Pointage à l'Entrée
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Scannez le QR Code du badge avec une douchette ou saisissez le matricule/téléphone du participant pour valider sa présence instantanément.
                    </p>

                    <form onSubmit={handleFastCheckIn} className="mt-5 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: SERFIG27-SEM-1042 ou 0748112233..."
                        value={checkInInput}
                        onChange={e => setCheckInInput(e.target.value)}
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 text-center"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer shrink-0"
                      >
                        Valider Présence
                      </button>
                    </form>

                    {checkInResult && (
                      <div className={`mt-4 p-4 rounded-xl border text-sm text-left ${
                        checkInResult.success 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                          : 'bg-red-50 border-red-300 text-red-900'
                      }`}>
                        <div className="flex items-center gap-2 font-bold mb-1">
                          {checkInResult.success ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-600" />}
                          <span>{checkInResult.message}</span>
                        </div>
                        {checkInResult.participant && (
                          <div className="mt-2 text-xs space-y-1 bg-white/70 p-2.5 rounded-lg border border-emerald-200">
                            <p><strong>Nom :</strong> {checkInResult.participant.fullName}</p>
                            <p><strong>Sous-Comité :</strong> {checkInResult.participant.subCommittee}</p>
                            <p><strong>Statut Paiement :</strong> {checkInResult.participant.paymentStatus.toUpperCase()} ({checkInResult.participant.totalFee} FCFA)</p>
                            <p><strong>Polo :</strong> {checkInResult.participant.hasPolo ? `OUI (Taille ${checkInResult.participant.poloSize})` : 'NON'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CONFIGURATION DU SÉMINAIRE (SERFIG 2027) */}
              {activeTab === 'config' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Paramètres d'Organisation du Séminaire
                      </h3>
                      <p className="text-xs text-slate-500">
                        Modifiez progressivement toutes les informations pour adapter la plateforme à l'organisation de SERFIG 2027.
                      </p>
                    </div>

                    {/* Presets Toggle buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchPreset('SERFIG_2027')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editableConfig.code === 'SERFIG_2027'
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Préréglage SERFIG 2027
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchPreset('SEFIHA_2026')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editableConfig.code === 'SEFIHA_2026'
                            ? 'bg-teal-800 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Modèle SEFIHA (Hambol)
                      </button>
                    </div>
                  </div>

                  {configSaveSuccess && (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Paramètres enregistrés avec succès ! Le site s'est mis à jour.</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveConfig} className="space-y-4">
                    {/* General info */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Acronyme & Édition</label>
                        <input
                          type="text"
                          value={editableConfig.editionName}
                          onChange={e => setEditableConfig({ ...editableConfig, editionName: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Numéro d'Édition</label>
                        <input
                          type="text"
                          value={editableConfig.editionNumber}
                          onChange={e => setEditableConfig({ ...editableConfig, editionNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Région</label>
                        <input
                          type="text"
                          value={editableConfig.region}
                          onChange={e => setEditableConfig({ ...editableConfig, region: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Titre Officiel Complet</label>
                      <input
                        type="text"
                        value={editableConfig.fullTitle}
                        onChange={e => setEditableConfig({ ...editableConfig, fullTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Organisateur Officiel</label>
                      <input
                        type="text"
                        value={editableConfig.organizer}
                        onChange={e => setEditableConfig({ ...editableConfig, organizer: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">URL du Logo Officiel</label>
                        <input
                          type="text"
                          value={editableConfig.logoUrl || ''}
                          placeholder="/src/assets/images/aeemci_official_logo_1792254182659.jpg"
                          onChange={e => setEditableConfig({ ...editableConfig, logoUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Image Bannière</label>
                        <input
                          type="text"
                          value={editableConfig.bannerUrl || ''}
                          placeholder="/src/assets/images/serfig_goh_banner_1792249086757.jpg"
                          onChange={e => setEditableConfig({ ...editableConfig, bannerUrl: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Dates & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Dates affichées</label>
                        <input
                          type="text"
                          value={editableConfig.displayDates}
                          onChange={e => setEditableConfig({ ...editableConfig, displayDates: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ville hôte</label>
                        <input
                          type="text"
                          value={editableConfig.location.city}
                          onChange={e => setEditableConfig({ 
                            ...editableConfig, 
                            location: { ...editableConfig.location, city: e.target.value } 
                          })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Lieu & Établissement</label>
                        <input
                          type="text"
                          value={editableConfig.location.venue}
                          onChange={e => setEditableConfig({ 
                            ...editableConfig, 
                            location: { ...editableConfig.location, venue: e.target.value } 
                          })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    {/* Thème */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Thème Central du Séminaire</label>
                      <input
                        type="text"
                        value={editableConfig.theme.title}
                        onChange={e => setEditableConfig({ 
                          ...editableConfig, 
                          theme: { ...editableConfig.theme, title: e.target.value } 
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
                      />
                    </div>

                    {/* Tarifs & Mobile Money */}
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Tarifs des Articles</h4>
                        <div className="flex justify-between items-center text-xs">
                          <span>Prix du Polo Officiel (FCFA) :</span>
                          <input
                            type="number"
                            value={editableConfig.poloPrice}
                            onChange={e => setEditableConfig({ ...editableConfig, poloPrice: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold"
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>Prix du Tee-shirt Simple (FCFA) :</span>
                          <input
                            type="number"
                            value={editableConfig.tshirtPrice || 2000}
                            onChange={e => setEditableConfig({ ...editableConfig, tshirtPrice: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold"
                          />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span>Frais Commission d'Organisation :</span>
                          <input
                            type="number"
                            value={editableConfig.commissionFee}
                            onChange={e => setEditableConfig({ ...editableConfig, commissionFee: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase">Numéros de Paiement</h4>
                        <div className="text-xs space-y-1">
                          <input
                            type="text"
                            placeholder="Wave"
                            value={editableConfig.paymentNumbers.wave}
                            onChange={e => setEditableConfig({
                              ...editableConfig,
                              paymentNumbers: { ...editableConfig.paymentNumbers, wave: e.target.value }
                            })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Orange Money"
                            value={editableConfig.paymentNumbers.orangeMoney}
                            onChange={e => setEditableConfig({
                              ...editableConfig,
                              paymentNumbers: { ...editableConfig.paymentNumbers, orangeMoney: e.target.value }
                            })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            placeholder="Nom du Bénéficiaire"
                            value={editableConfig.paymentNumbers.recipientName}
                            onChange={e => setEditableConfig({
                              ...editableConfig,
                              paymentNumbers: { ...editableConfig.paymentNumbers, recipientName: e.target.value }
                            })}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex justify-end gap-3">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
                      >
                        Enregistrer la Nouvelle Configuration
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for viewing badge from admin */}
        {selectedParticipantForBadge && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl relative max-w-md w-full">
              <button
                onClick={() => setSelectedParticipantForBadge(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-slate-800 mb-4 text-center">Badge Officiel</h3>
              <BadgeCard participant={selectedParticipantForBadge} config={config} showActions={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
