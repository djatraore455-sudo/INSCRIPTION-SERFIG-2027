import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Participant, 
  SeminarConfig, 
  ParticipantType, 
  PaymentStatus, 
  Dormitory, 
  DbPayment, 
  DbAttendance 
} from '../types';
import { calculateAge } from '../services/storage';
import { BadgeCard } from './BadgeCard';
import { RegistrationReceipt } from './RegistrationReceipt';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  QrCode, 
  MoreHorizontal, 
  Home, 
  Shirt, 
  Printer, 
  Settings, 
  UserCheck, 
  LogOut, 
  RefreshCw, 
  Search, 
  Filter, 
  Plus, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Download, 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  Shield, 
  HeartPulse, 
  X, 
  Lock, 
  Camera, 
  MessageCircle, 
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Info,
  Wifi,
  WifiOff,
  History,
  Award,
  Database
} from 'lucide-react';
import { AdminMessaging } from './admin/AdminMessaging';
import { AdminMedical } from './admin/AdminMedical';
import { AdminSchedule } from './admin/AdminSchedule';
import { AdminActivityLogs } from './admin/AdminActivityLogs';
import { AdminCertificates } from './admin/AdminCertificates';

interface AdminPageProps {
  config: SeminarConfig;
  onBackToPublic: () => void;
  onConfigUpdated: (newConfig: SeminarConfig) => void;
}

// Convertit une ligne DB snake_case en Participant TypeScript camelCase
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
    parentName: row.parent_name || row.parentName || undefined,
    parentContact: row.parent_contact || row.parentContact || undefined,
    hasMedicalCondition: Boolean(row.has_medical_condition ?? row.hasMedicalCondition ?? false),
    medicalDetails: row.medical_details || row.medicalDetails || undefined,
    dormitory: row.dormitory || undefined,
    transportMode: row.transport_mode || row.transportMode || undefined,
    photoUrl: row.photo_path || row.photo_url || row.photoUrl || undefined,
    receiptNumber: row.receipt_number || row.receiptNumber || undefined,
    clothingType: row.clothing_type || row.clothingType || (row.has_polo ? 'polo' : 'aucun'),
    hasPolo: Boolean(row.has_polo ?? row.hasPolo),
    poloSize: row.polo_size || row.poloSize || undefined,
    poloColor: row.polo_color || row.poloColor || undefined,
    clothingFee: Number(row.clothing_fee ?? row.clothingFee ?? 0),
    registrationFee: Number(row.registration_fee ?? row.registrationFee ?? 0),
    poloFee: Number(row.polo_fee ?? row.poloFee ?? 0),
    totalFee: Number(row.total_fee ?? row.totalFee ?? 0),
    paymentStatus: (row.payment_status || row.paymentStatus || 'en_attente') as PaymentStatus,
    paymentMethod: row.payment_method || row.paymentMethod || undefined,
    paymentReference: row.payment_reference || row.paymentReference || undefined,
    checkedIn: Boolean(row.checked_in ?? row.checkedIn),
    checkedInAt: row.checked_in_at || row.checkedInAt || undefined,
    registeredAt: row.registered_at || row.registeredAt || new Date().toISOString(),
    notes: row.notes || undefined
  };
}

