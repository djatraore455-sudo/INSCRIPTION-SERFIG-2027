import React, { useState, useMemo, useEffect } from 'react';
import { Participant, SeminarConfig, ParticipantType, PaymentStatus, SubCommitteeConfig } from '../types';
import { 
  saveSeminarConfig, 
  resetSeminarConfigToPreset, 
  exportParticipantsToCSV,
  calculateAge 
} from '../services/storage';
import { supabase } from '../lib/supabase';
import { BadgeCard } from './BadgeCard';
import { RegistrationReceipt } from './RegistrationReceipt';
import { 
  X, Lock, Shield, Users, CheckCircle, Clock, 
  Download, Search, Settings, QrCode, Trash2, 
  DollarSign, CheckSquare, RefreshCw, Plus, Shirt, Check, Award,
  FileText, BookOpen, Utensils, LogOut, AlertCircle,
  Mail, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
  onConfigUpdated: (newConfig: SeminarConfig) => void;
  onOpenParticipantSpace?: (participant: Participant) => void;
}

/**
 * Convertit un enregistrement de la table Supabase "participants" (colonnes snake_case)
 * vers l'interface TypeScript de l'application (champs camelCase).
 */
function mapDbRowToParticipant(row: any): Participant {
  return {
    id: String(row.id),
    matricule: row.matricule || '—',
    type: (row.participant_type as ParticipantType) || (row.type as ParticipantType) || 'seminariste',
    fullName: row.full_name || row.fullName || '—',
    gender: row.gender === 'femme' ? 'femme' : 'homme',
    phone: row.phone || '—',
    whatsapp: row.whatsapp || row.phone || '—',
    email: row.email || undefined,
    subCommittee: row.sub_committee || row.subCommittee || 'Sous-Comité Gagnoa',
    schoolLevel: row.school_level || row.schoolLevel || undefined,
    schoolName: row.school_name || row.schoolName || undefined,
    birthDate: row.birth_date || row.birthDate || undefined,
    parentContact: row.parent_contact || row.parentContact || undefined,
    dormitory: row.dormitory || undefined,
    transportMode: row.transport_mode || row.transportMode || undefined,
    photoUrl: row.photo_path || row.photo_url || row.photoUrl || undefined,
    receiptNumber: row.receipt_number || row.receiptNumber || undefined,
    clothingType: row.clothing_type || row.clothingType || (row.has_polo ? 'polo' : 'aucun'),
    hasPolo: Boolean(row.has_polo ?? row.hasPolo),
    poloSize: row.polo_size || row.poloSize || undefined,
    poloColor: row.polo_color || row.poloColor || undefined,
    clothingFee: Number(row.clothing_fee ?? row.clothingFee ?? 0),
    trainerSubtype: row.trainer_subtype || row.trainerSubtype || undefined,
    teachingSubject: row.teaching_subject || row.teachingSubject || undefined,
    trainerBio: row.trainer_bio || row.trainerBio || undefined,
    trainerTitle: row.trainer_title || row.trainerTitle || undefined,
    availability: row.availability || undefined,
    commission: row.commission || undefined,
    commissionRole: row.commission_role || row.commissionRole || undefined,
    commissionExperience: row.commission_experience || row.commissionExperience || undefined,
    wavePhoneNumber: row.wave_phone_number || row.wavePhoneNumber || undefined,
    registrationFee: Number(row.registration_fee ?? row.registrationFee ?? 0),
    poloFee: Number(row.polo_fee ?? row.poloFee ?? 0),
    totalFee: Number(row.total_fee ?? row.totalFee ?? 0),
    paymentStatus: (row.payment_status || row.paymentStatus || 'en_attente') as PaymentStatus,
    paymentMethod: row.payment_method || row.paymentMethod || undefined,
    paymentReference: row.payment_reference || row.paymentReference || undefined,
    checkedIn: Boolean(row.checked_in ?? row.checkedIn),
    checkedInAt: row.checked_in_at || row.checkedInAt || undefined,
    courseAttendance: typeof row.course_attendance === 'object' && row.course_attendance !== null
      ? row.course_attendance 
      : (row.courseAttendance || { validated: false }),
    mealAttendance: typeof row.meal_attendance === 'object' && row.meal_attendance !== null
      ? row.meal_attendance 
      : (row.mealAttendance || { breakfast: false, lunch: false, dinner: false }),
    registeredAt: row.registered_at || row.registeredAt || new Date().toISOString(),
    notes: row.notes || undefined
  };
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onOpenParticipantSpace
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'participants' | 'checkin' | 'config'>('dashboard');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [filterCheckIn, setFilterCheckIn] = useState<string>('all');

  // Preview modals inside admin
  const [selectedParticipantForBadge, setSelectedParticipantForBadge] = useState<Participant | null>(null);
  const [selectedParticipantForReceipt, setSelectedParticipantForReceipt] = useState<Participant | null>(null);

  // Fast check-in scanner / manual input (RPC admin_scan_attendance)
  const [checkInInput, setCheckInInput] = useState('');
  const [checkInMode, setCheckInMode] = useState<'arrivee' | 'cours' | 'repas'>('arrivee');
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    status: 'ok' | 'already' | 'unpaid' | 'not_found' | 'error';
    message: string;
    scannedAt?: string;
    sessionKey?: string;
    rawMatricule?: string;
    participant?: {
      id: string;
      matricule: string;
      full_name: string;
      participant_type?: string;
      sub_committee?: string;
      photo_path?: string;
      payment_status?: string;
    };
  } | null>(null);

  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    status: 'ok' | 'already' | 'unpaid' | 'not_found' | 'error';
    matricule: string;
    fullName?: string;
    subCommittee?: string;
    sessionKey: string;
    scannedAt: string;
  }>>([]);

  // Editable config state
  const [editableConfig, setEditableConfig] = useState<SeminarConfig>(() => ({ ...config }));
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  // État d'erreur éventuelle de lecture Supabase
  const [supabaseTableError, setSupabaseTableError] = useState<string | null>(null);

  // Charger les participants depuis Supabase (table participants triée par registered_at desc)
  const loadParticipantsFromSupabase = async () => {
    setIsLoadingParticipants(true);
    setSupabaseTableError(null);
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('Erreur chargement participants Supabase:', error);
        setSupabaseTableError(error.message);
      } else if (data) {
        setParticipants(data.map(mapDbRowToParticipant));
      }
    } catch (err: any) {
      console.error('Erreur chargement participants:', err);
      setSupabaseTableError(err?.message || 'Erreur de connexion');
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  // Au rechargement de la page : restaure la session Supabase
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          if (isMounted) setIsAuthenticated(false);
          return;
        }

        const userEmail = session.user.email?.toLowerCase().trim() || '';
        const isAuthorizedAdmin = userEmail === 'aeemcisrgoh@gmail.com' || userEmail === 'djatraore455@gmail.com';

        let isAdmin = false;
        try {
          const { data } = await supabase.rpc('am_i_admin');
          if (data === true) isAdmin = true;
        } catch {
          // fallback to email authorization
        }

        if (isAdmin || isAuthorizedAdmin) {
          if (isMounted) {
            setIsAuthenticated(true);
            loadParticipantsFromSupabase();
          }
        } else {
          await supabase.auth.signOut();
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthError('Accès réservé aux administrateurs autorisés');
          }
        }
      } catch (err) {
        console.error('Erreur vérification session:', err);
        if (isMounted) setIsAuthenticated(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (signInError || !authData.session) {
        setAuthError('Identifiants incorrects');
        setIsAuthenticating(false);
        return;
      }

      const userEmail = authData.session.user.email?.toLowerCase().trim() || cleanEmail;
      const isAuthorizedAdmin = userEmail === 'aeemcisrgoh@gmail.com' || userEmail === 'djatraore455@gmail.com';

      // Vérification du statut admin via RPC am_i_admin
      let isAdmin = false;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('am_i_admin');
        if (!rpcError && rpcData === true) {
          isAdmin = true;
        } else if (rpcError) {
          console.warn('Note RPC am_i_admin:', rpcError.message);
        }
      } catch (err) {
        console.warn('Erreur appel RPC am_i_admin:', err);
      }

      // Si am_i_admin renvoie true OU si l'adresse e-mail authentifiée est l'admin officiel
      if (isAdmin || isAuthorizedAdmin) {
        setIsAuthenticated(true);
        setPassword('');
        await loadParticipantsFromSupabase();
      } else {
        await supabase.auth.signOut();
        setAuthError('Accès réservé aux administrateurs autorisés');
        setIsAuthenticating(false);
        return;
      }
    } catch (err: any) {
      console.error('Erreur connexion:', err);
      setAuthError('Identifiants incorrects');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setAuthError('');
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

  const handleToggleCheckIn = async (p: Participant) => {
    const nextCheckIn = !p.checkedIn;
    const nextCheckedInAt = nextCheckIn ? new Date().toISOString() : null;
    setActionLoadingId(p.id);

    try {
      const { error } = await supabase
        .from('participants')
        .update({ 
          checked_in: nextCheckIn,
          checked_in_at: nextCheckedInAt
        })
        .eq('id', p.id);

      if (error) {
        alert(`Erreur émargement : ${error.message}`);
      } else {
        setParticipants(prev =>
          prev.map(item =>
            item.id === p.id
              ? { ...item, checkedIn: nextCheckIn, checkedInAt: nextCheckedInAt || undefined }
              : item
          )
        );
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || 'Mise à jour impossible'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette inscription ?')) {
      return;
    }
    setActionLoadingId(id);
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id);

      if (error) {
        alert(`Erreur lors de la suppression : ${error.message}`);
      } else {
        setParticipants(prev => prev.filter(p => p.id !== id));
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || 'Suppression impossible'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRecordCashPayment = async (participantId: string) => {
    if (!confirm('Confirmez-vous l\'encaissement en espèces pour ce participant ?')) {
      return;
    }
    setActionLoadingId(participantId);
    try {
      const { error } = await supabase.rpc('admin_record_cash_payment', {
        p_participant_id: participantId
      });

      if (error) {
        alert(`Erreur enregistrement paiement espèces : ${error.message}`);
      } else {
        await loadParticipantsFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur : ${err?.message || 'Échec de l\'opération'}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  /**
   * Extrait le matricule brut même si la douchette/scanner lit le JSON d'un QR code (Badge ou Reçu)
   */
  const extractMatricule = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.m) return String(parsed.m).trim();
        if (parsed.matricule) return String(parsed.matricule).trim();
      } catch {
        // En cas d'erreur JSON, on conserve la valeur brute
      }
    }
    return trimmed;
  };

  /**
   * Génère la clé de session attendue par la fonction Supabase admin_scan_attendance :
   * - arrivee
   * - cours:AAAA-MM-JJ
   * - repas:AAAA-MM-JJ:(breakfast|lunch|dinner)
   */
  const getSessionKey = (mode: 'arrivee' | 'cours' | 'repas', date: string, meal: 'breakfast' | 'lunch' | 'dinner'): string => {
    if (mode === 'arrivee') return 'arrivee';
    if (mode === 'cours') return `cours:${date}`;
    return `repas:${date}:${meal}`;
  };

  const formatScannedAt = (timestamp?: string): string => {
    if (!timestamp) return 'Heure inconnue';
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + 
             ' le ' + d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  const getSessionLabel = (sessionKey: string): string => {
    if (sessionKey === 'arrivee') return 'Arrivée / Accueil Général';
    if (sessionKey.startsWith('cours:')) {
      const d = sessionKey.replace('cours:', '');
      return `Présence Cours (${d})`;
    }
    if (sessionKey.startsWith('repas:')) {
      const parts = sessionKey.split(':');
      const d = parts[1] || '';
      const meal = parts[2] === 'breakfast' ? 'Petit-déjeuner' : parts[2] === 'lunch' ? 'Déjeuner' : 'Dîner';
      return `Restaurant · ${meal} (${d})`;
    }
    return sessionKey;
  };

  const handleFastCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = checkInInput.trim();
    if (!raw) return;

    const matricule = extractMatricule(raw);
    const sessionKey = getSessionKey(checkInMode, sessionDate, selectedMeal);
    setIsScanning(true);
    setCheckInResult(null);

    try {
      // Appel direct à la fonction SQL Supabase : admin_scan_attendance(p_matricule, p_session_key)
      const { data, error } = await supabase.rpc('admin_scan_attendance', {
        p_matricule: matricule,
        p_session_key: sessionKey
      });

      if (error) {
        setCheckInResult({
          status: 'error',
          message: `Erreur d'accès : ${error.message}`,
          rawMatricule: matricule,
          sessionKey
        });
        return;
      }

      if (!data || typeof data !== 'object') {
        setCheckInResult({
          status: 'error',
          message: 'Réponse inattendue du serveur.',
          rawMatricule: matricule,
          sessionKey
        });
        return;
      }

      const status = data.status as 'ok' | 'already' | 'unpaid' | 'not_found';
      const p = data.participant;

      if (status === 'ok') {
        setCheckInResult({
          status: 'ok',
          message: 'Pointage validé avec succès !',
          participant: p,
          rawMatricule: matricule,
          sessionKey
        });
        setScanHistory(prev => [
          {
            id: Date.now().toString(),
            status: 'ok',
            matricule: p?.matricule || matricule,
            fullName: p?.full_name,
            subCommittee: p?.sub_committee,
            sessionKey,
            scannedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev.slice(0, 9)
        ]);
        setCheckInInput('');
        loadParticipantsFromSupabase();
      } else if (status === 'already') {
        setCheckInResult({
          status: 'already',
          message: 'Déjà validé pour cette session !',
          participant: p,
          scannedAt: data.scanned_at,
          rawMatricule: matricule,
          sessionKey
        });
        setScanHistory(prev => [
          {
            id: Date.now().toString(),
            status: 'already',
            matricule: p?.matricule || matricule,
            fullName: p?.full_name,
            subCommittee: p?.sub_committee,
            sessionKey,
            scannedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev.slice(0, 9)
        ]);
      } else if (status === 'unpaid') {
        setCheckInResult({
          status: 'unpaid',
          message: 'Validation refusée : Inscription non payée !',
          participant: p,
          rawMatricule: matricule,
          sessionKey
        });
        setScanHistory(prev => [
          {
            id: Date.now().toString(),
            status: 'unpaid',
            matricule: p?.matricule || matricule,
            fullName: p?.full_name,
            subCommittee: p?.sub_committee,
            sessionKey,
            scannedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          },
          ...prev.slice(0, 9)
        ]);
      } else if (status === 'not_found') {
        setCheckInResult({
          status: 'not_found',
          message: `Matricule « ${matricule} » introuvable dans la base des participants.`,
          rawMatricule: matricule,
          sessionKey
        });
      } else {
        setCheckInResult({
          status: 'error',
          message: `Réponse statut : ${status}`,
          rawMatricule: matricule,
          sessionKey
        });
      }
    } catch (err: any) {
      console.error('Erreur scan attendance:', err);
      setCheckInResult({
        status: 'error',
        message: `Erreur inattendue : ${err?.message || 'Échec de validation'}`,
        rawMatricule: matricule,
        sessionKey
      });
    } finally {
      setIsScanning(false);
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
    loadParticipantsFromSupabase();
  };

  if (!isOpen) return null;

  // 1. ÉCRAN DE CONNEXION DÉDIÉ ET ÉPURÉ ("PAS TROP DE COULEUR")
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Liseré supérieur sobre */}
          <div className="h-1.5 bg-slate-900 w-full" />

          {/* Bouton Fermer */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-7 sm:p-9">
            {/* En-tête sobre et élégant */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3.5 shadow-sm">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                <span>{config.editionName}</span>
                <span>·</span>
                <span>{config.acronym}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Espace Administrateur
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Authentification réservée aux membres autorisés du comité d'organisation.
              </p>
            </div>

            {/* Formulaire de connexion épuré */}
            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="aeemcisrgoh@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:bg-slate-400 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </button>
            </form>

            {/* Note de bas de carte sobre */}
            <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Accès sécurisé · Back-office officiel AEEMCI</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ESPACE DASHBOARD ADMINISTRATEUR (UNE FOIS CONNECTÉ)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header Sobre & Professionnel */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Administration & Back-Office
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-bold text-amber-400">
                  {config.acronym}
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-bold">
                Comité d'Organisation {config.editionName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 shrink-0 overflow-x-auto gap-2">
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
                  onClick={() => loadParticipantsFromSupabase()}
                  disabled={isLoadingParticipants}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                  title="Actualiser les données depuis Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingParticipants ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
                <button
                  onClick={() => exportParticipantsToCSV(participants)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Exporter la liste en Excel/CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Se déconnecter"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Déconnexion</span>
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
                                    {p.gender === 'homme' ? '🧔 Frère' : '🧕 Sœur'} • {calculateAge(p.birthDate) !== null ? `${calculateAge(p.birthDate)} ans` : '—'} • {p.phone || '—'}
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
                                {p.paymentStatus === 'paye' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    <CheckCircle className="w-3 h-3 text-emerald-700" />
                                    <span>Payé</span>
                                  </span>
                                ) : p.paymentStatus === 'gratuit' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                                    <span>Gratuit</span>
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      <span>En attente</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRecordCashPayment(p.id)}
                                      disabled={actionLoadingId === p.id}
                                      className="block w-full text-left px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white transition-all cursor-pointer shadow-xs whitespace-nowrap"
                                      title="Enregistrer le paiement en espèces"
                                    >
                                      {actionLoadingId === p.id ? (
                                        <span className="inline-flex items-center gap-1">
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                          <span>En cours...</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1">
                                          <DollarSign className="w-3 h-3" />
                                          <span>Enregistrer paiement espèces</span>
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                )}
                                {p.paymentReference && (
                                  <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                                    Réf: {p.paymentReference}
                                  </span>
                                )}
                                {p.paymentMethod && (
                                  <span className="block text-[9px] text-slate-400 mt-0.5">
                                    Via {p.paymentMethod}
                                  </span>
                                )}
                              </td>

                              <td className="px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCheckIn(p)}
                                  disabled={actionLoadingId === p.id}
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    p.checkedIn
                                      ? 'bg-teal-700 text-white hover:bg-teal-800'
                                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                  }`}
                                >
                                  {actionLoadingId === p.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : p.checkedIn ? (
                                    'Émargé'
                                  ) : (
                                    'Non émargé'
                                  )}
                                </button>
                              </td>

                              <td className="px-3 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedParticipantForReceipt(p)}
                                    className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-all cursor-pointer font-bold flex items-center gap-1 text-[11px]"
                                    title="Voir & Imprimer la Fiche d'Inscription / Reçu A4"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-emerald-800" />
                                    <span className="hidden xl:inline">Fiche Reçu</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedParticipantForBadge(p)}
                                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                    title="Voir & Imprimer le Badge"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    disabled={actionLoadingId === p.id}
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

              {/* TAB 3: CHECK-IN / ÉMARGEMENT ACCUEIL (RPC admin_scan_attendance) */}
              {activeTab === 'checkin' && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm">
                    {/* En-tête du module */}
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                        <QrCode className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Module de Pointage & Émargement Supabase
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Scannez le badge/reçu avec une douchette ou saisissez le matricule du participant.
                      </p>
                    </div>

                    {/* Sélecteur de Type de Session (Arrivée, Cours, Repas) */}
                    <div className="p-1 bg-slate-100 rounded-xl flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInMode('arrivee');
                          setCheckInResult(null);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          checkInMode === 'arrivee'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        <span>Arrivée / Accueil</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInMode('cours');
                          setCheckInResult(null);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          checkInMode === 'cours'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Présence Cours</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInMode('repas');
                          setCheckInResult(null);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          checkInMode === 'repas'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Utensils className="w-4 h-4 text-amber-600" />
                        <span>Restaurant</span>
                      </button>
                    </div>

                    {/* Options supplémentaires pour Cours et Restaurant */}
                    {(checkInMode === 'cours' || checkInMode === 'repas') && (
                      <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Date de la séance (AAAA-MM-JJ) :
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={sessionDate}
                              onChange={e => setSessionDate(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => setSessionDate(new Date().toISOString().split('T')[0])}
                              className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Aujourd'hui
                            </button>
                          </div>
                        </div>

                        {/* Sous-sélection du service restaurant */}
                        {checkInMode === 'repas' && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                            <span className="text-xs font-semibold text-slate-700">Service repas :</span>
                            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
                              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => (
                                <button
                                  key={meal}
                                  type="button"
                                  onClick={() => setSelectedMeal(meal)}
                                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    selectedMeal === meal
                                      ? 'bg-slate-900 text-white'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {meal === 'breakfast' ? 'Petit-déjeuner' : meal === 'lunch' ? 'Déjeuner' : 'Dîner'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Badge indicateur de la session SQL active */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
                      <span>Session active :</span>
                      <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono font-medium">
                        {getSessionKey(checkInMode, sessionDate, selectedMeal)}
                      </code>
                    </div>

                    {/* Formulaire de scan du matricule */}
                    <form onSubmit={handleFastCheckIn} className="mt-4 flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder={
                            checkInMode === 'arrivee'
                              ? 'Scanner badge ou saisir matricule (ex: SERFIG27-SEM-1042)...'
                              : checkInMode === 'cours'
                                ? 'Scanner pour valider le cours...'
                                : `Scanner pour valider repas (${selectedMeal})...`
                          }
                          value={checkInInput}
                          onChange={e => setCheckInInput(e.target.value)}
                          disabled={isScanning}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 text-center transition-all disabled:opacity-50"
                          autoFocus
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isScanning || !checkInInput.trim()}
                        className="px-5 sm:px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-black disabled:bg-slate-300 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shrink-0 flex items-center gap-2 shadow-xs"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="hidden sm:inline">Validation...</span>
                          </>
                        ) : (
                          <span>Pointer</span>
                        )}
                      </button>
                    </form>

                    {/* Résultat du pointage (4 états du backend SQL) */}
                    {checkInResult && (
                      <div className="mt-5 text-left animate-in fade-in duration-200">
                        {/* 1. OK : Pointage enregistré */}
                        {checkInResult.status === 'ok' && (
                          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-950">
                            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                              <span>{checkInResult.message}</span>
                            </div>
                            {checkInResult.participant && (
                              <div className="mt-3 p-3 bg-white/90 rounded-lg border border-emerald-200/80 text-xs space-y-1 text-slate-800">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {checkInResult.participant.full_name}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                                    {checkInResult.participant.payment_status?.toUpperCase() || 'PAYÉ'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                                  <p><strong>Matricule :</strong> {checkInResult.participant.matricule}</p>
                                  <p><strong>Sous-comité :</strong> {checkInResult.participant.sub_committee}</p>
                                  <p className="col-span-2">
                                    <strong>Session :</strong> {getSessionLabel(checkInResult.sessionKey || '')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. ALREADY : Déjà validé avec l'heure */}
                        {checkInResult.status === 'already' && (
                          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950">
                            <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                              <span>{checkInResult.message}</span>
                            </div>
                            <p className="text-xs text-amber-800 mt-1 font-medium">
                              Ce participant a déjà été pointé à : <strong>{formatScannedAt(checkInResult.scannedAt)}</strong>
                            </p>
                            {checkInResult.participant && (
                              <div className="mt-3 p-3 bg-white/90 rounded-lg border border-amber-200/80 text-xs space-y-1 text-slate-800">
                                <p className="font-bold text-slate-900">
                                  {checkInResult.participant.full_name} ({checkInResult.participant.matricule})
                                </p>
                                <p className="text-slate-600">
                                  <strong>Sous-comité :</strong> {checkInResult.participant.sub_committee}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. UNPAID : Inscription non payée : refus */}
                        {checkInResult.status === 'unpaid' && (
                          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/90 text-rose-950">
                            <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
                              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                              <span>{checkInResult.message}</span>
                            </div>
                            <p className="text-xs text-rose-700 mt-1">
                              Seuls les participants dont l'inscription est validée (payée ou gratuite) sont autorisés à émarger.
                            </p>
                            {checkInResult.participant && (
                              <div className="mt-3 p-3 bg-white/90 rounded-lg border border-rose-200/80 text-xs space-y-2 text-slate-800">
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {checkInResult.participant.full_name} ({checkInResult.participant.matricule})
                                  </p>
                                  <p className="text-slate-600">
                                    <strong>Sous-comité :</strong> {checkInResult.participant.sub_committee}
                                  </p>
                                  <p className="text-rose-600 font-semibold mt-0.5">
                                    Statut actuel : En attente de paiement
                                  </p>
                                </div>

                                {/* Action rapide d'encaissement espèces */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!checkInResult.participant?.id) return;
                                    await handleRecordCashPayment(checkInResult.participant.id);
                                    // Relancer le pointage immédiatement après paiement
                                    if (checkInResult.participant.matricule) {
                                      const { data } = await supabase.rpc('admin_scan_attendance', {
                                        p_matricule: checkInResult.participant.matricule,
                                        p_session_key: getSessionKey(checkInMode, sessionDate, selectedMeal)
                                      });
                                      if (data && data.status === 'ok') {
                                        setCheckInResult({
                                          status: 'ok',
                                          message: 'Paiement espèces enregistré & pointage validé avec succès !',
                                          participant: data.participant,
                                          sessionKey: getSessionKey(checkInMode, sessionDate, selectedMeal)
                                        });
                                        loadParticipantsFromSupabase();
                                      }
                                    }
                                  }}
                                  className="w-full sm:w-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  <span>Encaisser paiement espèces & valider le pointage</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. NOT_FOUND : Matricule inconnu */}
                        {checkInResult.status === 'not_found' && (
                          <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-950">
                            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                              <span>{checkInResult.message}</span>
                            </div>
                            <p className="text-xs text-red-700 mt-1">
                              Aucun participant n'a été trouvé avec ce matricule. Vérifiez l'orthographe ou scannez à nouveau le QR code.
                            </p>
                          </div>
                        )}

                        {/* 5. ERROR GÉNÉRIQUE */}
                        {checkInResult.status === 'error' && (
                          <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-950">
                            <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                              <span>{checkInResult.message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Historique en direct des scans de la session */}
                  {scanHistory.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Derniers pointages effectués ({scanHistory.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => setScanHistory([])}
                          className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition-colors cursor-pointer"
                        >
                          Effacer l'historique
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {scanHistory.map(item => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              {item.status === 'ok' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              ) : item.status === 'already' ? (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              )}
                              <span className="font-mono font-bold text-slate-800">{item.matricule}</span>
                              {item.fullName && (
                                <span className="text-slate-600 truncate">· {item.fullName}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400">{item.scannedAt}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.status === 'ok'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'already'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {item.status === 'ok' ? 'VALIDÉ' : item.status === 'already' ? 'DÉJÀ FAIT' : 'REFUSÉ'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
              <h3 className="font-bold text-slate-800 mb-4 text-center">Badge Officiel Plastifié</h3>
              <BadgeCard participant={selectedParticipantForBadge} config={config} showActions={true} />
            </div>
          </div>
        )}

        {/* Modal for viewing A4 Registration Receipt from admin */}
        {selectedParticipantForReceipt && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white p-4 sm:p-6 rounded-3xl relative max-w-4xl w-full my-auto max-h-[95vh] overflow-y-auto">
              <button
                onClick={() => setSelectedParticipantForReceipt(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer z-20"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <RegistrationReceipt
                participant={selectedParticipantForReceipt}
                config={config}
                onUpdateParticipant={(updated) => {
                  setSelectedParticipantForReceipt(updated);
                  setParticipants(prev => prev.map(p => p.id === updated.id ? updated : p));
                }}
                onOpenParticipantSpace={onOpenParticipantSpace ? (p) => {
                  setSelectedParticipantForReceipt(null);
                  onClose();
                  onOpenParticipantSpace(p);
                } : undefined}
                showActions={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
