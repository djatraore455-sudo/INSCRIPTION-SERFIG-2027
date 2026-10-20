import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Participant, ParticipantType, SeminarConfig } from '../types';
import { addParticipant, calculateAge } from '../services/storage';
import { BadgeCard } from './BadgeCard';
import { RegistrationReceipt } from './RegistrationReceipt';
import { 
  X, 
  Check, 
  CreditCard, 
  Sparkles, 
  AlertCircle, 
  User, 
  Users, 
  GraduationCap, 
  Star, 
  UploadCloud, 
  Camera, 
  FileText, 
  IdCard, 
  LayoutGrid, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Shirt,
  HeartPulse
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
  initialType?: ParticipantType;
  onRegistered?: (participant: Participant) => void;
  onOpenParticipantSpace?: (participant: Participant) => void;
  onOpenAdmin?: () => void;
}

// Formatage des montants : "2 000 FCFA" (espace de milliers)
const formatFCFA = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR').replace(/\u202F/g, ' ')} FCFA`;
};

// Commissions officielles SERFIG 2027
const COMMISSIONS_LIST = [
  'Pédagogie & Encadrement',
  'Sécurité & Discipline',
  'Restauration',
  'Santé & Premiers Secours',
  'Logistique & Dortoirs',
  'Communication & Média',
  'Finances & Accueil'
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  config,
  initialType = 'seminariste',
  onRegistered,
  onOpenParticipantSpace,
  onOpenAdmin
}) => {
  const [activeTab, setActiveTab] = useState<ParticipantType>(initialType);
  const [wizardStep, setWizardStep] = useState<number>(1); // 1 à 4 pour séminariste
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdParticipant, setCreatedParticipant] = useState<Participant | null>(null);
  const [successViewTab, setSuccessViewTab] = useState<'summary' | 'receipt' | 'badge'>('summary');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // -------------------------------------------------------------
  // ÉTATS DE FORMULAIRE PARTAGÉS & SÉMINARISTE
  // -------------------------------------------------------------
  // Étape 1 : Informations personnelles
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [genre, setGenre] = useState<'homme' | 'femme'>('homme');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolLevel, setSchoolLevel] = useState('Lycée (2nde à Terminale)');

  // Étape 2 : Informations organisationnelles
  const [subCommittee, setSubCommittee] = useState(config.subCommittees[0]?.name || 'Sous-Comité Gagnoa');
  const [wantsPolo, setWantsPolo] = useState(false);
  const [poloSize, setPoloSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');
  const [poloColor, setPoloColor] = useState('Vert Forêt AEEMCI');
  const [parentName, setParentName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [hasMedicalCondition, setHasMedicalCondition] = useState<boolean | null>(false);
  const [medicalDetails, setMedicalDetails] = useState('');

  // Étape 3 : Photo de profil
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Étape 4 : Paiement Wave
  const [wavePhoneNumber, setWavePhoneNumber] = useState('');

  // -------------------------------------------------------------
  // FORMATEUR SPÉCIFIQUE (une seule page)
  // -------------------------------------------------------------
  const [trainerSubtype, setTrainerSubtype] = useState('Formateur Résident');

  // -------------------------------------------------------------
  // COMMISSION SPÉCIFIQUE (une seule page)
  // -------------------------------------------------------------
  const [commissionName, setCommissionName] = useState(COMMISSIONS_LIST[0]);

  // Synchronisation lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setWizardStep(1);
      setCreatedParticipant(null);
      setErrors({});
      setSuccessViewTab('summary');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  // Calcul dynamique de l'âge
  const age = calculateAge(birthDate);
  const isMinor = age !== null && age < 18;

  // Tarifs
  const activeSubCommitteeObj = config.subCommittees.find(sc => sc.name === subCommittee) || config.subCommittees[0];
  const participantFee = activeTab === 'formateur' 
    ? 0 
    : activeTab === 'commission' 
      ? (config.commissionFee || 2000) 
      : (activeSubCommitteeObj?.fee || 2000);
  
  const poloFee = wantsPolo ? (config.poloPrice || 2500) : 0;
  const totalToPay = participantFee + poloFee;

  // Gestion du téléversement de la photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'La photo ne doit pas dépasser 4 Mo.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setErrors(prev => {
          const next = { ...prev };
          delete next.photo;
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // VALIDATIONS DES ÉTAPES DU SÉMINARISTE
  // -------------------------------------------------------------
  const validateSeminaristeStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!nom.trim()) newErrors.nom = 'Le nom de famille est obligatoire.';
      if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';
      if (!genre) newErrors.genre = 'Veuillez préciser le genre.';
      if (!birthDate) {
        newErrors.birthDate = 'La date de naissance est obligatoire.';
      } else {
        const d = new Date(birthDate);
        const y = d.getFullYear();
        if (isNaN(d.getTime()) || y < 1930 || d > new Date()) {
          newErrors.birthDate = 'Date de naissance invalide (entre 1930 et aujourd’hui).';
        }
      }
      if (!phone.trim()) {
        newErrors.phone = 'Le numéro de téléphone est obligatoire.';
      } else if (phone.replace(/\D/g, '').length < 8) {
        newErrors.phone = 'Veuillez saisir un numéro valide (ex: 07 XX XX XX XX).';
      }
      if (!schoolLevel) newErrors.schoolLevel = 'Veuillez sélectionner votre niveau d’étude.';
    }

    if (step === 2) {
      if (!subCommittee) newErrors.subCommittee = 'Veuillez sélectionner votre sous-comité.';
      
      // Si moins de 18 ans, parent obligatoire
      if (isMinor) {
        if (!parentName.trim()) {
          newErrors.parentName = 'Le nom du parent/tuteur est obligatoire pour les mineurs.';
        }
        if (!parentContact.trim()) {
          newErrors.parentContact = 'Le contact du parent/tuteur est obligatoire pour les mineurs.';
        }
      }

      if (hasMedicalCondition === null) {
        newErrors.hasMedicalCondition = 'Veuillez indiquer si vous avez une maladie.';
      } else if (hasMedicalCondition && !medicalDetails.trim()) {
        newErrors.medicalDetails = 'Veuillez préciser la maladie, allergie ou traitement en cours.';
      }
    }

    if (step === 4) {
      if (!wavePhoneNumber.trim()) {
        newErrors.wavePhoneNumber = 'Le numéro de compte Wave est obligatoire.';
      } else if (wavePhoneNumber.replace(/\D/g, '').length < 8) {
        newErrors.wavePhoneNumber = 'Veuillez saisir un numéro Wave valide (ex: 07 XX XX XX XX).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation Formateur
  const validateFormateur = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';
    if (!phone.trim()) newErrors.phone = 'Le contact est obligatoire.';
    if (!photoUrl) newErrors.photo = 'La photo est obligatoire pour les formateurs.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation Commission
  const validateCommission = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est obligatoire.';
    if (!phone.trim()) newErrors.phone = 'Le contact est obligatoire.';
    if (!photoUrl) newErrors.photo = 'La photo est obligatoire pour les membres de commission.';
    if (!wavePhoneNumber.trim()) {
      newErrors.wavePhoneNumber = 'Le numéro Wave est obligatoire.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------------------------------
  // ENVOI DE L'INSCRIPTION (JAMAIS PAYÉE PAR DÉFAUT)
  // -------------------------------------------------------------
  const submitRegistration = async () => {
    setIsSubmitting(true);
    try {
      const isFormateur = activeTab === 'formateur';
      const actualPaymentStatus = isFormateur ? 'gratuit' : 'en_attente';
      const fullParticipantName = `${nom.trim().toUpperCase()} ${prenom.trim()}`;

      const created = addParticipant({
        type: activeTab,
        fullName: fullParticipantName,
        gender: genre,
        phone: phone.trim(),
        whatsapp: phone.trim(),
        subCommittee,
        birthDate: birthDate || undefined,
        parentName: parentName.trim() || undefined,
        parentContact: parentContact.trim() || undefined,
        hasMedicalCondition: Boolean(hasMedicalCondition),
        medicalDetails: hasMedicalCondition ? medicalDetails.trim() : undefined,
        schoolLevel: activeTab === 'seminariste' ? schoolLevel : undefined,
        photoUrl: photoUrl || undefined,

        // Polo
        hasPolo: wantsPolo,
        clothingType: wantsPolo ? 'polo' : 'aucun',
        poloSize: wantsPolo ? poloSize : undefined,
        poloColor: wantsPolo ? poloColor : undefined,
        clothingFee: poloFee,

        // Formateur & Commission
        trainerSubtype: isFormateur ? (trainerSubtype as any) : undefined,
        commission: activeTab === 'commission' ? commissionName : undefined,
        wavePhoneNumber: wavePhoneNumber.trim() || undefined,

        // Finances (Statut en attente ou gratuit)
        registrationFee: participantFee,
        poloFee,
        totalFee: totalToPay,
        paymentStatus: actualPaymentStatus,
        paymentMethod: isFormateur ? undefined : 'Wave'
      }, config);

      confetti({
        particleCount: 110,
        spread: 70,
        origin: { y: 0.6 }
      });

      setCreatedParticipant(created);
      if (onRegistered) onRegistered(created);
    } catch (err: any) {
      console.error('Erreur inscription :', err);
      setErrors({ global: err?.message || 'Erreur lors de l’enregistrement de votre inscription.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-[#D9661A] to-[#FF9142] min-h-screen">
      {/* ------------------------------------------------------------- */}
      {/* EN-TÊTE COLLANT EN HAUT (#FFF5F0)                             */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-[#FFF5F0] border-b border-orange-200/70 shadow-sm px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo AEEMCI + Titres */}
          <div className="flex items-center gap-3">
            <img
              src={config.logoUrl || '/assets/aistudio/1771719145696_b78691d8.png'}
              alt="Logo AEEMCI"
              className="w-[52px] h-[52px] rounded-full object-contain border-2 border-orange-200 bg-white p-1 shadow-xs shrink-0"
            />
            <div>
              <h1 className="text-[18px] font-bold text-[#1F2937] leading-tight">
                {config.editionName || 'SERFIG 2027'}
              </h1>
              <p className="text-[11px] text-gray-500 leading-tight">
                {config.fullTitle || 'Séminaire Régional de Formation Islamique du Gôh'}
              </p>
            </div>
          </div>

          {/* Mini-barre au centre : "Étape X sur 4" (pendant l'inscription séminariste) */}
          {activeTab === 'seminariste' && !createdParticipant && (
            <div className="hidden md:flex flex-col items-center justify-center min-w-[150px]">
              <span className="text-[11px] font-semibold text-gray-600 mb-1">
                Étape {wizardStep} sur 4
              </span>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#F97316] transition-all duration-300 rounded-full"
                  style={{ width: `${(wizardStep / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Bouton Dashboard orange & Bouton Fermer */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenAdmin) {
                  onOpenAdmin();
                } else {
                  onClose();
                }
              }}
              type="button"
              className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Ouvrir l'Espace Administrateur"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-white" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-orange-100 rounded-full transition-all cursor-pointer"
              title="Fermer et retourner à l'accueil"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* CORPS PRINCIPAL DE L'INSCRIPTION                             */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10">

        {/* VUE DE SUCCÈS APRÈS VALIDATION */}
        {createdParticipant ? (
          <div className="bg-white rounded-[12px] shadow-xl border border-gray-100 p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>

              <h2 className="text-[22px] font-bold text-[#1F2937]">
                Inscription enregistrée avec succès !
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Bienvenue au SERFIG 2027. Votre demande a été enregistrée avec le statut <strong className="text-amber-600">en attente de validation</strong>.
              </p>

              <div className="my-5 p-4 bg-[#F9FAFB] rounded-xl border border-gray-200 text-left space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Matricule officiel :</span>
                  <span className="font-mono font-bold text-gray-900">{createdParticipant.matricule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Nom complet :</span>
                  <span className="font-bold text-gray-900">{createdParticipant.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Sous-comité :</span>
                  <span className="text-gray-800">{createdParticipant.subCommittee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Montant total :</span>
                  <span className="font-bold text-[#F97316]">{formatFCFA(createdParticipant.totalFee)}</span>
                </div>
              </div>

              {/* Navigation vue Reçu / Badge */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setSuccessViewTab(successViewTab === 'receipt' ? 'summary' : 'receipt')}
                  className="px-4 py-2 bg-[#1F2937] hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>{successViewTab === 'receipt' ? 'Masquer le Reçu' : 'Afficher mon Reçu A4'}</span>
                </button>

                <button
                  onClick={() => setSuccessViewTab(successViewTab === 'badge' ? 'summary' : 'badge')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <IdCard className="w-4 h-4" />
                  <span>{successViewTab === 'badge' ? 'Masquer le Badge' : 'Afficher mon Badge'}</span>
                </button>

                {onOpenParticipantSpace && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenParticipantSpace(createdParticipant);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mon Espace Séminariste</span>
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Retour à l'accueil
                </button>
              </div>

              {/* Reçu intégré */}
              {successViewTab === 'receipt' && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <RegistrationReceipt participant={createdParticipant} config={config} />
                </div>
              )}

              {/* Badge intégré */}
              {successViewTab === 'badge' && (
                <div className="mt-8 border-t border-gray-200 pt-6 flex justify-center">
                  <BadgeCard participant={createdParticipant} config={config} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* SÉLECTEUR DU PROFIL D'INSCRIPTION */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('seminariste');
                  setWizardStep(1);
                  setErrors({});
                }}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'seminariste'
                    ? 'bg-white text-[#F97316] shadow-md font-bold'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
                }`}
              >
                Séminariste (4 étapes)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('formateur');
                  setWizardStep(1);
                  setErrors({});
                }}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'formateur'
                    ? 'bg-white text-[#F97316] shadow-md font-bold'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
                }`}
              >
                Formateur
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('commission');
                  setWizardStep(1);
                  setErrors({});
                }}
                className={`px-3.5 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'commission'
                    ? 'bg-white text-[#F97316] shadow-md font-bold'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
                }`}
              >
                Membre de Commission
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CAS 1 : FORMULAIRE SÉMINARISTE (4 ÉTAPES)                    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'seminariste' && (
              <div className="space-y-5">
                {/* INDICATEUR D'ÉTAPES (carte blanche arrondie 12 px) */}
                <div className="bg-white rounded-[12px] p-4 sm:p-5 shadow-md border border-gray-100">
                  <div className="flex items-center justify-between relative">
                    {/* Lignes de liaison */}
                    <div className="absolute top-4.5 left-6 right-6 h-0.5 bg-gray-200 -z-0">
                      <div
                        className="h-full bg-[#10B981] transition-all duration-300"
                        style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
                      />
                    </div>

                    {[
                      { step: 1, label: 'Informations personnelles' },
                      { step: 2, label: 'Informations organisationnelles' },
                      { step: 3, label: 'Photo' },
                      { step: 4, label: 'Paiement' }
                    ].map(item => {
                      const isCompleted = item.step < wizardStep;
                      const isCurrent = item.step === wizardStep;

                      return (
                        <div key={item.step} className="flex flex-col items-center relative z-10 w-1/4">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCompleted
                                ? 'bg-[#10B981] text-white shadow-xs'
                                : isCurrent
                                  ? 'bg-[#F97316] text-white ring-4 ring-orange-200 shadow-sm'
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                          >
                            {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : item.step}
                          </div>
                          <span
                            className={`text-[11px] mt-2 text-center leading-tight transition-colors hidden sm:block ${
                              isCurrent
                                ? 'text-[#F97316] font-semibold'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CARTE DE FORMULAIRE BLANCHE */}
                <div className="bg-white rounded-[12px] shadow-xl border border-gray-100 p-5 sm:p-7">
                  
                  {/* ÉTAPE 1 : INFORMATIONS PERSONNELLES */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      {/* Titre avec petite icône orange à gauche puis trait de séparation */}
                      <div className="border-b border-gray-200 pb-3 mb-5">
                        <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                          <User className="w-5 h-5 text-[#F97316]" />
                          <span>Informations personnelles</span>
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nom */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            nom <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="text"
                            value={nom}
                            onChange={e => setNom(e.target.value)}
                            placeholder="ex: KOUASSI"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 ${
                              errors.nom ? 'border-red-400' : nom.trim() ? 'border-emerald-500' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.nom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.nom}</p>}
                        </div>

                        {/* Prénom */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            prénom <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="text"
                            value={prenom}
                            onChange={e => setPrenom(e.target.value)}
                            placeholder="ex: Ibrahim"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 ${
                              errors.prenom ? 'border-red-400' : prenom.trim() ? 'border-emerald-500' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.prenom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.prenom}</p>}
                        </div>

                        {/* Genre */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            genre <span className="text-[#EF4444]">*</span>
                          </label>
                          <select
                            value={genre}
                            onChange={e => setGenre(e.target.value as 'homme' | 'femme')}
                            className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                          >
                            <option value="homme">Frère</option>
                            <option value="femme">Sœur</option>
                          </select>
                        </div>

                        {/* Date de naissance */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            date de naissance <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="date"
                            value={birthDate}
                            onChange={e => setBirthDate(e.target.value)}
                            min="1930-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 ${
                              errors.birthDate ? 'border-red-400' : birthDate ? 'border-emerald-500' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.birthDate && <p className="text-[12px] text-[#EF4444] mt-1">{errors.birthDate}</p>}
                        </div>

                        {/* Téléphone */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            téléphone <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="07 XX XX XX XX"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 ${
                              errors.phone ? 'border-red-400' : phone.trim() ? 'border-emerald-500' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.phone && <p className="text-[12px] text-[#EF4444] mt-1">{errors.phone}</p>}
                        </div>

                        {/* Niveau d'étude */}
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            niveau d'étude <span className="text-[#EF4444]">*</span>
                          </label>
                          <select
                            value={schoolLevel}
                            onChange={e => setSchoolLevel(e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                          >
                            <option value="Collège (6ème à 3ème)">Collège (6ème à 3ème)</option>
                            <option value="Lycée (2nde à Terminale)">Lycée (2nde à Terminale)</option>
                            <option value="Université / Grande École">Université / Grande École</option>
                            <option value="Professionnel / Travailleur">Professionnel / Travailleur</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>‹ Retour à l'accueil</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (validateSeminaristeStep(1)) {
                              setWizardStep(2);
                            }
                          }}
                          className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Suivant ›</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : INFORMATIONS ORGANISATIONNELLES */}
                  {wizardStep === 2 && (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-3 mb-5">
                        <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                          <Star className="w-5 h-5 text-[#F97316]" />
                          <span>Informations organisationnelles</span>
                        </h2>
                      </div>

                      {/* Sous-comité */}
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1">
                          sous-comité <span className="text-[#EF4444]">*</span>
                        </label>
                        <select
                          value={subCommittee}
                          onChange={e => setSubCommittee(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] transition-all focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                        >
                          {config.subCommittees.map(sc => (
                            <option key={sc.id} value={sc.name}>
                              {sc.name} ({formatFCFA(sc.fee)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* BOÎTE POLO (fond #F9FAFB, bordure grise) */}
                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={wantsPolo}
                              onChange={e => setWantsPolo(e.target.checked)}
                              className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316]"
                            />
                            <span className="text-sm font-semibold text-[#1F2937]">
                              Je souhaite commander un polo
                            </span>
                          </label>
                          <span className="text-sm font-bold text-[#F97316] shrink-0">
                            + {formatFCFA(config.poloPrice || 2500)}
                          </span>
                        </div>
                        <p className="text-[12px] text-gray-500">
                          Polo officiel SERFIG 2027 de qualité supérieure avec logo brodé.
                        </p>

                        {/* Listes Taille et Couleur quand coché */}
                        {wantsPolo && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                            <div>
                              <label className="block text-[12px] font-medium text-[#374151] mb-1">
                                taille
                              </label>
                              <select
                                value={poloSize}
                                onChange={e => setPoloSize(e.target.value as any)}
                                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                              >
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="2XL">2XL</option>
                                <option value="3XL">3XL</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[12px] font-medium text-[#374151] mb-1">
                                couleur
                              </label>
                              <select
                                value={poloColor}
                                onChange={e => setPoloColor(e.target.value)}
                                className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                              >
                                <option value="Vert Forêt AEEMCI">Vert Forêt AEEMCI</option>
                                <option value="Blanc Cérémonie">Blanc Cérémonie</option>
                                <option value="Noir Prestige">Noir Prestige</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CARTE RÉCAPITULATIF (bordure grise) */}
                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Participation ({subCommittee})</span>
                          <span className="font-semibold text-gray-900">{formatFCFA(participantFee)}</span>
                        </div>
                        {wantsPolo && (
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Polo SERFIG 2027</span>
                            <span className="font-semibold text-gray-900">{formatFCFA(poloFee)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-2 flex items-baseline justify-between">
                          <span className="text-xs font-bold text-gray-700 uppercase">Total à payer</span>
                          <span className="text-[22px] font-bold text-[#F97316]">
                            {formatFCFA(totalToPay)}
                          </span>
                        </div>
                      </div>

                      {/* Parents / Tuteurs (obligatoires si mineur) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            nom du parent/tuteur {isMinor && <span className="text-[#EF4444]">*</span>}
                            <span className="text-[11px] text-gray-400 font-normal ml-1">
                              {isMinor ? '(obligatoire si moins de 18 ans)' : '(facultatif)'}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={parentName}
                            onChange={e => setParentName(e.target.value)}
                            placeholder="ex: M. KOUASSI Moussa"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] ${
                              errors.parentName ? 'border-red-400' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.parentName && <p className="text-[12px] text-[#EF4444] mt-1">{errors.parentName}</p>}
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            contact parent/tuteur {isMinor && <span className="text-[#EF4444]">*</span>}
                            <span className="text-[11px] text-gray-400 font-normal ml-1">
                              {isMinor ? '(obligatoire)' : '(facultatif)'}
                            </span>
                          </label>
                          <input
                            type="tel"
                            value={parentContact}
                            onChange={e => setParentContact(e.target.value)}
                            placeholder="07 XX XX XX XX"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] ${
                              errors.parentContact ? 'border-red-400' : 'border-[#E5E7EB]'
                            }`}
                          />
                          {errors.parentContact && <p className="text-[12px] text-[#EF4444] mt-1">{errors.parentContact}</p>}
                        </div>
                      </div>

                      {/* Question Santé : Avez-vous une maladie ? */}
                      <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-3">
                        <label className="block text-[12px] font-medium text-[#374151]">
                          avez-vous une maladie ? <span className="text-[#EF4444]">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1F2937]">
                            <input
                              type="radio"
                              name="hasMedical"
                              checked={hasMedicalCondition === false}
                              onChange={() => setHasMedicalCondition(false)}
                              className="text-[#F97316] focus:ring-[#F97316]"
                            />
                            <span>Non</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1F2937]">
                            <input
                              type="radio"
                              name="hasMedical"
                              checked={hasMedicalCondition === true}
                              onChange={() => setHasMedicalCondition(true)}
                              className="text-[#F97316] focus:ring-[#F97316]"
                            />
                            <span>Oui</span>
                          </label>
                        </div>
                        {errors.hasMedicalCondition && (
                          <p className="text-[12px] text-[#EF4444]">{errors.hasMedicalCondition}</p>
                        )}

                        {hasMedicalCondition && (
                          <div className="pt-2">
                            <label className="block text-[12px] font-medium text-[#374151] mb-1">
                              précisez (maladie, allergie, traitement) <span className="text-[#EF4444]">*</span>
                            </label>
                            <input
                              type="text"
                              value={medicalDetails}
                              onChange={e => setMedicalDetails(e.target.value)}
                              placeholder="ex: Asthme, allergie aux arachides, traitement..."
                              className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] ${
                                errors.medicalDetails ? 'border-red-400' : 'border-[#E5E7EB]'
                              }`}
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                              Information confidentielle, réservée à l'équipe d'organisation.
                            </p>
                            {errors.medicalDetails && (
                              <p className="text-[12px] text-[#EF4444] mt-1">{errors.medicalDetails}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Boutons d'action */}
                      <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setWizardStep(1)}
                          className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>‹ Précédent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (validateSeminaristeStep(2)) {
                              setWizardStep(3);
                            }
                          }}
                          className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Suivant ›</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : PHOTO DE PROFIL */}
                  {wizardStep === 3 && (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-3 mb-5">
                        <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                          <Camera className="w-5 h-5 text-[#F97316]" />
                          <span>Photo de profil</span>
                        </h2>
                      </div>

                      <p className="text-center text-sm text-gray-500 max-w-md mx-auto">
                        Ajoutez une photo de profil pour personnaliser votre inscription. Cette étape est optionnelle.
                      </p>

                      {/* ZONE DE PHOTO : cadre en pointillés gris */}
                      <div className="max-w-md mx-auto">
                        {photoUrl ? (
                          <div className="flex flex-col items-center p-4 bg-[#F9FAFB] border border-gray-200 rounded-xl">
                            <img
                              src={photoUrl}
                              alt="Aperçu photo"
                              className="w-32 h-32 rounded-xl object-cover border-2 border-emerald-500 shadow-sm mb-3"
                            />
                            <div className="flex gap-2">
                              <label className="px-3 py-1.5 bg-white border border-gray-300 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer">
                                Changer la photo
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setPhotoUrl('')}
                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 text-xs font-semibold rounded-lg hover:bg-red-100 cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-gray-300 hover:border-[#F97316] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#F9FAFB] hover:bg-orange-50/40">
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm font-semibold text-[#1F2937]">
                              Cliquez pour ajouter une photo
                            </span>
                            <span className="text-[11px] text-gray-400 mt-1">
                              Format recommandé : fond uni
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoUpload}
                            />
                          </label>
                        )}
                      </div>

                      {/* Boutons d'action */}
                      <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>‹ Précédent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWizardStep(4)}
                          className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Suivant ›</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 4 : PAIEMENT WAVE MONEY */}
                  {wizardStep === 4 && (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-3 mb-5">
                        <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-[#F97316]" />
                          <span>Paiement Wave Money</span>
                        </h2>
                      </div>

                      {/* CARTE PAIEMENT WAVE : carte orange en dégradé avec titre en BLANC */}
                      <div className="bg-gradient-to-r from-[#F97316] to-[#FF9142] rounded-xl p-5 sm:p-6 text-white shadow-md space-y-3">
                        <h3 className="text-base font-bold text-white tracking-wide">
                          Récapitulatif de votre commande
                        </h3>
                        
                        <div className="space-y-1.5 text-xs text-orange-50 border-t border-white/20 pt-2.5">
                          <div className="flex justify-between">
                            <span>Participation séminaire ({subCommittee})</span>
                            <span className="font-semibold text-white">{formatFCFA(participantFee)}</span>
                          </div>
                          {wantsPolo && (
                            <div className="flex justify-between">
                              <span>Polo officiel ({poloSize} - {poloColor})</span>
                              <span className="font-semibold text-white">{formatFCFA(poloFee)}</span>
                            </div>
                          )}
                        </div>

                        <div className="border-t border-white/30 pt-3 flex items-baseline justify-between">
                          <span className="text-xs uppercase font-extrabold tracking-wider text-orange-100">
                            Total à payer
                          </span>
                          <span className="text-[26px] font-black text-white">
                            {formatFCFA(totalToPay)}
                          </span>
                        </div>
                      </div>

                      {/* BOÎTE D'INFORMATION WAVE (#F0FDFA avec cercle orange) */}
                      <div className="bg-[#F0FDFA] border border-teal-200/80 rounded-xl p-4 sm:p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#F97316] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#F97316]">
                              Paiement via Wave Money
                            </h4>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Entrez votre numéro Wave pour finaliser l'inscription.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-medium text-[#374151] mb-1">
                            numéro wave <span className="text-[#EF4444]">*</span>
                          </label>
                          <input
                            type="tel"
                            value={wavePhoneNumber}
                            onChange={e => setWavePhoneNumber(e.target.value)}
                            placeholder="07 XX XX XX XX"
                            className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] transition-all focus:outline-none focus:border-[#F97316] ${
                              errors.wavePhoneNumber ? 'border-red-400' : 'border-[#E5E7EB]'
                            }`}
                          />
                          <p className="text-[11px] text-gray-500 mt-1">
                            Le paiement sera effectué via Wave Money.
                          </p>
                          {errors.wavePhoneNumber && (
                            <p className="text-[12px] text-[#EF4444] mt-1">{errors.wavePhoneNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Boutons d'action */}
                      <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setWizardStep(3)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>‹ Précédent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (validateSeminaristeStep(4)) {
                              submitRegistration();
                            }
                          }}
                          disabled={isSubmitting}
                          className="px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Envoi en cours...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Soumettre l'inscription</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CAS 2 : FORMULAIRE FORMATEUR (UNE SEULE PAGE)                 */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'formateur' && (
              <div className="bg-white rounded-[12px] shadow-xl border border-gray-100 p-5 sm:p-7 space-y-4">
                <div className="border-b border-gray-200 pb-3 mb-5">
                  <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-[#F97316]" />
                    <span>Inscription Formateur</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Type d'inscription */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      type d'inscription <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      value={trainerSubtype}
                      onChange={e => setTrainerSubtype(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                    >
                      <option value="Formateur Résident">Formateur Résident</option>
                      <option value="Conférencier Invité">Conférencier Invité</option>
                      <option value="Encadreur d'Atelier">Encadreur d'Atelier</option>
                      <option value="Enseignant / Oustaz">Enseignant / Oustaz</option>
                    </select>
                  </div>

                  {/* Sous-comité */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      sous-comité <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      value={subCommittee}
                      onChange={e => setSubCommittee(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                    >
                      {config.subCommittees.map(sc => (
                        <option key={sc.id} value={sc.name}>{sc.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Nom */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      nom <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      placeholder="ex: CISSE"
                      className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                        errors.nom ? 'border-red-400' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {errors.nom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.nom}</p>}
                  </div>

                  {/* Prénom */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      prénom <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      placeholder="ex: Ousmane"
                      className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                        errors.prenom ? 'border-red-400' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {errors.prenom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.prenom}</p>}
                  </div>
                </div>

                {/* Contact & Photo (sur deux lignes de hauteur) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      contact <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="07 XX XX XX XX"
                      className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                        errors.phone ? 'border-red-400' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {errors.phone && <p className="text-[12px] text-[#EF4444] mt-1">{errors.phone}</p>}
                  </div>

                  {/* Photo OBLIGATOIRE sur deux lignes de hauteur */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      ajouter une photo <span className="text-[#EF4444]">*</span>
                    </label>
                    {photoUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-gray-200 rounded-lg">
                        <img
                          src={photoUrl}
                          alt="Formateur"
                          className="w-16 h-16 rounded-lg object-cover border border-emerald-500 shrink-0"
                        />
                        <div>
                          <label className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer block">
                            Modifier la photo
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePhotoUpload}
                            />
                          </label>
                          <span className="text-[11px] text-gray-500">Photo enregistrée</span>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 hover:border-[#F97316] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#F9FAFB] hover:bg-orange-50/30">
                        <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-[#1F2937]">
                          Cliquez pour ajouter une photo
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          Obligatoire pour le badge Formateur
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                    {errors.photo && <p className="text-[12px] text-[#EF4444] mt-1">{errors.photo}</p>}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>‹ Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateFormateur()) {
                        submitRegistration();
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Soumettre l'inscription</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CAS 3 : FORMULAIRE MEMBRE DE COMMISSION (UNE SEULE PAGE)      */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'commission' && (
              <div className="bg-white rounded-[12px] shadow-xl border border-gray-100 p-5 sm:p-7 space-y-4">
                <div className="border-b border-gray-200 pb-3 mb-5">
                  <h2 className="text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#F97316]" />
                    <span>Inscription Membre de Commission</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      nom <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={nom}
                      onChange={e => setNom(e.target.value)}
                      placeholder="ex: DIABY"
                      className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                        errors.nom ? 'border-red-400' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {errors.nom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.nom}</p>}
                  </div>

                  {/* Prénom */}
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      prénom <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={e => setPrenom(e.target.value)}
                      placeholder="ex: Fatima"
                      className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                        errors.prenom ? 'border-red-400' : 'border-[#E5E7EB]'
                      }`}
                    />
                    {errors.prenom && <p className="text-[12px] text-[#EF4444] mt-1">{errors.prenom}</p>}
                  </div>
                </div>

                {/* Contact (pleine largeur) */}
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    contact <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="07 XX XX XX XX"
                    className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                      errors.phone ? 'border-red-400' : 'border-[#E5E7EB]'
                    }`}
                  />
                  {errors.phone && <p className="text-[12px] text-[#EF4444] mt-1">{errors.phone}</p>}
                </div>

                {/* Sous-comité & Commission */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      sous-comité <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      value={subCommittee}
                      onChange={e => setSubCommittee(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                    >
                      {config.subCommittees.map(sc => (
                        <option key={sc.id} value={sc.name}>{sc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1">
                      commission <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      value={commissionName}
                      onChange={e => setCommissionName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                    >
                      {COMMISSIONS_LIST.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ajouter une photo (obligatoire) */}
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    ajouter une photo <span className="text-[#EF4444]">*</span>
                  </label>
                  {photoUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] border border-gray-200 rounded-lg">
                      <img
                        src={photoUrl}
                        alt="Membre commission"
                        className="w-16 h-16 rounded-lg object-cover border border-emerald-500 shrink-0"
                      />
                      <div>
                        <label className="text-xs font-semibold text-[#F97316] hover:underline cursor-pointer block">
                          Modifier la photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                        </label>
                        <span className="text-[11px] text-gray-500">Photo enregistrée</span>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 hover:border-[#F97316] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#F9FAFB] hover:bg-orange-50/30">
                      <UploadCloud className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs font-semibold text-[#1F2937]">
                        Cliquez pour ajouter une photo
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        Obligatoire pour le badge officiel Commission
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  )}
                  {errors.photo && <p className="text-[12px] text-[#EF4444] mt-1">{errors.photo}</p>}
                </div>

                {/* Boîte Polo (charte) */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={wantsPolo}
                        onChange={e => setWantsPolo(e.target.checked)}
                        className="w-4 h-4 text-[#F97316] rounded border-gray-300 focus:ring-[#F97316]"
                      />
                      <span className="text-sm font-semibold text-[#1F2937]">
                        Je souhaite commander un polo
                      </span>
                    </label>
                    <span className="text-sm font-bold text-[#F97316] shrink-0">
                      + {formatFCFA(config.poloPrice || 2500)}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500">
                    Polo officiel SERFIG 2027 de qualité supérieure avec logo brodé.
                  </p>

                  {wantsPolo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1">taille</label>
                        <select
                          value={poloSize}
                          onChange={e => setPoloSize(e.target.value as any)}
                          className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="2XL">2XL</option>
                          <option value="3XL">3XL</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#374151] mb-1">couleur</label>
                        <select
                          value={poloColor}
                          onChange={e => setPoloColor(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-[#E5E7EB] rounded-lg text-[16px] text-[#1F2937] focus:outline-none focus:border-[#F97316]"
                        >
                          <option value="Vert Forêt AEEMCI">Vert Forêt AEEMCI</option>
                          <option value="Blanc Cérémonie">Blanc Cérémonie</option>
                          <option value="Noir Prestige">Noir Prestige</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carte récapitulatif */}
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Frais d'inscription (Commission)</span>
                    <span className="font-semibold text-gray-900">{formatFCFA(participantFee)}</span>
                  </div>
                  {wantsPolo && (
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Polo SERFIG 2027</span>
                      <span className="font-semibold text-gray-900">{formatFCFA(poloFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 flex items-baseline justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase">Total à payer</span>
                    <span className="text-[22px] font-bold text-[#F97316]">
                      {formatFCFA(totalToPay)}
                    </span>
                  </div>
                </div>

                {/* Numéro Wave */}
                <div>
                  <label className="block text-[12px] font-medium text-[#374151] mb-1">
                    numéro wave <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={wavePhoneNumber}
                    onChange={e => setWavePhoneNumber(e.target.value)}
                    placeholder="07 XX XX XX XX"
                    className={`w-full h-10 px-3 bg-white border rounded-lg text-[16px] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] ${
                      errors.wavePhoneNumber ? 'border-red-400' : 'border-[#E5E7EB]'
                    }`}
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Le paiement sera effectué via Wave Money.
                  </p>
                  {errors.wavePhoneNumber && (
                    <p className="text-[12px] text-[#EF4444] mt-1">{errors.wavePhoneNumber}</p>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="border-t border-gray-200 pt-4 mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#F3F4F6] hover:bg-gray-200 text-[#374151] text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>‹ Retour</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateCommission()) {
                        submitRegistration();
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Soumettre l'inscription</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
};