export const AdminPage: React.FC<AdminPageProps> = ({
  config,
  onBackToPublic,
  onConfigUpdated
}) => {
  // ─── AUTHENTIFICATION ──────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // ─── NAVIGATION ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'participants' | 'payments' | 'checkin' | 'dormitories' | 'clothing' | 'printables' | 'config' | 'account' | 'messaging' | 'medical' | 'schedule' | 'activity' | 'certificates'
  >('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState<boolean>(false);

  // ─── PHASE 2 : RÔLES RBAC & MODE HORS-LIGNE ─────────────────────
  const [currentRole, setCurrentRole] = useState<'super_admin' | 'finance' | 'organisateur' | 'sante'>('super_admin');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineScans, setOfflineScans] = useState<Array<{
    id: string;
    matricule: string;
    sessionKey: string;
    timestamp: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('serfig_offline_scans_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

  // ─── DONNÉES SUPABASE ──────────────────────────────────────────
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<DbPayment[]>([]);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [subCommitteesDb, setSubCommitteesDb] = useState<Array<{ name: string; registration_fee: number; is_active: boolean; sort_order: number }>>([]);
  const [seminarConfigDb, setSeminarConfigDb] = useState<{
    registration?: { open: boolean; deadline?: string };
    capacity?: { max: number };
    pricing?: { polo: number; tshirt: number; commission: number; formateur: number };
  }>({});
  const [attendanceRecords, setAttendanceRecords] = useState<DbAttendance[]>([]);

  // États de chargement & erreurs
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // ─── RESTAURATION DE SESSION SUPABASE ──────────────────────────
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      setAuthChecking(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthChecking(false);
          }
          return;
        }

        const currentEmail = session.user.email?.toLowerCase().trim() || '';
        setUserEmail(currentEmail);

        // Vérification am_i_admin()
        let isAdmin = false;
        try {
          const { data } = await supabase.rpc('am_i_admin');
          if (data === true) isAdmin = true;
        } catch {
          // fallback si la fonction rpc n'est pas encore créée
        }

        if (isAdmin || currentEmail === 'aeemcisrgoh@gmail.com' || currentEmail === 'djatraore455@gmail.com') {
          if (isMounted) {
            setIsAuthenticated(true);
            setAuthChecking(false);
          }
        } else {
          await supabase.auth.signOut();
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthError('Compte non autorisé comme administrateur');
            setAuthChecking(false);
          }
        }
      } catch (err: any) {
        console.error('Erreur vérification session:', err);
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthChecking(false);
        }
      }
    };

    checkSession();
    return () => { isMounted = false; };
  }, []);

  // ─── ÉCOUTE CONNECTIVITÉ HORS-LIGNE (PHASE 2) ──────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── JOURNALISATION ACTIVITÉ ADMIN (PHASE 2) ──────────────────
  const logAdminActivity = async (action: string, details?: any, entity_type?: string, entity_id?: string) => {
    const logItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_email: userEmail || 'admin',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString()
    };

    // Sauvegarde locale instantanée
    try {
      const existing = JSON.parse(localStorage.getItem('serfig_admin_activity_logs') || '[]');
      localStorage.setItem('serfig_admin_activity_logs', JSON.stringify([logItem, ...existing].slice(0, 300)));
    } catch {}

    // Tentative Supabase
    try {
      await supabase.from('admin_activity_logs').insert([{
        user_email: userEmail || 'admin',
        action,
        entity_type,
        entity_id,
        details
      }]);
    } catch {}
  };

  // ─── SYNCHRONISATION DES POINTAGES HORS-LIGNE (PHASE 2) ────────
  const syncOfflineScans = async () => {
    if (offlineScans.length === 0 || isSyncingOffline) return;
    setIsSyncingOffline(true);
    let successCount = 0;
    const remaining: typeof offlineScans = [];

    for (const item of offlineScans) {
      try {
        const { error } = await supabase.rpc('admin_scan_attendance', {
          p_matricule: item.matricule,
          p_session_key: item.sessionKey
        });
        if (!error) {
          successCount++;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    setOfflineScans(remaining);
    localStorage.setItem('serfig_offline_scans_queue', JSON.stringify(remaining));
    setIsSyncingOffline(false);
    alert(`${successCount} pointage(s) synchronisé(s) avec succès !`);
    loadAllDataFromSupabase();
  };

  // ─── CHARGEMENT DES DONNÉES DEPUIS SUPABASE ────────────────────
  const loadAllDataFromSupabase = async () => {
    setIsLoading(true);
    setDataError(null);
    try {
      // 1. Participants (pagination 1000 max avec tri)
      const { data: partData, error: partErr } = await supabase
        .from('participants')
        .select('*')
        .order('registered_at', { ascending: false })
        .range(0, 999);

      if (partErr) {
        console.error('Erreur participants:', partErr);
        setDataError(partErr.message);
      } else if (partData) {
        setParticipants(partData.map(mapDbRowToParticipant));
      }

      // 2. Payments avec jointure participants
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('*, participant:participants(full_name, matricule, sub_committee), donation:donations(donor_name)')
        .order('created_at', { ascending: false })
        .range(0, 999);

      if (!payErr && payData) {
        setPayments(payData as DbPayment[]);
      }

      // 3. Dortoirs
      const { data: dormData, error: dormErr } = await supabase
        .from('dormitories')
        .select('*')
        .order('name', { ascending: true });

      if (!dormErr && dormData) {
        setDormitories(dormData);
      }

      // 4. Sub committees
      const { data: scData } = await supabase
        .from('sub_committees')
        .select('*')
        .order('sort_order', { ascending: true });

      if (scData) {
        setSubCommitteesDb(scData);
      }

      // 5. Seminar config
      const { data: cfgData } = await supabase
        .from('seminar_config')
        .select('*');

      if (cfgData) {
        const configMap: any = {};
        cfgData.forEach((row: any) => {
          configMap[row.config_key] = row.config_value;
        });
        setSeminarConfigDb(configMap);
      }

      // 6. Attendance records
      const { data: attData } = await supabase
        .from('attendance')
        .select('*, participant:participants(matricule, full_name, sub_committee, participant_type, gender, dormitory)')
        .order('scanned_at', { ascending: false })
        .range(0, 999);

      if (attData) {
        setAttendanceRecords(attData as DbAttendance[]);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Erreur globale Supabase:', err);
      setDataError(err?.message || 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllDataFromSupabase();
    }
  }, [isAuthenticated]);

  // ─── CONNEXION EMAIL/PASSWORD ──────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Veuillez renseigner votre e-mail et mot de passe');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' 
          ? 'Identifiants incorrects (e-mail ou mot de passe invalide)' 
          : error.message);
        setIsAuthenticating(false);
        return;
      }

      const loggedEmail = data.user?.email?.toLowerCase().trim() || '';
      setUserEmail(loggedEmail);

      let isAdmin = false;
      try {
        const { data: rpcAdmin } = await supabase.rpc('am_i_admin');
        if (rpcAdmin === true) isAdmin = true;
      } catch {
        // RPC fallback
      }

      if (isAdmin || loggedEmail === 'aeemcisrgoh@gmail.com' || loggedEmail === 'djatraore455@gmail.com') {
        setIsAuthenticated(true);
        loadAllDataFromSupabase();
      } else {
        await supabase.auth.signOut();
        setAuthError('Accès refusé : votre compte n\'a pas les privilèges administrateur.');
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Erreur lors de la tentative de connexion');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ─── DÉCONNEXION ───────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    } finally {
      setIsAuthenticated(false);
      setUserEmail('');
      setIsHeaderDropdownOpen(false);
    }
  };

  // ─── ÉTATS DE GESTION DES PARTICIPANTS ──────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterSubCommittee, setFilterSubCommittee] = useState<string>('all');
  const [filterCheckIn, setFilterCheckIn] = useState<string>('all');
  const [filterDormitory, setFilterDormitory] = useState<string>('all');
  const [filterClothing, setFilterClothing] = useState<string>('all');

  // Modals & Drawees
  const [selectedParticipantForDetail, setSelectedParticipantForDetail] = useState<Participant | null>(null);
  const [selectedParticipantForEdit, setSelectedParticipantForEdit] = useState<Participant | null>(null);
  const [selectedParticipantForBadge, setSelectedParticipantForBadge] = useState<Participant | null>(null);
  const [selectedParticipantForReceipt, setSelectedParticipantForReceipt] = useState<Participant | null>(null);
  const [isAddParticipantModalOpen, setIsAddParticipantModalOpen] = useState(false);
  const [cashPaymentParticipant, setCashPaymentParticipant] = useState<Participant | null>(null);
  const [cashPaymentNote, setCashPaymentNote] = useState('');
  const [isSubmittingCashPayment, setIsSubmittingCashPayment] = useState(false);
  const [cashPaymentSuccessMsg, setCashPaymentSuccessMsg] = useState('');

  // ─── POINTAGE / CHECK-IN ───────────────────────────────────────
  const [checkInDate, setCheckInDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [checkInSessionType, setCheckInSessionType] = useState<'arrivee' | 'breakfast' | 'lunch' | 'dinner' | 'cours'>('arrivee');
  const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
  const [manualMatriculeInput, setManualMatriculeInput] = useState<string>('');
  const [scanStatusResult, setScanStatusResult] = useState<{
    status: 'ok' | 'already' | 'unpaid' | 'not_found' | 'error';
    message?: string;
    scannedAt?: string;
    participant?: any;
  } | null>(null);
  const [isScanningCooldown, setIsScanningCooldown] = useState<boolean>(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Clef de session calculée
  const computedSessionKey = useMemo(() => {
    if (checkInSessionType === 'arrivee') return 'arrivee';
    if (checkInSessionType === 'cours') return `cours:${checkInDate}`;
    return `repas:${checkInDate}:${checkInSessionType}`;
  }, [checkInSessionType, checkInDate]);

  // Nettoyage scanner caméra
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, []);

  // ─── POINTAGE SCANNER OR MANUAL CALL ───────────────────────────
  const executeAttendanceScan = async (rawMatricule: string) => {
    if (!rawMatricule || isScanningCooldown) return;

    // Normalisation matricule
    let cleanMatricule = rawMatricule.trim();
    try {
      if (cleanMatricule.startsWith('{')) {
        const parsed = JSON.parse(cleanMatricule);
        cleanMatricule = parsed.m || parsed.matricule || cleanMatricule;
      }
    } catch {
      // pas du json
    }

    setIsScanningCooldown(true);
    setTimeout(() => setIsScanningCooldown(false), 2000); // 2s anti doublon

    // Mode HORS-LIGNE (Phase 2)
    if (!navigator.onLine) {
      const localParticipant = participants.find(p => p.matricule.toLowerCase() === cleanMatricule.toLowerCase());
      if (!localParticipant) {
        setScanStatusResult({
          status: 'not_found',
          message: 'Matricule inconnu (recherche hors-ligne).'
        });
        return;
      }

      if (localParticipant.type === 'seminariste' && localParticipant.paymentStatus === 'en_attente') {
        setScanStatusResult({
          status: 'unpaid',
          message: 'Inscription non payée, orienter vers la commission Finance (mode hors-ligne).',
          participant: {
            id: localParticipant.id,
            matricule: localParticipant.matricule,
            full_name: localParticipant.fullName,
            sub_committee: localParticipant.subCommittee
          }
        });
        return;
      }

      // Vérifier si déjà scanné hors-ligne pour cette session
      const alreadyInQueue = offlineScans.some(s => s.matricule.toLowerCase() === cleanMatricule.toLowerCase() && s.sessionKey === computedSessionKey);
      if (alreadyInQueue) {
        setScanStatusResult({
          status: 'already',
          message: 'Déjà validé hors-ligne pour cette session.',
          participant: {
            id: localParticipant.id,
            matricule: localParticipant.matricule,
            full_name: localParticipant.fullName,
            sub_committee: localParticipant.subCommittee
          }
        });
        return;
      }

      const newOfflineItem = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        matricule: cleanMatricule,
        sessionKey: computedSessionKey,
        timestamp: new Date().toISOString()
      };
      const updatedQueue = [newOfflineItem, ...offlineScans];
      setOfflineScans(updatedQueue);
      localStorage.setItem('serfig_offline_scans_queue', JSON.stringify(updatedQueue));

      try {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } catch {}

      setScanStatusResult({
        status: 'ok',
        message: 'Pointage validé en mode HORS-LIGNE (enregistré localement ✓)',
        scannedAt: newOfflineItem.timestamp,
        participant: {
          id: localParticipant.id,
          matricule: localParticipant.matricule,
          full_name: localParticipant.fullName,
          sub_committee: localParticipant.subCommittee
        }
      });
      logAdminActivity('POINTAGE_HORS_LIGNE', { matricule: cleanMatricule, session: computedSessionKey }, 'POINTAGE', cleanMatricule);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('admin_scan_attendance', {
        p_matricule: cleanMatricule,
        p_session_key: computedSessionKey
      });

      if (error) {
        setScanStatusResult({
          status: 'error',
          message: error.message
        });
        return;
      }

      // Vibration haptique
      try {
        if (navigator.vibrate) {
          if (data?.status === 'ok') navigator.vibrate([100, 50, 100]);
          else navigator.vibrate([300]);
        }
      } catch {}

      setScanStatusResult(data);
      if (data?.status === 'ok') {
        logAdminActivity('POINTAGE_QR', { matricule: cleanMatricule, session: computedSessionKey }, 'POINTAGE', cleanMatricule);
      }
      // Recharger la liste des présences
      loadAllDataFromSupabase();
    } catch (err: any) {
      setScanStatusResult({
        status: 'error',
        message: err?.message || 'Erreur lors du scan'
      });
    }
  };

  const startQrScanner = async () => {
    setIsScannerActive(true);
    setScanStatusResult(null);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-container');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            executeAttendanceScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error('Erreur démarrage caméra QR:', err);
        setIsScannerActive(false);
      }
    }, 200);
  };

  const stopQrScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Erreur arrêt scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScannerActive(false);
  };

  // Annuler une validation de présence
  const handleCancelAttendance = async (attendanceRecord: DbAttendance) => {
    if (!window.confirm(`Confirmez-vous l'annulation du pointage de ${attendanceRecord.participant?.full_name || 'ce participant'} pour la session ${attendanceRecord.session_key} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('participant_id', attendanceRecord.participant_id)
        .eq('session_key', attendanceRecord.session_key);

      if (error) {
        alert(`Erreur lors de l'annulation: ${error.message}`);
      } else {
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // ─── PAIEMENT EN ESPÈCES ───────────────────────────────────────
  const handleConfirmCashPayment = async () => {
    if (!cashPaymentParticipant) return;
    setIsSubmittingCashPayment(true);
    setCashPaymentSuccessMsg('');

    try {
      const { data, error } = await supabase.rpc('admin_record_cash_payment', {
        p_participant_id: cashPaymentParticipant.id,
        p_note: cashPaymentNote.trim() || null
      });

      if (error) {
        alert(`Erreur enregistrement espèces: ${error.message}`);
      } else {
        setCashPaymentSuccessMsg(`Paiement de ${cashPaymentParticipant.totalFee.toLocaleString('fr-FR')} FCFA validé avec succès !`);
        logAdminActivity('ENCAISSEMENT_ESPECES', {
          montant: cashPaymentParticipant.totalFee,
          matricule: cashPaymentParticipant.matricule,
          nom: cashPaymentParticipant.fullName,
          note: cashPaymentNote
        }, 'PARTICIPANT', cashPaymentParticipant.matricule);
        setTimeout(() => {
          setCashPaymentParticipant(null);
          setCashPaymentNote('');
          setCashPaymentSuccessMsg('');
          loadAllDataFromSupabase();
        }, 1200);
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message || 'Impossible d\'enregistrer le paiement'}`);
    } finally {
      setIsSubmittingCashPayment(false);
    }
  };

  // ─── MODIFICATION D'UN PARTICIPANT ─────────────────────────────
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const openEditModal = (p: Participant) => {
    setSelectedParticipantForEdit(p);
    setEditFormData({
      fullName: p.fullName,
      gender: p.gender,
      phone: p.phone,
      whatsapp: p.whatsapp,
      email: p.email,
      schoolName: p.schoolName,
      schoolLevel: p.schoolLevel,
      birthDate: p.birthDate,
      parentName: p.parentName,
      parentContact: p.parentContact,
      transportMode: p.transportMode,
      poloSize: p.poloSize,
      poloColor: p.poloColor,
      notes: p.notes
    });
  };

  const handleSaveParticipantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantForEdit) return;
    setIsSavingEdit(true);

    try {
      const { error } = await supabase
        .from('participants')
        .update({
          full_name: editFormData.fullName,
          gender: editFormData.gender,
          phone: editFormData.phone,
          whatsapp: editFormData.whatsapp,
          email: editFormData.email || null,
          school_name: editFormData.schoolName || null,
          school_level: editFormData.schoolLevel || null,
          birth_date: editFormData.birthDate || null,
          parent_name: editFormData.parentName || null,
          parent_contact: editFormData.parentContact || null,
          transport_mode: editFormData.transportMode || null,
          polo_size: editFormData.poloSize || null,
          polo_color: editFormData.poloColor || null,
          notes: editFormData.notes || null
        })
        .eq('id', selectedParticipantForEdit.id);

      if (error) {
        alert(`Erreur mise à jour: ${error.message}`);
      } else {
        setSelectedParticipantForEdit(null);
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ─── SUPPRESSION D'UN PARTICIPANT ──────────────────────────────
  const handleDeleteParticipant = async (p: Participant) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du participant ${p.fullName} (${p.matricule}) ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', p.id);

      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key') || error.message.includes('payments')) {
          alert('Suppression impossible : ce participant a des paiements enregistrés.');
        } else {
          alert(`Erreur lors de la suppression: ${error.message}`);
        }
      } else {
        if (selectedParticipantForDetail?.id === p.id) {
          setSelectedParticipantForDetail(null);
        }
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // ─── AJOUT MANUEL D'UN PARTICIPANT ─────────────────────────────
  const [newParticipantForm, setNewParticipantForm] = useState({
    fullName: '',
    gender: 'homme' as 'homme' | 'femme',
    phone: '',
    whatsapp: '',
    email: '',
    type: 'seminariste' as ParticipantType,
    subCommittee: 'Sous-Comité Gagnoa',
    schoolLevel: 'Secondaire',
    schoolName: '',
    birthDate: '',
    parentName: '',
    parentContact: '',
    hasPolo: false,
    poloSize: 'M',
    poloColor: 'Blanc',
    hasMedicalCondition: false,
    medicalDetails: '',
    notes: ''
  });
  const [isSubmittingNewParticipant, setIsSubmittingNewParticipant] = useState(false);

  const handleCreateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantForm.fullName || !newParticipantForm.phone) {
      alert('Veuillez renseigner au moins le nom et le contact.');
      return;
    }

    setIsSubmittingNewParticipant(true);
    try {
      // Frais lus dans sub_committees et seminar_config 'pricing'
      const matchedSc = subCommitteesDb.find(s => s.name === newParticipantForm.subCommittee);
      const regFee = newParticipantForm.type === 'formateur' 
        ? 0 
        : (newParticipantForm.type === 'commission' ? (seminarConfigDb.pricing?.commission || 2000) : (matchedSc?.registration_fee || 2000));
      
      const poloFee = newParticipantForm.hasPolo ? (seminarConfigDb.pricing?.polo || 2500) : 0;
      const initialPaymentStatus = newParticipantForm.type === 'formateur' ? 'gratuit' : 'en_attente';
      const clothingType = newParticipantForm.hasPolo ? 'polo' : 'aucun';

      const { data, error } = await supabase
        .from('participants')
        .insert({
          full_name: newParticipantForm.fullName.trim(),
          gender: newParticipantForm.gender,
          phone: newParticipantForm.phone.trim(),
          whatsapp: newParticipantForm.whatsapp.trim() || newParticipantForm.phone.trim(),
          email: newParticipantForm.email.trim() || null,
          participant_type: newParticipantForm.type,
          sub_committee: newParticipantForm.subCommittee,
          school_level: newParticipantForm.schoolLevel,
          school_name: newParticipantForm.schoolName.trim() || null,
          birth_date: newParticipantForm.birthDate || null,
          parent_name: newParticipantForm.parentName.trim() || null,
          parent_contact: newParticipantForm.parentContact.trim() || null,
          has_medical_condition: newParticipantForm.hasMedicalCondition,
          medical_details: newParticipantForm.hasMedicalCondition ? newParticipantForm.medicalDetails : null,
          has_polo: newParticipantForm.hasPolo,
          clothing_type: clothingType,
          polo_size: newParticipantForm.hasPolo ? newParticipantForm.poloSize : null,
          polo_color: newParticipantForm.hasPolo ? newParticipantForm.poloColor : null,
          registration_fee: regFee,
          polo_fee: poloFee,
          payment_status: initialPaymentStatus,
          notes: newParticipantForm.notes.trim() || null
        })
        .select()
        .single();

      if (error) {
        alert(`Erreur création: ${error.message}`);
      } else {
        setIsAddParticipantModalOpen(false);
        setNewParticipantForm({
          fullName: '',
          gender: 'homme',
          phone: '',
          whatsapp: '',
          email: '',
          type: 'seminariste',
          subCommittee: 'Sous-Comité Gagnoa',
          schoolLevel: 'Secondaire',
          schoolName: '',
          birthDate: '',
          parentName: '',
          parentContact: '',
          hasPolo: false,
          poloSize: 'M',
          poloColor: 'Blanc',
          hasMedicalCondition: false,
          medicalDetails: '',
          notes: ''
        });
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    } finally {
      setIsSubmittingNewParticipant(false);
    }
  };

  // ─── HÉBERGEMENT (DORTOIRS) ────────────────────────────────────
  const [newDormitoryForm, setNewDormitoryForm] = useState({ name: '', capacity: 20, gender: 'homme' as 'homme' | 'femme' });
  const [selectedDormitoryForDetail, setSelectedDormitoryForDetail] = useState<Dormitory | null>(null);
  const [isAutoAssigningDorms, setIsAutoAssigningDorms] = useState(false);
  const [autoAssignPreview, setAutoAssignPreview] = useState<{ countHommes: number; countFemmes: number } | null>(null);

  // Participants sans dortoir
  const participantsWithoutDorm = useMemo(() => {
    return participants.filter(p => !p.dormitory);
  }, [participants]);

  // Créer un dortoir
  const handleCreateDormitory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDormitoryForm.name) return;

    try {
      const { error } = await supabase
        .from('dormitories')
        .insert({
          name: newDormitoryForm.name.trim(),
          capacity: Number(newDormitoryForm.capacity),
          gender: newDormitoryForm.gender
        });

      if (error) {
        alert(`Erreur création dortoir: ${error.message}`);
      } else {
        setNewDormitoryForm({ name: '', capacity: 20, gender: 'homme' });
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // Supprimer un dortoir (refusé si occupé)
  const handleDeleteDormitory = async (dorm: Dormitory) => {
    const occupants = participants.filter(p => p.dormitory === dorm.name);
    if (occupants.length > 0) {
      alert(`Suppression refusée : le dortoir "${dorm.name}" est actuellement occupé par ${occupants.length} participant(s). Veuillez d'abord les retirer.`);
      return;
    }

    if (!window.confirm(`Confirmez-vous la suppression du dortoir "${dorm.name}" ?`)) return;

    try {
      const { error } = await supabase
        .from('dormitories')
        .delete()
        .eq('name', dorm.name);

      if (error) {
        alert(`Erreur: ${error.message}`);
      } else {
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // Retirer un participant d'un dortoir
  const handleRemoveParticipantFromDorm = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ dormitory: null })
        .eq('id', participantId);

      if (error) {
        alert(`Erreur: ${error.message}`);
      } else {
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // Assigner un participant à un dortoir en un clic
  const handleAssignParticipantToDorm = async (participantId: string, dormName: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({ dormitory: dormName })
        .eq('id', participantId);

      if (error) {
        alert(`Erreur: ${error.message}`);
      } else {
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // Attribution automatique des dortoirs par genre
  const handleAutoAssignDormitories = async () => {
    const unassignedHommes = participantsWithoutDorm.filter(p => p.gender === 'homme');
    const unassignedFemmes = participantsWithoutDorm.filter(p => p.gender === 'femme');

    if (!window.confirm(`Voulez-vous lancer l'attribution automatique pour ${unassignedHommes.length} frère(s) et ${unassignedFemmes.length} sœur(s) sans dortoir dans l'ordre de capacité ?`)) {
      return;
    }

    setIsAutoAssigningDorms(true);
    try {
      // Dortoirs hommes
      const dormsH = dormitories.filter(d => d.gender === 'homme');
      let idxH = 0;
      for (const p of unassignedHommes) {
        // trouver un dortoir homme avec place
        const targetDorm = dormsH.find(d => {
          const occ = participants.filter(x => x.dormitory === d.name).length;
          return occ < d.capacity;
        });
        if (targetDorm) {
          await supabase.from('participants').update({ dormitory: targetDorm.name }).eq('id', p.id);
        }
      }

      // Dortoirs femmes
      const dormsF = dormitories.filter(d => d.gender === 'femme');
      for (const p of unassignedFemmes) {
        const targetDorm = dormsF.find(d => {
          const occ = participants.filter(x => x.dormitory === d.name).length;
          return occ < d.capacity;
        });
        if (targetDorm) {
          await supabase.from('participants').update({ dormitory: targetDorm.name }).eq('id', p.id);
        }
      }

      alert('Attribution automatique terminée !');
      loadAllDataFromSupabase();
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    } finally {
      setIsAutoAssigningDorms(false);
    }
  };

  // ─── CONFIGURATION SERFIG (STEP 9) ─────────────────────────────
  const [regIsOpen, setRegIsOpen] = useState<boolean>(true);
  const [regDeadline, setRegDeadline] = useState<string>('2027-04-16');
  const [maxCapacity, setMaxCapacity] = useState<number>(450);
  const [poloPrice, setPoloPrice] = useState<number>(2500);
  const [tshirtPrice, setTshirtPrice] = useState<number>(2000);
  const [commissionPrice, setCommissionPrice] = useState<number>(2000);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (seminarConfigDb.registration) {
      setRegIsOpen(Boolean(seminarConfigDb.registration.open));
      if (seminarConfigDb.registration.deadline) setRegDeadline(seminarConfigDb.registration.deadline);
    }
    if (seminarConfigDb.capacity?.max) {
      setMaxCapacity(seminarConfigDb.capacity.max);
    }
    if (seminarConfigDb.pricing) {
      if (seminarConfigDb.pricing.polo) setPoloPrice(seminarConfigDb.pricing.polo);
      if (seminarConfigDb.pricing.tshirt) setTshirtPrice(seminarConfigDb.pricing.tshirt);
      if (seminarConfigDb.pricing.commission) setCommissionPrice(seminarConfigDb.pricing.commission);
    }
  }, [seminarConfigDb]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg('');

    try {
      // 1. Sauvegarder registration
      await supabase.from('seminar_config').upsert({
        config_key: 'registration',
        config_value: { open: regIsOpen, deadline: regDeadline },
        is_public: true
      });

      // 2. Sauvegarder capacity
      await supabase.from('seminar_config').upsert({
        config_key: 'capacity',
        config_value: { max: Number(maxCapacity) },
        is_public: true
      });

      // 3. Sauvegarder pricing
      await supabase.from('seminar_config').upsert({
        config_key: 'pricing',
        config_value: {
          polo: Number(poloPrice),
          tshirt: Number(tshirtPrice),
          commission: Number(commissionPrice),
          formateur: 0
        },
        is_public: true
      });

      setConfigSuccessMsg('Configuration sauvegardée avec succès dans la base Supabase.');
      setTimeout(() => setConfigSuccessMsg(''), 3000);
      loadAllDataFromSupabase();
    } catch (err: any) {
      alert(`Erreur enregistrement config: ${err?.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Sous-comité : ajouter / activer / modifier
  const [newSubCommitteeName, setNewSubCommitteeName] = useState('');
  const [newSubCommitteeFee, setNewSubCommitteeFee] = useState(2000);

  const handleAddSubCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCommitteeName) return;

    try {
      const { error } = await supabase
        .from('sub_committees')
        .insert({
          name: newSubCommitteeName.trim(),
          registration_fee: Number(newSubCommitteeFee),
          is_active: true,
          sort_order: subCommitteesDb.length + 1
        });

      if (error) {
        alert(`Erreur: ${error.message}`);
      } else {
        setNewSubCommitteeName('');
        loadAllDataFromSupabase();
      }
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  const handleToggleSubCommittee = async (sc: any) => {
    try {
      const { error } = await supabase
        .from('sub_committees')
        .update({ is_active: !sc.is_active })
        .eq('name', sc.name);

      if (error) alert(`Erreur: ${error.message}`);
      else loadAllDataFromSupabase();
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    }
  };

  // ─── CALCULS DU DASHBOARD (STEP 2) ─────────────────────────────
  const stats = useMemo(() => {
    const total = participants.length;
    const seminaristes = participants.filter(p => p.type === 'seminariste').length;
    const formateurs = participants.filter(p => p.type === 'formateur').length;
    const commission = participants.filter(p => p.type === 'commission').length;
    const hommes = participants.filter(p => p.gender === 'homme').length;
    const femmes = participants.filter(p => p.gender === 'femme').length;

    const payes = participants.filter(p => p.paymentStatus === 'paye').length;
    const enAttente = participants.filter(p => p.paymentStatus === 'en_attente').length;
    const gratuits = participants.filter(p => p.paymentStatus === 'gratuit').length;

    // Argent encaissé : somme des payments 'succeeded' liés à un participant
    const encaisse = payments
      .filter(pay => pay.status === 'succeeded' && pay.participant_id)
      .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

    // Argent attendu : somme des total_fee des non-gratuits
    const attendu = participants
      .filter(p => p.paymentStatus !== 'gratuit')
      .reduce((sum, p) => sum + (Number(p.totalFee) || 0), 0);

    const reste = Math.max(0, attendu - encaisse);

    // Détail par moyen de paiement
    const paymentMethodsDetail: Record<string, number> = {
      'Wave': 0,
      'Orange Money': 0,
      'MTN MoMo': 0,
      'Moov Money': 0,
      'Espèces': 0
    };

    payments.filter(p => p.status === 'succeeded').forEach(pay => {
      const prov = pay.provider || 'Autre';
      if (prov.includes('Wave')) paymentMethodsDetail['Wave'] = (paymentMethodsDetail['Wave'] || 0) + pay.amount;
      else if (prov.includes('Orange')) paymentMethodsDetail['Orange Money'] = (paymentMethodsDetail['Orange Money'] || 0) + pay.amount;
      else if (prov.includes('MTN')) paymentMethodsDetail['MTN MoMo'] = (paymentMethodsDetail['MTN MoMo'] || 0) + pay.amount;
      else if (prov.includes('Moov')) paymentMethodsDetail['Moov Money'] = (paymentMethodsDetail['Moov Money'] || 0) + pay.amount;
      else if (prov.includes('cash') || prov.includes('Espèces')) paymentMethodsDetail['Espèces'] = (paymentMethodsDetail['Espèces'] || 0) + pay.amount;
    });

    // Dons
    const dons = payments
      .filter(p => p.status === 'succeeded' && p.donation_id)
      .reduce((sum, p) => sum + p.amount, 0);

    // Bloc "À traiter"
    const now = new Date().getTime();
    const fortyEightHoursAgo = now - (48 * 60 * 60 * 1000);
    const pendingOver48h = participants.filter(p => {
      if (p.paymentStatus !== 'en_attente' || p.totalFee <= 0) return false;
      const regTime = new Date(p.registeredAt).getTime();
      return !isNaN(regTime) && regTime < fortyEightHoursAgo;
    });

    const dormsOver90 = dormitories.filter(d => {
      const occ = participants.filter(p => p.dormitory === d.name).length;
      return (occ / d.capacity) >= 0.9;
    });

    const withoutDorm = participantsWithoutDorm;

    const isRegClosedOrExpired = Boolean(
      seminarConfigDb.registration?.open === false || 
      (seminarConfigDb.registration?.deadline && new Date() > new Date(seminarConfigDb.registration.deadline))
    );

    // Activité du jour
    const todayStr = new Date().toISOString().split('T')[0];
    const registeredToday = participants.filter(p => p.registeredAt.startsWith(todayStr)).length;
    const arrivedToday = attendanceRecords.filter(a => a.session_key === 'arrivee' && a.scanned_at.startsWith(todayStr)).length;
    const mealsToday = attendanceRecords.filter(a => a.session_key.startsWith(`repas:${todayStr}`) && a.scanned_at.startsWith(todayStr)).length;

    return {
      total,
      seminaristes,
      formateurs,
      commission,
      hommes,
      femmes,
      payes,
      enAttente,
      gratuits,
      encaisse,
      attendu,
      reste,
      paymentMethodsDetail,
      dons,
      pendingOver48h,
      dormsOver90,
      withoutDorm,
      isRegClosedOrExpired,
      registeredToday,
      arrivedToday,
      mealsToday,
      capacityMax: seminarConfigDb.capacity?.max || 450
    };
  }, [participants, payments, dormitories, attendanceRecords, seminarConfigDb, participantsWithoutDorm]);

  // ─── FILTRAGE DES PARTICIPANTS (STEP 3) ────────────────────────
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Recherche
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.fullName.toLowerCase().includes(q);
        const matchMatricule = p.matricule.toLowerCase().includes(q);
        const matchPhone = p.phone.toLowerCase().includes(q);
        if (!matchName && !matchMatricule && !matchPhone) return false;
      }

      // Type
      if (filterType !== 'all' && p.type !== filterType) return false;

      // Statut paiement
      if (filterPayment !== 'all' && p.paymentStatus !== filterPayment) return false;

      // Sous-comité
      if (filterSubCommittee !== 'all' && p.subCommittee !== filterSubCommittee) return false;

      // Arrivé
      if (filterCheckIn === 'arrived' && !p.checkedIn) return false;
      if (filterCheckIn === 'not_arrived' && p.checkedIn) return false;

      // Dortoir
      if (filterDormitory === 'sans_dortoir' && p.dormitory) return false;
      if (filterDormitory !== 'all' && filterDormitory !== 'sans_dortoir' && p.dormitory !== filterDormitory) return false;

      // Tenue
      if (filterClothing === 'polo' && !p.hasPolo) return false;
      if (filterClothing === 'aucun' && p.hasPolo) return false;

      return true;
    });
  }, [participants, searchQuery, filterType, filterPayment, filterSubCommittee, filterCheckIn, filterDormitory, filterClothing]);

  // ─── EXPORT CSV PARTICIPANTS (STEP 3) ──────────────────────────
  const handleExportParticipantsCSV = () => {
    const headers = [
      'Matricule',
      'Nom complet',
      'Genre',
      'Rôle / Profil',
      'Sous-comité',
      'Contact Téléphone',
      'WhatsApp',
      'E-mail',
      'Établissement',
      'Niveau',
      'Date de Naissance',
      'Âge',
      'Contact Parent / Tuteur',
      'Dortoir assigné',
      'Moyen de transport',
      'Commande Polo',
      'Taille Polo',
      'Couleur Polo',
      'Frais Inscription (FCFA)',
      'Frais Polo (FCFA)',
      'Total à Payer (FCFA)',
      'Statut Paiement',
      'Moyen de Paiement',
      'Arrivé au Séminaire',
      'Date Inscription',
      'Observations'
    ];

    const rows = filteredParticipants.map(p => [
      p.matricule || '—',
      p.fullName || '—',
      p.gender === 'femme' ? 'Sœur (Féminin)' : 'Frère (Masculin)',
      p.type === 'formateur' ? 'Formateur / Aîné' : p.type === 'commission' ? 'Membre Commission' : 'Séminariste',
      p.subCommittee || '—',
      p.phone || '—',
      p.whatsapp || '—',
      p.email || '—',
      p.schoolName || '—',
      p.schoolLevel || '—',
      p.birthDate || '—',
      calculateAge(p.birthDate) !== null ? `${calculateAge(p.birthDate)} ans` : '—',
      p.parentName ? `${p.parentName} (${p.parentContact || '—'})` : (p.parentContact || '—'),
      p.dormitory || 'Non assigné',
      p.transportMode || '—',
      p.hasPolo ? 'OUI' : 'NON',
      p.hasPolo ? (p.poloSize || '—') : '—',
      p.hasPolo ? (p.poloColor || '—') : '—',
      p.registrationFee ?? 0,
      p.poloFee ?? 0,
      p.totalFee ?? 0,
      p.paymentStatus === 'paye' ? 'PAYÉ' : p.paymentStatus === 'gratuit' ? 'GRATUIT' : 'EN ATTENTE',
      p.paymentMethod || '—',
      p.checkedIn ? 'OUI' : 'NON',
      p.registeredAt ? new Date(p.registeredAt).toLocaleDateString('fr-FR') : '—',
      p.notes || '—'
    ]);

    // Séparateur ";" et BOM UTF-8
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SERFIG_2027_Participants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── EXPORT CSV PAIEMENTS (STEP 4) ─────────────────────────────
  const handleExportPaymentsCSV = () => {
    const headers = ['ID Paiement', 'Date & Heure', 'Participant / Donateur', 'Matricule', 'Sous-comité', 'Moyen', 'Montant (FCFA)', 'Statut', 'Référence'];
    const rows = payments.map(pay => [
      pay.id,
      new Date(pay.created_at).toLocaleString('fr-FR'),
      pay.participant?.full_name || pay.donation?.donor_name || '—',
      pay.participant?.matricule || '—',
      pay.participant?.sub_committee || '—',
      pay.provider || '—',
      pay.amount,
      pay.status,
      pay.client_reference || '—'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SERFIG_2027_Paiements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── EXPORT CSV FOURNISSEUR TENUES (STEP 7) ────────────────────
  const handleExportClothingCSV = () => {
    const headers = ['Nom complet', 'Genre', 'Matricule', 'Sous-comité', 'Type de vêtement', 'Taille', 'Couleur', 'Statut Paiement', 'Téléphone'];
    const poloBuyers = participants.filter(p => p.hasPolo);
    const rows = poloBuyers.map(p => [
      p.fullName,
      p.gender === 'femme' ? 'Sœur' : 'Frère',
      p.matricule,
      p.subCommittee,
      'Polo officiel',
      p.poloSize || 'M',
      p.poloColor || 'Blanc',
      p.paymentStatus === 'paye' ? 'PAYÉ' : 'EN ATTENTE',
      p.phone
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SERFIG_2027_Commande_Polos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── RÉSUMÉ POLOS PAR TAILLE & COULEUR (STEP 7) ────────────────
  const clothingSummary = useMemo(() => {
    const poloBuyers = participants.filter(p => p.hasPolo);
    const sizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const colors = ['Blanc', 'Noir', 'Orange', 'Vert'];

    const matrix: Record<string, Record<string, number>> = {};
    sizes.forEach(s => {
      matrix[s] = {};
      colors.forEach(c => {
        matrix[s][c] = 0;
      });
    });

    let totalOrdered = 0;
    poloBuyers.forEach(p => {
      const size = sizes.includes(p.poloSize || '') ? p.poloSize! : 'M';
      const color = colors.includes(p.poloColor || '') ? p.poloColor! : 'Blanc';
      matrix[size][color] = (matrix[size][color] || 0) + 1;
      totalOrdered++;
    });

    const sizeTotals: Record<string, number> = {};
    sizes.forEach(s => {
      sizeTotals[s] = colors.reduce((sum, c) => sum + (matrix[s][c] || 0), 0);
    });

    const colorTotals: Record<string, number> = {};
    colors.forEach(c => {
      colorTotals[c] = sizes.reduce((sum, s) => sum + (matrix[s][c] || 0), 0);
    });

    return { sizes, colors, matrix, sizeTotals, colorTotals, totalOrdered };
  }, [participants]);

  // Si on est en train de vérifier l'authentification initiale
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto border-2 border-orange-500 animate-spin">
            <RefreshCw className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Vérification de la session administrateur...</p>
        </div>
      </div>
    );
  }

  // ─── ÉCRAN DE CONNEXION ADMIN (SI NON AUTHENTIFIÉ) ─────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-white p-2 border-2 border-orange-400 mx-auto shadow-md flex items-center justify-center mb-4">
            <img 
              src="/assets/aistudio/1771719145696_b78691d8.png" 
              alt="Logo homologué AEEMCI" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-2">
            Espace Sécurisé
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Administration SERFIG 2027
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (Gôh)
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {authError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium leading-relaxed">{authError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Adresse E-mail administrateur
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="aeemcisrgoh@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Accéder au Tableau de Bord</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={onBackToPublic}
                className="text-xs font-semibold text-slate-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour au site public</span>
              </button>

              <span className="text-[11px] text-slate-400">
                AEEMCI • Région du Gôh
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDU PRINCIPAL DE L'ESPACE ADMIN (PAGE DÉDIÉE) ───────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24 md:pb-8">
      {/* ─── EN-TÊTE STICKY DE L'ADMIN ────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Gauche : Logo homologué + Titre */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border border-orange-200 bg-white p-1 flex items-center justify-center shadow-xs shrink-0">
              <img 
                src="/assets/aistudio/1771719145696_b78691d8.png" 
                alt="Logo homologué AEEMCI" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  SERFIG 2027
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[11px] font-black uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {activeTab === 'dashboard' && 'Vue d\'ensemble & Statistiques'}
                {activeTab === 'participants' && 'Gestion des Participants'}
                {activeTab === 'payments' && 'Gestion des Paiements & Trésorerie'}
                {activeTab === 'checkin' && 'Pointage & Émargement QR'}
                {activeTab === 'dormitories' && 'Hébergement & Dortoirs'}
                {activeTab === 'clothing' && 'Commandes de Tenues & Polos'}
                {activeTab === 'printables' && 'Listes Officielles A4 & Badges'}
                {activeTab === 'config' && 'Paramètres & Configuration'}
                {activeTab === 'account' && 'Mon Compte Administrateur'}
                {activeTab === 'messaging' && 'Messagerie & Communication WhatsApp / SMS (Phase 2)'}
                {activeTab === 'medical' && 'Commission Médicale & Fiches Santé (Phase 2)'}
                {activeTab === 'schedule' && 'Programme Officiel du Séminaire (Phase 2)'}
                {activeTab === 'activity' && 'Journal d\'Activité & Audit (Phase 2)'}
                {activeTab === 'certificates' && 'Attestations & Bilan Final (Phase 2)'}
              </p>
            </div>
          </div>

          {/* Droite : Pastille statut inscriptions + Menu "⋯" */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Pastille Inscriptions ouvertes / fermées lue dans seminar_config 'registration' */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              stats.isRegClosedOrExpired 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${stats.isRegClosedOrExpired ? 'bg-red-500' : 'bg-emerald-500'}`} />
              <span className="hidden sm:inline">
                {stats.isRegClosedOrExpired ? 'Inscriptions fermées' : 'Inscriptions ouvertes'}
              </span>
              <span className="sm:hidden">
                {stats.isRegClosedOrExpired ? 'Fermé' : 'Ouvert'}
              </span>
            </span>

            {/* Bouton Actualiser */}
            <button
              onClick={loadAllDataFromSupabase}
              disabled={isLoading}
              title={`Dernière actualisation : ${lastRefreshedAt.toLocaleTimeString('fr-FR')}`}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 text-orange-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Actualiser</span>
            </button>

            {/* Menu "⋯" contenant Actualiser, Retour et Déconnexion (UNE seule fois) */}
            <div className="relative">
              <button
                onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Options"
              >
                <MoreHorizontal className="w-5 h-5 text-slate-600" />
              </button>

              {isHeaderDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setIsHeaderDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                    Connecté : <span className="font-bold text-slate-800">{userEmail}</span>
                  </div>

                  <button
                    onClick={loadAllDataFromSupabase}
                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    <span>Actualiser les données</span>
                  </button>

                  <button
                    onClick={onBackToPublic}
                    className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Voir le portail public</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── CORPS PRINCIPAL DE L'ADMIN ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1">
        {/* Navigation Desktop Élégante (Couleurs Accueil : Blanc, Orange, Vert) */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dashboard' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Accueil</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'participants' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participants</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'payments' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Paiements</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'checkin' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pointage</span>
            {offlineScans.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dormitories')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dormitories' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dortoirs</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clothing')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'clothing' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Tenues</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'schedule' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Programme</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messaging')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'messaging' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Messagerie</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medical')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'medical' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Santé</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'certificates' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Attestations & Bilan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('printables')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'printables' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Listes A4</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'activity' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Journal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'config' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'account' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon Compte</span>
          </button>
        </div>
        {dataError && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>Erreur de communication Supabase : {dataError}</span>
            </div>
            <button 
              onClick={loadAllDataFromSupabase}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ─── ONGLET 1 : ACCUEIL / TABLEAU DE BORD (STEP 2) ────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* État vide si 0 participant */}
            {participants.length === 0 && !isLoading && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 border border-orange-200">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun participant inscrit pour l'instant</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                  Le séminaire est configuré et prêt. Partagez le lien du formulaire public pour enregistrer les premiers séminaristes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      alert('Lien du formulaire copié dans le presse-papier !');
                    }}
                    className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Copier le lien public</span>
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Assalamu alaykum ! Les inscriptions pour le SERFIG 2027 (Gagnoa) sont ouvertes : ${window.location.origin}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Partager sur WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Cartes Cliquables Métriques Globales */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Effectif & Participation
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Cliquez sur une carte pour filtrer
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* Total inscrits + barre de remplissage */}
                <div 
                  onClick={() => { setFilterType('all'); setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all cursor-pointer col-span-2 sm:col-span-1"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Total Inscrits</span>
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stats.total}
                  </div>
                  {/* Barre de remplissage X / capacité */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Capacité</span>
                      <span className="font-bold text-slate-700">{stats.total} / {stats.capacityMax}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (stats.total / stats.capacityMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Séminaristes */}
                <div 
                  onClick={() => { setFilterType('seminariste'); setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-orange-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Séminaristes</span>
                    <User className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.seminaristes}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Élèves & Étudiants</p>
                </div>

                {/* Formateurs */}
                <div 
                  onClick={() => { setFilterType('formateur'); setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Formateurs</span>
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.formateurs}</div>
                  <p className="text-[11px] text-blue-600 font-semibold mt-1">100% Gratuits</p>
                </div>

                {/* Commission */}
                <div 
                  onClick={() => { setFilterType('commission'); setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Commission</span>
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.commission}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Organisation</p>
                </div>

                {/* Frères */}
                <div 
                  onClick={() => { setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Frères</span>
                    <span className="text-xs">🚹</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.hommes}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Masculin</p>
                </div>

                {/* Sœurs */}
                <div 
                  onClick={() => { setActiveTab('participants'); }}
                  className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Sœurs</span>
                    <span className="text-xs">🚺</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{stats.femmes}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Féminin</p>
                </div>
              </div>
            </div>

            {/* Finances & Trésorerie */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Finances & Trésorerie (en FCFA)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Encaissé */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Encaissé Réel</span>
                    <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">✓ Payé</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                    {stats.encaisse.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {stats.payes} participants avec paiement confirmé
                  </p>
                </div>

                {/* Attendu */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Attendu Total</span>
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stats.attendu.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Somme des frais des non-gratuits
                  </p>
                </div>

                {/* Reste à percevoir */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Reste à percevoir</span>
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">
                    {stats.reste.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {stats.enAttente} paiements en attente
                  </p>
                </div>

                {/* Carte Dons */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold">Dons & Soutiens</span>
                    <span className="text-xs">❤️</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                    {stats.dons.toLocaleString('fr-FR')} <span className="text-sm font-bold text-slate-500">FCFA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Contributions extérieures reçues
                  </p>
                </div>
              </div>

              {/* Détail par moyen de paiement */}
              <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-600 uppercase tracking-wider">
                  Moyens de paiement encaissés :
                </span>
                <div className="flex flex-wrap items-center gap-4">
                  {Object.entries(stats.paymentMethodsDetail).map(([provider, amount]) => (
                    <div key={provider} className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">{provider} :</span>
                      <span className="font-bold text-slate-900">{amount.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BLOC "À TRAITER" */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>Dossiers à Traiter & Alertes</span>
                </h3>
                <span className="text-xs text-slate-500">
                  Relances, dortoirs et statuts
                </span>
              </div>

              {stats.pendingOver48h.length === 0 && stats.dormsOver90.length === 0 && stats.withoutDorm.length === 0 && !stats.isRegClosedOrExpired ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs sm:text-sm text-emerald-800 font-bold">
                    Tout est à jour ✓ (aucun paiement bloqué &gt; 48h, hébergements conformes)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Paiements en attente > 48h */}
                  {stats.pendingOver48h.map(p => (
                    <div key={p.id} className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{p.fullName}</span>
                          <span className="text-xs text-slate-500">({p.matricule})</span>
                          <span className="text-xs font-bold text-orange-700">{p.totalFee.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Inscrit le {new Date(p.registeredAt).toLocaleDateString('fr-FR')} • Sous-comité : {p.subCommittee}
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/225${p.whatsapp.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Assalamu alaykum cher(e) ${p.fullName}. Nous vous rappelons que votre inscription au SERFIG 2027 (${p.matricule}) d'un montant de ${p.totalFee} FCFA est toujours en attente de paiement. Veuillez nous contacter au (+225) 0788609677 pour finaliser votre participation.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Relancer par WhatsApp</span>
                      </a>
                    </div>
                  ))}

                  {/* Dortoirs remplis à plus de 90% */}
                  {stats.dormsOver90.map(d => (
                    <div key={d.name} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                      <span>⚠️ Le dortoir <strong>{d.name}</strong> ({d.gender === 'femme' ? 'Sœurs' : 'Frères'}) est rempli à plus de 90%.</span>
                      <button onClick={() => setActiveTab('dormitories')} className="font-bold underline cursor-pointer">Voir les dortoirs</button>
                    </div>
                  ))}

                  {/* Participants sans dortoir */}
                  {stats.withoutDorm.length > 0 && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
                      <span>ℹ️ Il y a <strong>{stats.withoutDorm.length}</strong> participant(s) sans dortoir assigné.</span>
                      <button onClick={() => setActiveTab('dormitories')} className="font-bold underline cursor-pointer">Assigner les dortoirs</button>
                    </div>
                  )}

                  {/* Inscriptions fermées */}
                  {stats.isRegClosedOrExpired && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
                      <span>⛔ Les inscriptions sont actuellement fermées ou la date limite est expirée.</span>
                      <button onClick={() => setActiveTab('config')} className="font-bold underline cursor-pointer">Modifier dans Réglages</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Répartition complète par Sous-comité (liste sans défilement interne) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                Répartition par Sous-Comité (Inscrits & Payés)
              </h3>
              <div className="space-y-4">
                {subCommitteesDb.map(sc => {
                  const scParticipants = participants.filter(p => p.subCommittee.toLowerCase().includes(sc.name.toLowerCase().replace('sous-comité ', '')));
                  const countInscrits = scParticipants.length;
                  const countPayes = scParticipants.filter(p => p.paymentStatus === 'paye').length;
                  const pct = stats.total > 0 ? (countInscrits / stats.total) * 100 : 0;

                  return (
                    <div key={sc.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{sc.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{countInscrits} inscrit(s)</span>
                          <span className="font-semibold text-emerald-700">({countPayes} payé(s))</span>
                          <span className="text-slate-400 font-mono text-[11px] w-12 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 rounded-l-full transition-all duration-300" 
                          style={{ width: `${stats.total > 0 ? (countPayes / stats.total) * 100 : 0}%` }}
                          title={`${countPayes} payés`}
                        />
                        <div 
                          className="h-full bg-orange-400 transition-all duration-300" 
                          style={{ width: `${stats.total > 0 ? ((countInscrits - countPayes) / stats.total) * 100 : 0}%` }}
                          title={`${countInscrits - countPayes} en attente`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activité du Jour */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Inscriptions du jour</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{stats.registeredToday}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Arrivées enregistrées</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{stats.arrivedToday}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase">Repas validés aujourd'hui</span>
                <p className="text-2xl font-black text-orange-600 mt-1">{stats.mealsToday}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 2 : PARTICIPANTS (STEP 3) ─────────────────────── */}
        {activeTab === 'participants' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Barre d'outils, Recherche & Actions */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Recherche */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, matricule ou téléphone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Boutons Actions : Ajouter & Exporter CSV */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsAddParticipantModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter</span>
                  </button>

                  <button
                    onClick={handleExportParticipantsCSV}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filtres combinables */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {/* Profil */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Tous les profils</option>
                  <option value="seminariste">Séminaristes</option>
                  <option value="formateur">Formateurs</option>
                  <option value="commission">Commission</option>
                </select>

                {/* Paiement */}
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Tous les paiements</option>
                  <option value="paye">Payés</option>
                  <option value="en_attente">En attente</option>
                  <option value="gratuit">Gratuits</option>
                </select>

                {/* Sous-comité */}
                <select
                  value={filterSubCommittee}
                  onChange={(e) => setFilterSubCommittee(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Tous sous-comités</option>
                  {subCommitteesDb.map(sc => (
                    <option key={sc.name} value={sc.name}>{sc.name}</option>
                  ))}
                </select>

                {/* Arrivée */}
                <select
                  value={filterCheckIn}
                  onChange={(e) => setFilterCheckIn(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Arrivée (Tous)</option>
                  <option value="arrived">Arrivé sur site</option>
                  <option value="not_arrived">Non arrivé</option>
                </select>

                {/* Dortoir */}
                <select
                  value={filterDormitory}
                  onChange={(e) => setFilterDormitory(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Dortoirs (Tous)</option>
                  <option value="sans_dortoir">Sans dortoir</option>
                  {dormitories.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>

                {/* Tenue */}
                <select
                  value={filterClothing}
                  onChange={(e) => setFilterClothing(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Tenue (Toutes)</option>
                  <option value="polo">Avec Polo</option>
                  <option value="aucun">Sans Polo</option>
                </select>
              </div>

              {/* Compteur de résultats */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  <strong>{filteredParticipants.length}</strong> participant(s) trouvé(s) sur {participants.length}
                </span>
                {(filterType !== 'all' || filterPayment !== 'all' || filterSubCommittee !== 'all' || filterCheckIn !== 'all' || filterDormitory !== 'all' || filterClothing !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setFilterPayment('all');
                      setFilterSubCommittee('all');
                      setFilterCheckIn('all');
                      setFilterDormitory('all');
                      setFilterClothing('all');
                      setSearchQuery('');
                    }}
                    className="text-orange-600 hover:underline cursor-pointer font-semibold"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            </div>

            {/* Liste responsive : Cartes sur mobile (380px), Tableau sur grand écran */}
            {/* Version mobile (cartes) */}
            <div className="block md:hidden space-y-3">
              {filteredParticipants.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedParticipantForDetail(p)}
                  className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs active:bg-slate-50 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      {p.matricule}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Statut paiement */}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.paymentStatus === 'paye' ? 'bg-emerald-100 text-emerald-800' :
                        p.paymentStatus === 'gratuit' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {p.paymentStatus === 'paye' ? 'Payé' : p.paymentStatus === 'gratuit' ? 'Gratuit' : 'En attente'}
                      </span>
                      {/* Pastille Arrivé */}
                      {p.checkedIn && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                          Arrivé
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.fullName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {p.type === 'formateur' ? 'Formateur' : p.type === 'commission' ? 'Commission' : 'Séminariste'} • {p.subCommittee}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>{p.phone}</span>
                    <span className="font-bold text-slate-700">{p.totalFee.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Version Desktop (tableau) */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Participant</th>
                    <th className="py-3 px-3">Matricule</th>
                    <th className="py-3 px-3">Profil</th>
                    <th className="py-3 px-3">Sous-comité</th>
                    <th className="py-3 px-3">Paiement</th>
                    <th className="py-3 px-3">Arrivée</th>
                    <th className="py-3 px-3">Dortoir</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParticipants.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {p.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.fullName}</span>
                            <span className="text-[11px] text-slate-400">{p.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{p.matricule}</td>
                      <td className="py-3 px-3">
                        <span className="capitalize">{p.type}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.subCommittee}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.paymentStatus === 'paye' ? 'bg-emerald-100 text-emerald-800' :
                          p.paymentStatus === 'gratuit' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {p.paymentStatus === 'paye' ? 'Payé' : p.paymentStatus === 'gratuit' ? 'Gratuit' : 'En attente'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {p.checkedIn ? (
                          <span className="text-emerald-600 font-bold">✓ Arrivé</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{p.dormitory || '—'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedParticipantForDetail(p)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ONGLET 3 : PAIEMENTS & TRÉSORERIE (STEP 4) ───────────── */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Cartes Synthèse */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Encaissé Réel</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{stats.encaisse.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">En Attente</span>
                <p className="text-xl sm:text-2xl font-black text-orange-500 mt-1">{stats.reste.toLocaleString('fr-FR')} FCFA</p>
                <span className="text-[11px] text-slate-400">{stats.enAttente} participant(s)</span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Transactions Réussies</span>
                <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{payments.filter(p => p.status === 'succeeded').length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Actions</span>
                <div className="mt-2">
                  <button 
                    onClick={handleExportPaymentsCSV}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section EN ATTENTE DE PAIEMENT (avec bouton Paiement Espèces) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Participants en Attente de Paiement ({participants.filter(p => p.paymentStatus === 'en_attente' && p.totalFee > 0).length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrez le règlement en espèces sur place via le bouton dédié (sécurisé par fonction RPC).
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {participants.filter(p => p.paymentStatus === 'en_attente' && p.totalFee > 0).map(p => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.fullName}</span>
                        <span className="font-mono text-slate-500">({p.matricule})</span>
                        <span className="text-slate-400">• {p.subCommittee}</span>
                      </div>
                      <p className="text-slate-500 mt-0.5">Contact : {p.phone}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-orange-600 text-sm">
                        {p.totalFee.toLocaleString('fr-FR')} FCFA
                      </span>
                      <button
                        onClick={() => {
                          setCashPaymentParticipant(p);
                          setCashPaymentNote('');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Paiement espèces</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Liste de la table payments (historique complet des transactions) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Journal des Transactions (Table payments)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Bénéficiaire</th>
                      <th className="py-2.5 px-3">Moyen</th>
                      <th className="py-2.5 px-3">Montant</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Réf Client</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {new Date(pay.created_at).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {pay.participant?.full_name || pay.donation?.donor_name || 'Participant'}
                          {pay.participant?.matricule && <span className="text-[11px] text-slate-400 block">{pay.participant.matricule}</span>}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-600">{pay.provider}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{pay.amount.toLocaleString('fr-FR')} FCFA</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pay.status === 'succeeded' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{pay.client_reference || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 4 : POINTAGE / CHECK-IN QR (STEP 5) ───────────── */}
        {activeTab === 'checkin' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
            {/* Barre de sélection Date & Session (Toujours visible en haut) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date du pointage
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Session */}
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Type de Session
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setCheckInSessionType('arrivee')}
                      className={`py-2 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        checkInSessionType === 'arrivee' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Arrivée
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInSessionType('breakfast')}
                      className={`py-2 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        checkInSessionType === 'breakfast' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Petit-déj
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInSessionType('lunch')}
                      className={`py-2 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        checkInSessionType === 'lunch' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Déjeuner
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInSessionType('dinner')}
                      className={`py-2 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        checkInSessionType === 'dinner' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Dîner
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInSessionType('cours')}
                      className={`py-2 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        checkInSessionType === 'cours' ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Cours
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Clé session active : <code className="font-mono font-bold text-slate-700">{computedSessionKey}</code></span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
                    <span>{isOnline ? 'En ligne' : 'Mode Hors-ligne'}</span>
                  </span>
                </div>
                <span>
                  Validation via RPC <code className="font-mono text-orange-600">admin_scan_attendance</code>
                </span>
              </div>
            </div>

            {/* Alerte & Synchronisation File Hors-Ligne (Phase 2) */}
            {offlineScans.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {offlineScans.length}
                  </div>
                  <div>
                    <h5 className="font-bold text-amber-900 text-xs">
                      {offlineScans.length} pointage(s) en attente de synchronisation
                    </h5>
                    <p className="text-[11px] text-amber-700">
                      Enregistrés en local lors des scans hors-ligne. Cliquez pour pousser vers Supabase.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={syncOfflineScans}
                  disabled={isSyncingOffline || !isOnline}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
                >
                  {isSyncingOffline ? 'Synchronisation...' : 'Synchroniser vers le Serveur'}
                </button>
              </div>
            )}

            {/* Suivi : X validés sur Y attendus */}
            {(() => {
              const attendeesPaidOrFree = participants.filter(p => p.paymentStatus === 'paye' || p.paymentStatus === 'gratuit');
              const validatedForSession = attendanceRecords.filter(a => a.session_key === computedSessionKey);
              const countVal = validatedForSession.length;
              const countTotal = attendeesPaidOrFree.length;
              const pctVal = countTotal > 0 ? (countVal / countTotal) * 100 : 0;

              return (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase">Présences session</span>
                    <p className="text-lg font-black text-slate-900 mt-0.5">
                      {countVal} validé(s) sur {countTotal} attendus
                    </p>
                  </div>
                  <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.min(100, pctVal)}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Scanner Caméra + Saisie Manuelle */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={isScannerActive ? stopQrScanner : startQrScanner}
                  className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isScannerActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                  <span>{isScannerActive ? 'Fermer la Caméra Scanner' : 'Ouvrir Scanner Caméra'}</span>
                </button>

                {/* Saisie Manuelle */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualMatriculeInput.trim()) {
                      executeAttendanceScan(manualMatriculeInput.trim());
                      setManualMatriculeInput('');
                    }
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <input
                    type="text"
                    value={manualMatriculeInput}
                    onChange={(e) => setManualMatriculeInput(e.target.value)}
                    placeholder="Matricule (ex: SRGOH-SEM-001)"
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 flex-1 sm:w-60"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    Valider
                  </button>
                </form>
              </div>

              {/* Conteneur Scanner Html5Qrcode */}
              {isScannerActive && (
                <div className="rounded-2xl overflow-hidden border-2 border-orange-400 bg-black max-w-sm mx-auto shadow-lg">
                  <div id="qr-reader-container" className="w-full" />
                  <p className="text-center text-[11px] text-white/70 py-2 bg-slate-950">
                    Pointez la caméra vers le QR code du participant (matricule uniquement)
                  </p>
                </div>
              )}

              {/* RÉSULTAT DU SCAN EN GRANDE CARTE */}
              {scanStatusResult && (
                <div className={`p-6 rounded-2xl border-2 transition-all animate-in zoom-in-95 duration-150 ${
                  scanStatusResult.status === 'ok' ? 'bg-emerald-50 border-emerald-500 text-emerald-950' :
                  scanStatusResult.status === 'already' ? 'bg-amber-50 border-amber-500 text-amber-950' :
                  scanStatusResult.status === 'unpaid' ? 'bg-red-50 border-red-500 text-red-950' :
                  'bg-red-50 border-red-400 text-red-900'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xl shadow-xs" style={{
                      backgroundColor: scanStatusResult.status === 'ok' ? '#059669' :
                                      scanStatusResult.status === 'already' ? '#d97706' : '#dc2626'
                    }}>
                      {scanStatusResult.status === 'ok' ? '✓' : scanStatusResult.status === 'already' ? '!' : '✕'}
                    </div>

                    <div className="flex-1 space-y-1">
                      <h4 className="text-lg font-black tracking-tight">
                        {scanStatusResult.status === 'ok' && 'Pointage Validé avec succès'}
                        {scanStatusResult.status === 'already' && 'Déjà Validé pour cette session'}
                        {scanStatusResult.status === 'unpaid' && 'Inscription Non Payée !'}
                        {scanStatusResult.status === 'not_found' && 'Matricule Inconnu dans la base'}
                        {scanStatusResult.status === 'error' && 'Erreur lors du traitement'}
                      </h4>

                      {scanStatusResult.status === 'unpaid' && (
                        <p className="text-xs font-bold text-red-700">
                          Veuillez orienter ce participant vers la commission Finance pour règlement.
                        </p>
                      )}

                      {scanStatusResult.participant && (
                        <div className="text-xs space-y-0.5 pt-2 text-slate-800">
                          <p><strong>Nom :</strong> {scanStatusResult.participant.full_name}</p>
                          <p><strong>Matricule :</strong> {scanStatusResult.participant.matricule}</p>
                          <p><strong>Sous-comité :</strong> {scanStatusResult.participant.sub_committee}</p>
                        </div>
                      )}

                      {scanStatusResult.scannedAt && (
                        <p className="text-[11px] text-slate-500 pt-1">
                          Heure : {new Date(scanStatusResult.scannedAt).toLocaleTimeString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Historique des derniers pointages */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                Derniers pointages pour la session active
              </h3>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {attendanceRecords.filter(a => a.session_key === computedSessionKey).map(att => (
                  <div key={`${att.participant_id}-${att.session_key}`} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{att.participant?.full_name || 'Participant'}</span>
                      <span className="text-slate-400 font-mono ml-2">({att.participant?.matricule || att.participant_id})</span>
                      <span className="text-[11px] text-slate-400 block">
                        Validé le {new Date(att.scanned_at).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCancelAttendance(att)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                    >
                      Annuler la validation
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 5 : HÉBERGEMENT (DORTOIRS) (STEP 6) ───────────── */}
        {activeTab === 'dormitories' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Dortoirs & Bouton Attribution Automatique */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Gestion des Dortoirs & Hébergements</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capacité, occupation et répartition stricte par genre (Frères / Sœurs).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleAutoAssignDormitories}
                  disabled={isAutoAssigningDorms || participantsWithoutDorm.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Attribuer automatiquement ({participantsWithoutDorm.length} sans dortoir)</span>
                </button>
              </div>
            </div>

            {/* Formulaire Création Nouveau Dortoir */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Créer un nouveau dortoir
              </h4>
              <form onSubmit={handleCreateDormitory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newDormitoryForm.name}
                  onChange={(e) => setNewDormitoryForm({ ...newDormitoryForm, name: e.target.value })}
                  placeholder="Nom du dortoir (ex: Dortoir A1 - Frères)"
                  required
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:col-span-2"
                />
                <input
                  type="number"
                  value={newDormitoryForm.capacity}
                  onChange={(e) => setNewDormitoryForm({ ...newDormitoryForm, capacity: Number(e.target.value) })}
                  min={1}
                  required
                  placeholder="Capacité (lits)"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newDormitoryForm.gender}
                    onChange={(e) => setNewDormitoryForm({ ...newDormitoryForm, gender: e.target.value as any })}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold flex-1"
                  >
                    <option value="homme">Frères</option>
                    <option value="femme">Sœurs</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer shrink-0"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </div>

            {/* Liste des Dortoirs avec Occupation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dormitories.map(dorm => {
                const occupants = participants.filter(p => p.dormitory === dorm.name);
                const occCount = occupants.length;
                const occPct = dorm.capacity > 0 ? (occCount / dorm.capacity) * 100 : 0;
                const isOver90 = occPct >= 90;

                return (
                  <div key={dorm.name} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        dorm.gender === 'femme' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {dorm.gender === 'femme' ? 'Sœurs' : 'Frères'}
                      </span>
                      <button
                        onClick={() => handleDeleteDormitory(dorm)}
                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                        title="Supprimer ce dortoir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{dorm.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {occCount} occupant(s) sur {dorm.capacity} places
                      </p>
                    </div>

                    {/* Barre de remplissage (rouge si > 90%) */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver90 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(100, occPct)}%` }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold block text-right ${isOver90 ? 'text-red-600' : 'text-slate-400'}`}>
                        {occPct.toFixed(0)}%
                      </span>
                    </div>

                    {/* Actions dortoir */}
                    <button
                      onClick={() => setSelectedDormitoryForDetail(dorm)}
                      className="w-full py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Voir les {occCount} occupant(s)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ONGLET 6 : TENUES / POLOS (STEP 7) ────────────────────── */}
        {activeTab === 'clothing' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Commandes de Polos & Tenues Officielles</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Récapitulatif des tailles et couleurs pour le fournisseur (Total : {clothingSummary.totalOrdered} polos).
                </p>
              </div>

              <button
                onClick={handleExportClothingCSV}
                className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Fournisseur</span>
              </button>
            </div>

            {/* Tableau Récapitulatif par Taille et Couleur */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Grille des commandes par taille et couleur
              </h4>
              <table className="w-full text-center text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Taille</th>
                    {clothingSummary.colors.map(c => (
                      <th key={c} className="py-2.5 px-3">{c}</th>
                    ))}
                    <th className="py-2.5 px-3 text-orange-600">Total Taille</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {clothingSummary.sizes.map(size => (
                    <tr key={size} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-left font-bold text-slate-800">{size}</td>
                      {clothingSummary.colors.map(color => (
                        <td key={color} className="py-2.5 px-3 text-slate-600">
                          {clothingSummary.matrix[size][color] || 0}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 font-bold text-orange-600 bg-orange-50/40">
                        {clothingSummary.sizeTotals[size]}
                      </td>
                    </tr>
                  ))}
                  {/* Ligne Total Couleur */}
                  <tr className="bg-slate-50 font-black text-slate-900">
                    <td className="py-3 px-3 text-left">Total Couleur</td>
                    {clothingSummary.colors.map(color => (
                      <td key={color} className="py-3 px-3">{clothingSummary.colorTotals[color]}</td>
                    ))}
                    <td className="py-3 px-3 text-orange-600 font-black text-sm">
                      {clothingSummary.totalOrdered} Polos
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Liste nominative des commandes */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Liste nominative des commandes ({participants.filter(p => p.hasPolo).length})
              </h4>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {participants.filter(p => p.hasPolo).map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.fullName}</span>
                      <span className="text-slate-400 font-mono ml-2">({p.matricule})</span>
                      <span className="text-slate-500 block">{p.subCommittee} • Contact : {p.phone}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200">
                        {p.poloSize || 'M'} - {p.poloColor || 'Blanc'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.paymentStatus === 'paye' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {p.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 7 : LISTES À IMPRIMER A4 (STEP 8) ─────────────── */}
        {activeTab === 'printables' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Listes Officielles à Imprimer (Format A4)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pages optimisées avec le logo homologué, titre, colonnes de signatures et mise en page d'impression.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Émargement par sous-comité */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                    <Printer className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Feuilles d'Émargement</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Listes par sous-comité avec colonne signature pour le pointage des arrivées.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Imprimer / PDF
                </button>
              </div>

              {/* 2. Liste par dortoir */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Home className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Fiches Dortoirs</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Affichage porte de chaque dortoir avec liste des résidents et contacts d'urgence.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Imprimer / PDF
                </button>
              </div>

              {/* 3. Liste de session */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Pointage Session</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Présents et absents pour la date et session sélectionnées.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Imprimer / PDF
                </button>
              </div>

              {/* 4. Planche de badges */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Planche de Badges</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Impression groupée des badges participants pour plastification.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Imprimer / PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ONGLET 8 : CONFIGURATION (STEP 9) ────────────────────── */}
        {activeTab === 'config' && (
          <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Configuration Générale & Tarification</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifiez les règles d'inscription, tarifs et quotas enregistrés dans <code className="font-mono text-orange-600">seminar_config</code>.
              </p>
            </div>

            {configSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              {/* Inscriptions */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paramètres d'inscription
                </h4>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">Statut des inscriptions publiques</span>
                    <span className="text-xs text-slate-500">
                      {regIsOpen ? 'Les visiteurs peuvent s\'inscrire.' : 'Inscriptions temporairement fermées.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegIsOpen(!regIsOpen)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                      regIsOpen ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${
                      regIsOpen ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Date limite des inscriptions
                    </label>
                    <input
                      type="date"
                      value={regDeadline}
                      onChange={(e) => setRegDeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Capacité maximale du séminaire (lits / participants)
                    </label>
                    <input
                      type="number"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      min={50}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  * Note : Le blocage effectif des inscriptions se fera côté serveur.
                </p>
              </div>

              {/* Tarifs */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Grille des Tarifs (en FCFA)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prix Polo officiel
                    </label>
                    <input
                      type="number"
                      value={poloPrice}
                      onChange={(e) => setPoloPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prix T-shirt simple
                    </label>
                    <input
                      type="number"
                      value={tshirtPrice}
                      onChange={(e) => setTshirtPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Frais Membre de Commission
                    </label>
                    <input
                      type="number"
                      value={commissionPrice}
                      onChange={(e) => setCommissionPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 text-[11px] text-orange-800 font-medium border border-orange-200">
                  ℹ️ Un changement de tarif ne s'applique qu'aux nouvelles inscriptions. Les frais des participants déjà enregistrés restent inchangés.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingConfig ? 'Enregistrement...' : 'Enregistrer la configuration'}</span>
                </button>
              </div>
            </form>

            {/* Gestion des Sous-Comités */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sous-comités & Frais d'inscription
              </h4>

              <div className="divide-y divide-slate-100">
                {subCommitteesDb.map(sc => (
                  <div key={sc.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{sc.name}</span>
                      <span className="text-slate-400 ml-2">({sc.registration_fee.toLocaleString('fr-FR')} FCFA)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sc.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sc.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                      <button
                        onClick={() => handleToggleSubCommittee(sc)}
                        className="text-xs text-slate-600 hover:text-orange-600 font-semibold cursor-pointer underline"
                      >
                        {sc.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ajouter sous-comité */}
              <form onSubmit={handleAddSubCommittee} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newSubCommitteeName}
                  onChange={(e) => setNewSubCommitteeName(e.target.value)}
                  placeholder="Nom du nouveau sous-comité"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  value={newSubCommitteeFee}
                  onChange={(e) => setNewSubCommitteeFee(Number(e.target.value))}
                  placeholder="Tarif (FCFA)"
                  className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shrink-0"
                >
                  Ajouter
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── ONGLET 9 : MON COMPTE & NETTOYAGE (STEP 10) ─────────── */}
        {activeTab === 'account' && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xl mx-auto border-2 border-orange-400">
                {userEmail ? userEmail[0].toUpperCase() : 'A'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{userEmail}</h3>
                <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mt-1">
                  Administrateur Officiel SERFIG
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left space-y-3 text-slate-600">
                <p><strong>Base de données :</strong> Connectée (Supabase Cloud)</p>
                <p><strong>Authentification :</strong> JWT Session active</p>
                <p><strong>Permissions :</strong> am_i_admin() vérifiée</p>
                <p><strong>Intégrité financière :</strong> Écriture restreinte, statut géré par RPC espèces</p>
                <div className="pt-2 border-t border-slate-200">
                  <label className="block font-bold text-slate-700 mb-1">Rôle Actif (Simulation RBAC Phase 2) :</label>
                  <select
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-xs"
                  >
                    <option value="super_admin">👑 Super Administrateur (Accès Complet)</option>
                    <option value="finance">💳 Commission Finance (Paiements, Espèces, Bilan)</option>
                    <option value="organisateur">📋 Comité d'Organisation (Pointage, Dortoirs, Programme)</option>
                    <option value="sante">🩺 Commission Médicale & Santé (Fiches Santé, Urgences)</option>
                  </select>
                </div>
              </div>

              {/* Script Supabase Complet (Téléchargement & Intégration) */}
              <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-left space-y-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-600 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-xs">
                    Script SQL Supabase Complet (Phase 1 + Phase 2)
                  </h4>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Contient toutes les tables (participants, dortoirs, paiements, fiches médicales, rôles RBAC, journal d'audit, planning), fonctions RPC et règles RLS prêtes pour le SQL Editor de Supabase.
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <a
                    href="/supabase_complete_schema_and_phase2.sql"
                    download="supabase_complete_schema_and_phase2.sql"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger le Fichier .SQL</span>
                  </a>
                  <a
                    href="/supabase_complete_schema_and_phase2.sql"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir dans le navigateur</span>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se Déconnecter de la Session Admin</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PHASE 2 : MESSAGERIE PARTICIPANTS (WHATSAPP / SMS) ──── */}
        {activeTab === 'messaging' && (
          <AdminMessaging
            participants={participants}
            config={config}
            onLogActivity={(action, details) => logAdminActivity(action, details, 'MESSAGING')}
          />
        )}

        {/* ─── PHASE 2 : COMMISSION MÉDICALE & SANTÉ ───────────────── */}
        {activeTab === 'medical' && (
          <AdminMedical
            participants={participants}
            userEmail={userEmail}
          />
        )}

        {/* ─── PHASE 2 : PROGRAMME DU SÉMINAIRE ────────────────────── */}
        {activeTab === 'schedule' && (
          <AdminSchedule
            config={config}
            userEmail={userEmail}
            onLaunchCheckinForSession={(sessionKey) => {
              if (sessionKey.includes('breakfast')) setCheckInSessionType('breakfast');
              else if (sessionKey.includes('lunch')) setCheckInSessionType('lunch');
              else if (sessionKey.includes('dinner')) setCheckInSessionType('dinner');
              else if (sessionKey.includes('cours')) setCheckInSessionType('cours');
              else setCheckInSessionType('arrivee');
              setActiveTab('checkin');
            }}
          />
        )}

        {/* ─── PHASE 2 : JOURNAL D'ACTIVITÉ & AUDIT ─────────────────── */}
        {activeTab === 'activity' && (
          <AdminActivityLogs
            userEmail={userEmail}
          />
        )}

        {/* ─── PHASE 2 : ATTESTATIONS & BILAN FINAL ────────────────── */}
        {activeTab === 'certificates' && (
          <AdminCertificates
            participants={participants}
            config={config}
            userEmail={userEmail}
          />
        )}
      </div>

      {/* ─── BARRE FIXE EN BAS SUR MOBILE (5 ENTRÉES) ──────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg md:hidden">
        <div className="grid grid-cols-5 h-16">
          {/* 1. Accueil */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'dashboard' ? 'text-orange-600 font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Accueil</span>
          </button>

          {/* 2. Participants */}
          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'participants' ? 'text-orange-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Participants</span>
          </button>

          {/* 3. Paiements */}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'payments' ? 'text-orange-600 font-bold' : 'text-slate-500'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">Paiements</span>
          </button>

          {/* 4. Pointage */}
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'checkin' ? 'text-orange-600 font-bold' : 'text-slate-500'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[10px]">Pointage</span>
          </button>

          {/* 5. Plus (ouvre sous-menu) */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              ['dormitories', 'clothing', 'printables', 'config', 'account'].includes(activeTab) ? 'text-orange-600 font-bold' : 'text-slate-500'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px]">Plus</span>
          </button>
        </div>
      </nav>

      {/* ─── DRAWER / SOUS-MENU "PLUS" SUR MOBILE ─────────────────── */}
      {isMoreMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end md:hidden animate-in fade-in duration-150"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Gestion & Outils Avancés</h3>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-sm font-semibold max-h-[70vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('schedule'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Programme du Séminaire (Phase 2)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('messaging'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Messagerie WhatsApp / SMS (Phase 2)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('medical'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <span>Santé & Commission Médicale (Phase 2)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('certificates'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Award className="w-5 h-5 text-orange-600" />
                <span>Attestations & Bilan Final (Phase 2)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('dormitories'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Home className="w-5 h-5 text-slate-500" />
                <span>Hébergement & Dortoirs</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('clothing'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Shirt className="w-5 h-5 text-slate-500" />
                <span>Tenues & Commandes Polos</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('printables'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Printer className="w-5 h-5 text-slate-500" />
                <span>Listes à imprimer (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('activity'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <History className="w-5 h-5 text-blue-600" />
                <span>Journal d'Activité & Audit (Phase 2)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('config'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <Settings className="w-5 h-5 text-slate-500" />
                <span>Configuration & Tarifs</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('account'); setIsMoreMenuOpen(false); }}
                className="w-full p-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors text-left"
              >
                <User className="w-5 h-5 text-slate-500" />
                <span>Mon compte Administrateur</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DÉTAILS PARTICIPANT ────────────────────────────── */}
      {selectedParticipantForDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedParticipantForDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  {selectedParticipantForDetail.matricule}
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  {selectedParticipantForDetail.type}
                </span>
              </div>
              <button 
                onClick={() => setSelectedParticipantForDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="text-lg font-bold text-slate-900">{selectedParticipantForDetail.fullName}</h3>

              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p><strong>Genre :</strong> {selectedParticipantForDetail.gender === 'femme' ? 'Sœur' : 'Frère'}</p>
                <p><strong>Téléphone :</strong> {selectedParticipantForDetail.phone}</p>
                <p><strong>WhatsApp :</strong> {selectedParticipantForDetail.whatsapp}</p>
                <p><strong>Sous-comité :</strong> {selectedParticipantForDetail.subCommittee}</p>
                <p><strong>Dortoir :</strong> {selectedParticipantForDetail.dormitory || 'Non assigné'}</p>
                <p><strong>Total frais :</strong> {selectedParticipantForDetail.totalFee.toLocaleString('fr-FR')} FCFA</p>
                <p><strong>Statut paiement :</strong> {selectedParticipantForDetail.paymentStatus}</p>
                <p><strong>Commande Polo :</strong> {selectedParticipantForDetail.hasPolo ? `${selectedParticipantForDetail.poloSize || 'M'} (${selectedParticipantForDetail.poloColor || 'Blanc'})` : 'Aucun'}</p>
              </div>

              {/* Fiche santé (VISIBLE UNIQUEMENT ICI, JAMAIS DANS LES EXPORTS) */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <h5 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                  <HeartPulse className="w-4 h-4 text-amber-700" />
                  <span>Informations de Santé (Strictement Confidentiel)</span>
                </h5>
                {selectedParticipantForDetail.hasMedicalCondition ? (
                  <p className="text-amber-800 font-medium">
                    ⚠️ Maladie déclarée : {selectedParticipantForDetail.medicalDetails || 'Non spécifié'}
                  </p>
                ) : (
                  <p className="text-amber-700">Aucun problème de santé particulier déclaré.</p>
                )}
              </div>

              {selectedParticipantForDetail.notes && (
                <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                  <strong>Notes administratives :</strong> {selectedParticipantForDetail.notes}
                </div>
              )}
            </div>

            {/* Actions : Modifier, Imprimer Badge, Imprimer Reçu, Supprimer */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleDeleteParticipant(selectedParticipantForDetail)}
                className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Supprimer
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const p = selectedParticipantForDetail;
                    setSelectedParticipantForDetail(null);
                    openEditModal(p);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Modifier
                </button>

                <button
                  onClick={() => setSelectedParticipantForBadge(selectedParticipantForDetail)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Imprimer Badge
                </button>

                <button
                  onClick={() => setSelectedParticipantForReceipt(selectedParticipantForDetail)}
                  className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Imprimer Reçu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL MODIFIER PARTICIPANT (SOUS-COMITÉ & PAIEMENT RESTENT EN LECTURE SEULE) ─── */}
      {selectedParticipantForEdit && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedParticipantForEdit(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Modifier le participant ({selectedParticipantForEdit.matricule})
              </h3>
              <button onClick={() => setSelectedParticipantForEdit(null)} className="text-slate-400 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveParticipantEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editFormData.fullName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Genre</label>
                  <select
                    value={editFormData.gender || 'homme'}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={editFormData.birthDate || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editFormData.whatsapp || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              {/* RÈGLE STRICTE DU PROMPT : Sous-comité, frais et paiement restent en lecture seule */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 space-y-1">
                <p><strong>Sous-comité (Lecture seule) :</strong> {selectedParticipantForEdit.subCommittee}</p>
                <p><strong>Frais & Statut (Lecture seule) :</strong> {selectedParticipantForEdit.totalFee} FCFA • {selectedParticipantForEdit.paymentStatus}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes administratives</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedParticipantForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold"
                >
                  {isSavingEdit ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL CONFIRMATION PAIEMENT ESPÈCES ──────────────────── */}
      {cashPaymentParticipant && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCashPaymentParticipant(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Confirmation Paiement Espèces</h3>
              <button onClick={() => setCashPaymentParticipant(null)} className="text-slate-400 p-1">✕</button>
            </div>

            {cashPaymentSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-center font-bold">
                {cashPaymentSuccessMsg}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Vous vous apprêtez à enregistrer un encaissement en espèces pour le participant suivant :
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p><strong>Nom :</strong> {cashPaymentParticipant.fullName}</p>
                  <p><strong>Matricule :</strong> {cashPaymentParticipant.matricule}</p>
                  <p><strong>Montant exact à percevoir :</strong> <span className="text-sm font-black text-emerald-700">{cashPaymentParticipant.totalFee.toLocaleString('fr-FR')} FCFA</span></p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Note facultative (ex: Reçu manuel N°...)</label>
                  <input
                    type="text"
                    value={cashPaymentNote}
                    onChange={(e) => setCashPaymentNote(e.target.value)}
                    placeholder="Note interne..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCashPaymentParticipant(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCashPayment}
                    disabled={isSubmittingCashPayment}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs cursor-pointer"
                  >
                    {isSubmittingCashPayment ? 'Enregistrement...' : 'Valider l\'Encaissement'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL AJOUT PARTICIPANT MANUEL ───────────────────────── */}
      {isAddParticipantModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddParticipantModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Ajout Manuel d'un Participant</h3>
              <button onClick={() => setIsAddParticipantModalOpen(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <form onSubmit={handleCreateParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={newParticipantForm.fullName}
                  onChange={(e) => setNewParticipantForm({ ...newParticipantForm, fullName: e.target.value })}
                  required
                  placeholder="ex: KOUASSI Yao Ibrahim"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rôle / Profil *</label>
                  <select
                    value={newParticipantForm.type}
                    onChange={(e) => setNewParticipantForm({ ...newParticipantForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="seminariste">Séminariste</option>
                    <option value="formateur">Formateur</option>
                    <option value="commission">Commission</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Genre *</label>
                  <select
                    value={newParticipantForm.gender}
                    onChange={(e) => setNewParticipantForm({ ...newParticipantForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Téléphone *</label>
                  <input
                    type="text"
                    value={newParticipantForm.phone}
                    onChange={(e) => setNewParticipantForm({ ...newParticipantForm, phone: e.target.value })}
                    required
                    placeholder="0700000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sous-comité *</label>
                  <select
                    value={newParticipantForm.subCommittee}
                    onChange={(e) => setNewParticipantForm({ ...newParticipantForm, subCommittee: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    {subCommitteesDb.map(sc => (
                      <option key={sc.name} value={sc.name}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Commande Polo */}
              <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newParticipantForm.hasPolo}
                    onChange={(e) => setNewParticipantForm({ ...newParticipantForm, hasPolo: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Commander le Polo officiel SERFIG 2027 (+2 500 FCFA)</span>
                </label>

                {newParticipantForm.hasPolo && (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Taille</label>
                      <select
                        value={newParticipantForm.poloSize}
                        onChange={(e) => setNewParticipantForm({ ...newParticipantForm, poloSize: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="3XL">3XL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Couleur</label>
                      <select
                        value={newParticipantForm.poloColor}
                        onChange={(e) => setNewParticipantForm({ ...newParticipantForm, poloColor: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Blanc">Blanc</option>
                        <option value="Noir">Noir</option>
                        <option value="Orange">Orange</option>
                        <option value="Vert">Vert</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddParticipantModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewParticipant}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
                >
                  {isSubmittingNewParticipant ? 'Enregistrement...' : 'Créer Participant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL VISUALISATION BADGE PARTICIPANT ─────────────────── */}
      {selectedParticipantForBadge && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedParticipantForBadge(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Aperçu & Impression du Badge</h3>
              <button onClick={() => setSelectedParticipantForBadge(null)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="flex justify-center py-2">
              <BadgeCard participant={selectedParticipantForBadge} config={config} showActions={true} />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL VISUALISATION REÇU PARTICIPANT ──────────────────── */}
      {selectedParticipantForReceipt && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedParticipantForReceipt(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Fiche Officielle & Reçu d'Inscription</h3>
              <button onClick={() => setSelectedParticipantForReceipt(null)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="py-2">
              <RegistrationReceipt participant={selectedParticipantForReceipt} config={config} showActions={true} />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL OCCUPANTS DORTOIR ───────────────────────────────── */}
      {selectedDormitoryForDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedDormitoryForDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Occupants du dortoir : {selectedDormitoryForDetail.name} ({selectedDormitoryForDetail.gender === 'femme' ? 'Sœurs' : 'Frères'})
              </h3>
              <button onClick={() => setSelectedDormitoryForDetail(null)} className="text-slate-400 p-1">✕</button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
              {participants.filter(p => p.dormitory === selectedDormitoryForDetail.name).length === 0 ? (
                <p className="py-6 text-center text-slate-400">Aucun occupant actuellement dans ce dortoir.</p>
              ) : (
                participants.filter(p => p.dormitory === selectedDormitoryForDetail.name).map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{p.fullName}</span>
                      <span className="text-slate-400 ml-2 font-mono">({p.matricule})</span>
                      <span className="text-[11px] text-slate-500 block">{p.subCommittee} • {p.phone}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipantFromDorm(p.id)}
                      className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                    >
                      Retirer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
