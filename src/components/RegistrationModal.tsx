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
  Shirt, 
  Camera, 
  FileText, 
  IdCard, 
  User, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Users, 
  Award,
  Phone,
  Printer
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
  initialType?: ParticipantType;
  onRegistered?: (participant: Participant) => void;
  onOpenParticipantSpace?: (participant: Participant) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  config,
  initialType = 'seminariste',
  onRegistered,
  onOpenParticipantSpace
}) => {
  const [activeTab, setActiveTab] = useState<ParticipantType>(initialType);
  const [createdParticipant, setCreatedParticipant] = useState<Participant | null>(null);
  const [successViewTab, setSuccessViewTab] = useState<'receipt' | 'badge'>('receipt');
  
  // Step indicator for progressive wizard (parcours d'inscription)
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Synchronize activeTab and step when opened with an initialType
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialType);
      setWizardStep(1);
      setCreatedParticipant(null);
      setShowWaveModal(false);
      setErrorMessage('');
      setBirthDate('');
      setParentContact('');
      setTransportMode('');
    }
  }, [isOpen, initialType]);

  // Reset wizard step when user switches tabs manually
  const handleTabChange = (type: ParticipantType) => {
    setActiveTab(type);
    setWizardStep(1);
    setErrorMessage('');
  };

  // Step 1: Identité & Coordonnées
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme'>('homme');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Step 2: Cursus Scolaire & Origine
  const [subCommittee, setSubCommittee] = useState(config.subCommittees[0]?.name || 'Sous-Comité Gagnoa');
  const [schoolLevel, setSchoolLevel] = useState('Lycée');
  const [schoolName, setSchoolName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [transportMode, setTransportMode] = useState('');

  // Âge calculé à partir de birthDate et indicateur de minorité (< 18 ans)
  const participantAge = calculateAge(birthDate);
  const isMinor = participantAge !== null && participantAge < 18;

  // Formateur & Aîné specific fields
  const [trainerSubtype, setTrainerSubtype] = useState<'formateur' | 'aine'>('formateur');
  const [trainerTitle, setTrainerTitle] = useState('Oustaz / Enseignant');
  const [teachingSubject, setTeachingSubject] = useState('');
  const [trainerBio, setTrainerBio] = useState('');
  const [trainerAvailability, setTrainerAvailability] = useState('Toute la semaine (12 au 18 avril 2027)');
  const [trainerAccommodation, setTrainerAccommodation] = useState('Dortoir Formateurs / Aînés pris en charge');

  // Commission specific fields
  const [commission, setCommission] = useState('Sécurité & Discipline');
  const [commissionRole, setCommissionRole] = useState('Membre actif');
  const [commissionExperience, setCommissionExperience] = useState('Déjà servi dans un précédent séminaire SERFIG');

  // Step 3: Tenue Officielle (Séminariste & Commission)
  const [clothingChoice, setClothingChoice] = useState<'aucun' | 'polo' | 'tshirt'>('polo');
  const [poloSize, setPoloSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');
  const [poloColor, setPoloColor] = useState('Vert Forêt');

  // Step 4: Règlement & Wave Débit Direct
  const [paymentMethod, setPaymentMethod] = useState<'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Espèces sur place'>('Wave');
  const [wavePhoneNumber, setWavePhoneNumber] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Wave Debit simulation modal
  const [showWaveModal, setShowWaveModal] = useState(false);
  const [waveProcessingState, setWaveProcessingState] = useState<'idle' | 'waiting' | 'success'>('idle');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-sync Wave phone with telephone if empty
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (!wavePhoneNumber || wavePhoneNumber === phone) {
      setWavePhoneNumber(val);
    }
  };

  if (!isOpen) return null;

  // Pricing calculations
  const registrationFee = activeTab === 'seminariste' 
    ? 2000 
    : activeTab === 'commission' 
      ? 2000 
      : 0;

  const clothingFee = (activeTab === 'seminariste' || activeTab === 'commission')
    ? (clothingChoice === 'polo' ? (config.poloPrice || 2500) : clothingChoice === 'tshirt' ? (config.tshirtPrice || 2000) : 0)
    : 0;

  const totalAmount = registrationFee + clothingFee;

  // Total steps depending on participant type
  const getTotalSteps = () => {
    if (activeTab === 'formateur') return 3;
    return 4; // Séminariste and Commission have 4 steps
  };

  // Step validation
  const validateStep = (currentStep: number): boolean => {
    setErrorMessage('');
    
    if (activeTab === 'seminariste') {
      if (currentStep === 1) {
        if (!fullName.trim()) {
          setErrorMessage('Veuillez saisir votre nom et prénoms complets.');
          return false;
        }
        if (!birthDate) {
          setErrorMessage('Veuillez sélectionner votre date de naissance.');
          return false;
        }
        if (!phone.trim()) {
          setErrorMessage('Veuillez renseigner votre numéro de téléphone d\'appel.');
          return false;
        }
        return true;
      }
      if (currentStep === 2) {
        if (isMinor && !parentContact.trim()) {
          setErrorMessage('Le contact d\'un parent ou tuteur est obligatoire pour les participants mineurs (moins de 18 ans).');
          return false;
        }
        return true;
      }
      return true;
    }

    if (activeTab === 'commission') {
      if (currentStep === 1) {
        if (!commission.trim()) {
          setErrorMessage('Veuillez choisir une commission d\'affectation.');
          return false;
        }
        return true;
      }
      if (currentStep === 2) {
        if (!fullName.trim()) {
          setErrorMessage('Veuillez saisir votre nom et prénoms complets.');
          return false;
        }
        if (!phone.trim()) {
          setErrorMessage('Veuillez renseigner votre numéro de téléphone.');
          return false;
        }
        return true;
      }
      return true;
    }

    if (activeTab === 'formateur') {
      if (currentStep === 1) {
        if (!teachingSubject.trim()) {
          setErrorMessage(
            trainerSubtype === 'aine' 
              ? 'Veuillez préciser votre domaine de conseil ou thème d\'intervention.' 
              : 'Veuillez préciser la matière ou thème du cours à dispenser.'
          );
          return false;
        }
        return true;
      }
      if (currentStep === 2) {
        if (!fullName.trim()) {
          setErrorMessage('Veuillez saisir votre nom et prénoms complets.');
          return false;
        }
        if (!phone.trim()) {
          setErrorMessage('Veuillez renseigner votre numéro de téléphone.');
          return false;
        }
        return true;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep(prev => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    setWizardStep(prev => Math.max(prev - 1, 1));
  };

  const executeRegistration = (paidViaWave: boolean = false, waveRef?: string) => {
    try {
      const actualPaymentMethod = activeTab === 'formateur' 
        ? undefined 
        : paidViaWave ? 'Wave' : paymentMethod;

      const actualPaymentStatus = activeTab === 'formateur'
        ? 'gratuit'
        : paidViaWave ? 'paye' : (paymentReference ? 'paye' : 'en_attente');

      const actualPaymentRef = paidViaWave
        ? (waveRef || `WAVE-CI-${Math.floor(10000000 + Math.random() * 90000000)}`)
        : (paymentReference.trim() || undefined);

      const newPart = addParticipant({
        type: activeTab,
        fullName: fullName.trim(),
        gender,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || undefined,
        subCommittee,
        birthDate: birthDate ? birthDate.trim() : undefined,
        parentContact: parentContact.trim() || undefined,
        transportMode: transportMode.trim() || undefined,
        photoUrl: photoUrl || undefined,

        // Séminariste
        schoolLevel: activeTab === 'seminariste' ? schoolLevel : undefined,
        schoolName: activeTab === 'seminariste' ? schoolName.trim() : undefined,

        // Formateur & Aîné
        trainerSubtype: activeTab === 'formateur' ? trainerSubtype : undefined,
        trainerTitle: activeTab === 'formateur' ? trainerTitle : undefined,
        teachingSubject: activeTab === 'formateur' ? teachingSubject.trim() : undefined,
        trainerBio: activeTab === 'formateur' ? trainerBio.trim() : undefined,
        availability: activeTab === 'formateur' ? trainerAvailability : undefined,

        // Commission
        commission: activeTab === 'commission' ? commission : undefined,
        commissionRole: activeTab === 'commission' ? commissionRole : undefined,
        commissionExperience: activeTab === 'commission' ? commissionExperience : undefined,
        wavePhoneNumber: (activeTab === 'commission' || paymentMethod === 'Wave') ? (wavePhoneNumber.trim() || phone.trim()) : undefined,

        // Tenue Officielle (Polo ou Tee-shirt)
        clothingType: (activeTab === 'seminariste' || activeTab === 'commission') ? clothingChoice : undefined,
        hasPolo: (activeTab === 'seminariste' || activeTab === 'commission') && clothingChoice !== 'aucun',
        poloSize: (activeTab === 'seminariste' || activeTab === 'commission') && clothingChoice !== 'aucun' ? poloSize : undefined,
        poloColor: (activeTab === 'seminariste' || activeTab === 'commission') && clothingChoice !== 'aucun' ? poloColor : undefined,

        // Finances
        registrationFee,
        poloFee: clothingFee,
        clothingFee,
        totalFee: totalAmount,
        paymentStatus: actualPaymentStatus,
        paymentMethod: actualPaymentMethod,
        paymentReference: actualPaymentRef
      }, config);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setCreatedParticipant(newPart);
      if (onRegistered) onRegistered(newPart);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
      setShowWaveModal(false);
    }
  };

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!validateStep(wizardStep)) {
      return;
    }

    // Direct Wave debit trigger for Séminariste and Commission
    if (activeTab !== 'formateur' && paymentMethod === 'Wave') {
      const targetWaveNum = wavePhoneNumber.trim() || phone.trim();
      if (!targetWaveNum) {
        setErrorMessage('Veuillez renseigner votre numéro de compte Wave pour le débit direct.');
        return;
      }
      setWavePhoneNumber(targetWaveNum);
      setShowWaveModal(true);
      setWaveProcessingState('waiting');
      return;
    }

    // Direct submission for Formateur / Aîné or alternative payment
    setIsSubmitting(true);
    executeRegistration(false);
  };

  const handleConfirmWaveDebit = () => {
    setWaveProcessingState('success');
    setTimeout(() => {
      const generatedWaveRef = `WAVE-CI-${Math.floor(10000000 + Math.random() * 90000000)}`;
      executeRegistration(true, generatedWaveRef);
    }, 1200);
  };

  const handleResetForNew = () => {
    setCreatedParticipant(null);
    setWizardStep(1);
    setFullName('');
    setPhone('');
    setPaymentReference('');
    setWavePhoneNumber('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER : ORANGE & BLANC (STYLE PAGE D'ACCUEIL)                      */}
        {/* Uniquement Logo AEEMCI + Nom du Séminaire, SANS barre encombrante         */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-700 p-4 sm:p-6 text-white relative shadow-md">
          {/* Bouton Fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-all cursor-pointer backdrop-blur-xs"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3.5 pr-10">
            {/* Logo officiel de l'AEEMCI */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border-2 border-white/40">
              <img
                src={config.logoUrl || '/src/assets/images/aeemci_official_logo_1792254182659.jpg'}
                alt="Logo Officiel AEEMCI"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Infos Séminaire */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-orange-600 text-[11px] font-black uppercase tracking-wider shadow-xs">
                  {config.editionName}
                </span>
                <span className="text-white/90 text-xs font-bold">
                  Région du Gôh • {config.location.city}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight mt-1 truncate">
                {activeTab === 'commission' && "Inscription Membre de Commission"}
                {activeTab === 'seminariste' && "Inscription Séminariste"}
                {activeTab === 'formateur' && "Inscription Formateur / Aîné"}
              </h2>

              <p className="text-xs sm:text-sm text-white/90 font-medium line-clamp-1 mt-0.5">
                {config.fullTitle} • {config.displayDates}
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar (Orange & Blanc) */}
          {!createdParticipant && (
            <div className="mt-4 pt-3 border-t border-white/25">
              <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1.5 px-0.5">
                <span className="bg-white/20 px-2 py-0.5 rounded-md">Étape {wizardStep} sur {getTotalSteps()}</span>
                <span className="text-white font-black">
                  {activeTab === 'commission' && (
                    wizardStep === 1 ? '1. Affectation Commission' :
                    wizardStep === 2 ? '2. Identité & Contact' :
                    wizardStep === 3 ? '3. Choix de la Tenue' : '4. Débit Wave direct'
                  )}
                  {activeTab === 'seminariste' && (
                    wizardStep === 1 ? '1. Identité & Photo' :
                    wizardStep === 2 ? '2. Scolarité & Origine' :
                    wizardStep === 3 ? '3. Choix de la Tenue' : '4. Récapitulatif & Débit Wave'
                  )}
                  {activeTab === 'formateur' && (
                    wizardStep === 1 ? '1. Rôle & Thème' :
                    wizardStep === 2 ? '2. Coordonnées & Présentation' : '3. Prise en charge & Validation'
                  )}
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden flex gap-1 p-0.5 border border-white/30">
                {Array.from({ length: getTotalSteps() }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-full rounded-full transition-all duration-300 flex-1 ${
                      idx + 1 <= wizardStep
                        ? 'bg-white shadow-xs'
                        : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[78vh] overflow-y-auto">
          {createdParticipant ? (
            /* ========================================================================= */
            /* SUCCESS VIEW : REÇU OFFICIEL A4 + BADGE PLASTIFIÉ                         */
            /* ========================================================================= */
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full mb-3 shadow-inner">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900">Al-Hamdoullilah ! Inscription Validée</h3>
              
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                L'inscription de <span className="font-extrabold text-orange-600">{createdParticipant.fullName}</span> a été enregistrée avec succès sous le matricule officiel ci-dessous.
              </p>

              {/* Status and Matricule Box */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-3.5 py-1.5 bg-orange-600 text-white font-mono font-black text-sm rounded-xl tracking-wider shadow-sm">
                  {createdParticipant.matricule}
                </span>
                <span className="px-3 py-1.5 bg-orange-100 text-orange-900 font-black text-xs rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>{createdParticipant.paymentStatus === 'paye' ? 'Paiement Confirmé' : createdParticipant.paymentStatus === 'gratuit' ? 'Prise en charge' : 'Enregistré'}</span>
                </span>
              </div>

              {/* Document Switcher Tab */}
              <div className="flex justify-center gap-2 mt-5 mb-4">
                <button
                  onClick={() => setSuccessViewTab('receipt')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    successViewTab === 'receipt'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Reçu d'Inscription Officiel (Format A4)</span>
                </button>
                <button
                  onClick={() => setSuccessViewTab('badge')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    successViewTab === 'badge'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <IdCard className="w-4 h-4" />
                  <span>Badge Plastifié & QR Code</span>
                </button>
              </div>

              {/* Render Current Document */}
              <div className="mt-2 flex justify-center">
                {successViewTab === 'receipt' ? (
                  <RegistrationReceipt participant={createdParticipant} config={config} />
                ) : (
                  <div className="max-w-md w-full">
                    <BadgeCard participant={createdParticipant} config={config} />
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer le Reçu / Badge</span>
                </button>

                {onOpenParticipantSpace && (
                  <button
                    onClick={() => {
                      onOpenParticipantSpace(createdParticipant);
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-orange-600 text-white text-xs font-black rounded-xl hover:bg-orange-700 flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Ouvrir mon Espace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleResetForNew}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Inscrire une autre personne
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-300 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* ACTIVE FORM BY ROLE & WIZARD STEPS (COULEURS ORANGE ET BLANC)             */
            /* ========================================================================= */
            <form onSubmit={(e) => { e.preventDefault(); handleFinalSubmit(); }} className="space-y-4">
              
              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ===================================================================== */}
              {/* SÉMINARISTE PARCOURS (4 ÉTAPES GUIDÉES)                                */}
              {/* ===================================================================== */}
              {activeTab === 'seminariste' && (
                <>
                  {/* ÉTAPE 1 : IDENTITÉ & PHOTO */}
                  {wizardStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 1 : Identité & Photo du Séminariste
                          </h3>
                          <p className="text-xs text-slate-500">
                            Renseignez vos coordonnées exactes pour votre reçu officiel SERFIG 2027.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          1 / 4
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Nom et prénoms */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nom & Prénoms complets *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: TRAORÉ Ibrahim Kalil"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        {/* Genre */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Genre *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setGender('homme')}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                                gender === 'homme'
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              🧔 Frère
                            </button>
                            <button
                              type="button"
                              onClick={() => setGender('femme')}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                                gender === 'femme'
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              🧕 Sœur
                            </button>
                          </div>
                        </div>

                        {/* Date de naissance */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Date de naissance *
                          </label>
                          <input
                            type="date"
                            required
                            min="1930-01-01"
                            max={new Date().toISOString().split('T')[0]}
                            value={birthDate}
                            onChange={e => setBirthDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          {birthDate && (
                            <p className="text-[11px] text-slate-600 mt-1 font-medium">
                              Âge calculé : <span className="font-bold text-orange-700">{participantAge !== null ? `${participantAge} ans` : '—'}</span>
                              {isMinor && (
                                <span className="ml-1 text-amber-700 font-bold">(Mineur &lt; 18 ans • contact parent requis)</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Téléphone (Appels) */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Téléphone (Appels) *
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              placeholder="Ex: 07 48 11 22 33"
                              value={phone}
                              onChange={e => handlePhoneChange(e.target.value)}
                              className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          </div>
                        </div>

                        {/* WhatsApp */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                              Numéro WhatsApp
                            </label>
                            {phone && (!whatsapp || whatsapp !== phone) && (
                              <button
                                type="button"
                                onClick={() => setWhatsapp(phone)}
                                className="text-[10px] text-orange-600 font-bold hover:underline cursor-pointer"
                              >
                                Même que téléphone
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="tel"
                              placeholder="Ex: 07 48 11 22 33"
                              value={whatsapp}
                              onChange={e => setWhatsapp(e.target.value)}
                              className="w-full px-3 py-2 pl-9 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <Smartphone className="w-4 h-4 text-orange-600 absolute left-3 top-2.5" />
                          </div>
                        </div>

                        {/* Photo d'identité */}
                        <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 bg-white border-2 border-orange-500 rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                              {photoUrl ? (
                                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Photo d'Identité pour le Reçu & Badge</p>
                              <p className="text-[11px] text-slate-500">Figure sur la fiche officielle et la carte plastifiée.</p>
                            </div>
                          </div>

                          <label className="px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{photoUrl ? 'Changer' : 'Ajouter Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPhotoUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : SCOLARITÉ & ORIGINE */}
                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 2 : Cursus Scolaire & Origine
                          </h3>
                          <p className="text-xs text-slate-500">
                            Indiquez votre provenance dans le Gôh et vos informations de scolarité.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          2 / 4
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Sous-comité */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Sous-Comité AEEMCI de provenance *
                          </label>
                          <select
                            value={subCommittee}
                            onChange={e => setSubCommittee(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {config.subCommittees.map(sc => (
                              <option key={sc.id} value={sc.name}>
                                {sc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Niveau d'études */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Niveau d'études *
                          </label>
                          <select
                            value={schoolLevel}
                            onChange={e => setSchoolLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Collège">Collège (6ème à 3ème)</option>
                            <option value="Lycée">Lycée (2nde à Terminale)</option>
                            <option value="Université / Supérieur">Université / Supérieur</option>
                            <option value="Professionnel / Travailleur">Professionnel / Travailleur</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>

                        {/* Établissement */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Établissement ou Commune
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Lycée Moderne 1 de Gagnoa"
                            value={schoolName}
                            onChange={e => setSchoolName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Contact parent / tuteur */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Contact Parent / Tuteur {isMinor ? '*' : '(Facultatif)'}
                          </label>
                          <input
                            type="tel"
                            required={isMinor}
                            placeholder={isMinor ? "Ex: 07 48 11 22 33 (Requis pour mineur)" : "Ex: 07 48 11 22 33 (Facultatif)"}
                            value={parentContact}
                            onChange={e => setParentContact(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">
                            {isMinor 
                              ? "Numéro obligatoire pour les participants de moins de 18 ans en cas d'urgence." 
                              : "Numéro joignable en cas d'urgence durant le séminaire (facultatif pour les majeurs)."}
                          </p>
                        </div>

                        {/* Mode de transport */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Mode de Transport vers Gagnoa (Facultatif)
                          </label>
                          <select
                            value={transportMode}
                            onChange={e => setTransportMode(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Sélectionnez un mode de transport (facultatif)</option>
                            <option value="Convoi organisé par le Sous-Comité">Convoi organisé par le Sous-Comité</option>
                            <option value="Transport personnel depuis l'intérieur">Transport personnel</option>
                            <option value="Car affrété AEEMCI">Car affrété AEEMCI</option>
                            <option value="Résident sur place à Gagnoa">Résident sur place à Gagnoa</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : CHOIX DE LA TENUE (POLO OU T-SHIRT) */}
                  {wizardStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 3 : Tenue Officielle du Séminaire
                          </h3>
                          <p className="text-xs text-slate-500">
                            Choisissez votre tenue officielle : Polo brodé ou Tee-shirt simple aux couleurs du SERFIG 2027.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          3 / 4
                        </span>
                      </div>

                      {/* 3 Clothing Selection Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setClothingChoice('aucun')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'aucun'
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">🚫</span>
                            <span className="block text-sm font-bold">Sans tenue</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'aucun' ? 'text-slate-300' : 'text-slate-500'}`}>
                              Participation uniquement
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block">+0 FCFA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setClothingChoice('polo')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'polo'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">👕</span>
                            <span className="block text-sm font-bold">Polo Brodé Officiel</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'polo' ? 'text-orange-100' : 'text-slate-500'}`}>
                              Col renforcé & broderie SERFIG
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block text-orange-200">
                            2 500 FCFA
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setClothingChoice('tshirt')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'tshirt'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">👕</span>
                            <span className="block text-sm font-bold">Tee-shirt Simple</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'tshirt' ? 'text-orange-100' : 'text-slate-500'}`}>
                              100% Coton sérigraphié
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block text-orange-200">
                            2 000 FCFA
                          </span>
                        </button>
                      </div>

                      {clothingChoice !== 'aucun' && (
                        <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-3 animate-in fade-in">
                          <p className="text-xs font-bold text-orange-950">
                            Précisez votre taille et couleur pour {clothingChoice === 'polo' ? 'le Polo Brodé' : 'le Tee-shirt Simple'} :
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Taille
                              </label>
                              <select
                                value={poloSize}
                                onChange={e => setPoloSize(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="S">Taille S</option>
                                <option value="M">Taille M</option>
                                <option value="L">Taille L (Standard)</option>
                                <option value="XL">Taille XL</option>
                                <option value="2XL">Taille 2XL</option>
                                <option value="3XL">Taille 3XL</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Coloris
                              </label>
                              <select
                                value={poloColor}
                                onChange={e => setPoloColor(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="Vert Forêt">Vert Forêt AEEMCI</option>
                                <option value="Blanc Col Vert">Blanc Cérémonie</option>
                                <option value="Noir">Noir Prestige</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ÉTAPE 4 : RÉCAPITULATIF & PAIEMENT WAVE DÉBIT DIRECT */}
                  {wizardStep === 4 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 4 : Récapitulatif & Règlement Wave
                          </h3>
                          <p className="text-xs text-slate-500">
                            Finalisez votre inscription par prélèvement direct sur votre compte Wave.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          4 / 4
                        </span>
                      </div>

                      {/* Financial Summary Card */}
                      <div className="p-4 bg-orange-50/70 rounded-2xl border-2 border-orange-200 space-y-2.5">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Frais de participation Séminariste (Région du Gôh) :</span>
                          <span className="font-bold text-slate-800">2 000 FCFA</span>
                        </div>

                        {clothingChoice !== 'aucun' && (
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>{clothingChoice === 'polo' ? 'Polo Officiel Brodé (Taille ' + poloSize + ')' : 'Tee-shirt Simple (Taille ' + poloSize + ')'} :</span>
                            <span className="font-bold text-orange-600">+{clothingFee.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm sm:text-base font-black text-orange-950 pt-2 border-t border-orange-200">
                          <span>Montant Total à régler :</span>
                          <span className="text-lg text-orange-600 font-mono font-black">
                            {totalAmount.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                          Mode de Règlement
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Wave')}
                            className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              paymentMethod === 'Wave'
                                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md ring-2 ring-blue-300'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-lg">🌊</span>
                            <span className="font-bold text-xs sm:text-sm">Paiement Direct Wave</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('Espèces sur place')}
                            className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              paymentMethod === 'Espèces sur place'
                                ? 'bg-slate-800 text-white border-slate-800 font-bold shadow-md'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                            <span className="font-bold text-xs sm:text-sm">Autre / Sur place</span>
                          </button>
                        </div>

                        {/* Wave Input Block */}
                        {paymentMethod === 'Wave' ? (
                          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                <span className="text-base">🌊</span>
                                <span>Débit direct sur votre compte Wave</span>
                              </span>
                              <span className="text-[10px] font-black bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">
                                Recommandé
                              </span>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Numéro de compte Wave à débiter *
                              </label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  required
                                  placeholder="Ex: 07 48 11 22 33"
                                  value={wavePhoneNumber || phone}
                                  onChange={e => setWavePhoneNumber(e.target.value)}
                                  className="w-full px-3 py-2.5 pl-9 bg-white border border-blue-300 rounded-xl text-sm font-mono font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Phone className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
                              </div>
                              <p className="text-[11px] text-blue-800 mt-1.5 leading-snug">
                                Le montant exact de <strong>{totalAmount.toLocaleString('fr-FR')} FCFA</strong> sera débité directement depuis ce compte Wave vers le compte marchand SERFIG 2027.
                              </p>
                              <p className="text-[10px] text-blue-600 mt-1 italic">
                                * API Wave marchande en cours de liaison pour l'encaissement automatique.
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Other payment details */
                          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Moyen alternatif</label>
                                <select
                                  value={paymentMethod}
                                  onChange={e => setPaymentMethod(e.target.value as any)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                                >
                                  <option value="Orange Money">Orange Money ({config.paymentNumbers.orangeMoney})</option>
                                  <option value="MTN MoMo">MTN MoMo ({config.paymentNumbers.mtnMoMo})</option>
                                  <option value="Moov Money">Moov Money ({config.paymentNumbers.moovMoney})</option>
                                  <option value="Espèces sur place">Espèces à l'accueil du séminaire</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">Réf. transaction (si déjà payé)</label>
                                <input
                                  type="text"
                                  placeholder="Ex: OM-49281..."
                                  value={paymentReference}
                                  onChange={e => setPaymentReference(e.target.value)}
                                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ===================================================================== */}
              {/* COMMISSION PARCOURS (4 ÉTAPES GUIDÉES - ORANGE ET BLANC)              */}
              {/* ===================================================================== */}
              {activeTab === 'commission' && (
                <>
                  {/* ÉTAPE 1 : COMMISSION & FONCTION */}
                  {wizardStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 1 : Choix de la Commission & Fonction
                          </h3>
                          <p className="text-xs text-slate-500">
                            Sélectionnez la commission d'organisation que vous souhaitez intégrer.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          1 / 4
                        </span>
                      </div>

                      <div className="p-4 sm:p-5 bg-orange-50/70 border-2 border-orange-200 rounded-2xl space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Commission d'affectation *
                            </label>
                            <select
                              value={commission}
                              onChange={e => setCommission(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="Sécurité & Discipline">Sécurité & Discipline</option>
                              <option value="Restauration & Cantine">Restauration & Cantine</option>
                              <option value="Pédagogie & Encadrement">Pédagogie & Encadrement</option>
                              <option value="Logistique, Dortoirs & Sono">Logistique, Dortoirs & Sono</option>
                              <option value="Santé & Premiers Secours">Santé & Premiers Secours</option>
                              <option value="Communication & Média">Communication & Média</option>
                              <option value="Finances & Accueil">Finances & Accueil</option>
                              <option value="Hygiène & Cadre de vie">Hygiène & Cadre de vie</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Poste / Rôle souhaité *
                            </label>
                            <select
                              value={commissionRole}
                              onChange={e => setCommissionRole(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="Membre actif">Membre actif</option>
                              <option value="Responsable de commission">Responsable de commission</option>
                              <option value="Adjoint au responsable">Adjoint au responsable</option>
                              <option value="Chargé d'équipe">Chargé d'équipe</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                              Expérience antérieure dans l'AEEMCI
                            </label>
                            <select
                              value={commissionExperience}
                              onChange={e => setCommissionExperience(e.target.value)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="Déjà servi dans un précédent séminaire SERFIG">Déjà servi dans un précédent séminaire SERFIG</option>
                              <option value="Ancien séminaire SEFIHA / SNF / Autre région">Ancien séminaire SEFIHA / SNF / Autre région</option>
                              <option value="Membre de bureau de sous-comité / section">Membre de bureau de sous-comité / section</option>
                              <option value="Première participation en commission d'organisation">Première participation en commission d'organisation</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : IDENTITÉ & CONTACT */}
                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 2 : Identité & Photo du Membre
                          </h3>
                          <p className="text-xs text-slate-500">
                            Vos coordonnées pour la fiche de commission et le badge officiel.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          2 / 4
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nom & Prénoms complets *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: OUATTARA Yacouba"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Genre *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setGender('homme')}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                                gender === 'homme'
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              🧔 Frère
                            </button>
                            <button
                              type="button"
                              onClick={() => setGender('femme')}
                              className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                                gender === 'femme'
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              🧕 Sœur
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Sous-Comité d'origine *
                          </label>
                          <select
                            value={subCommittee}
                            onChange={e => setSubCommittee(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {config.subCommittees.map(sc => (
                              <option key={sc.id} value={sc.name}>
                                {sc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Numéro Téléphone (Appels) *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: 07 48 11 22 33"
                            value={phone}
                            onChange={e => handlePhoneChange(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Numéro WhatsApp
                          </label>
                          <input
                            type="tel"
                            placeholder="Ex: 07 48 11 22 33"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        {/* Photo */}
                        <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 bg-white border-2 border-orange-500 rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                              {photoUrl ? (
                                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Photo d'Identité pour le Badge</p>
                              <p className="text-[11px] text-slate-500">Pour le badge officiel de commission.</p>
                            </div>
                          </div>

                          <label className="px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{photoUrl ? 'Changer' : 'Ajouter Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPhotoUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : TENUE DE COMMISSION (POLO OU T-SHIRT) */}
                  {wizardStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 3 : Tenue Officielle du Membre de Commission
                          </h3>
                          <p className="text-xs text-slate-500">
                            Choisissez votre tenue officielle : Polo brodé officiel (2 500 FCFA) ou Tee-shirt simple (2 000 FCFA).
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          3 / 4
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setClothingChoice('aucun')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'aucun'
                              ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">🚫</span>
                            <span className="block text-sm font-bold">Sans tenue</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'aucun' ? 'text-slate-300' : 'text-slate-500'}`}>
                              Participation commission
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block">+0 FCFA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setClothingChoice('polo')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'polo'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">👕</span>
                            <span className="block text-sm font-bold">Polo Brodé Officiel</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'polo' ? 'text-orange-100' : 'text-slate-500'}`}>
                              Recommandé pour visibilité
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block text-orange-200">
                            2 500 FCFA
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setClothingChoice('tshirt')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                            clothingChoice === 'tshirt'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <span className="text-xl mb-1 block">👕</span>
                            <span className="block text-sm font-bold">Tee-shirt Simple</span>
                            <span className={`text-xs block mt-0.5 ${clothingChoice === 'tshirt' ? 'text-orange-100' : 'text-slate-500'}`}>
                              100% Coton sérigraphié
                            </span>
                          </div>
                          <span className="text-sm font-black mt-3 block text-orange-200">
                            2 000 FCFA
                          </span>
                        </button>
                      </div>

                      {clothingChoice !== 'aucun' && (
                        <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-3 animate-in fade-in">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Taille
                              </label>
                              <select
                                value={poloSize}
                                onChange={e => setPoloSize(e.target.value as any)}
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="S">Taille S</option>
                                <option value="M">Taille M</option>
                                <option value="L">Taille L (Standard)</option>
                                <option value="XL">Taille XL</option>
                                <option value="2XL">Taille 2XL</option>
                                <option value="3XL">Taille 3XL</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Couleur
                              </label>
                              <select
                                value={poloColor}
                                onChange={e => setPoloColor(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="Vert Forêt">Vert Forêt AEEMCI</option>
                                <option value="Blanc Col Vert">Blanc Cérémonie</option>
                                <option value="Noir">Noir Prestige</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ÉTAPE 4 : DÉBIT WAVE DIRECT POUR COMMISSION */}
                  {wizardStep === 4 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 4 : Débit Direct Wave (Commission)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Le montant total sera directement débité sur votre compte Wave.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          4 / 4
                        </span>
                      </div>

                      {/* Financials */}
                      <div className="p-4 bg-orange-50/70 rounded-2xl border-2 border-orange-200 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Frais de participation Commission :</span>
                          <span className="font-bold text-slate-800">2 000 FCFA</span>
                        </div>

                        {clothingChoice !== 'aucun' && (
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>{clothingChoice === 'polo' ? 'Polo Brodé' : 'Tee-shirt Simple'} :</span>
                            <span className="font-bold text-orange-600">+{clothingFee.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm sm:text-base font-black text-orange-950 pt-2 border-t border-orange-200">
                          <span>Total à prélever sur votre compte Wave :</span>
                          <span className="text-lg text-orange-600 font-mono font-black">
                            {totalAmount.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      </div>

                      {/* Wave Input Box */}
                      <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                            <span className="text-base">🌊</span>
                            <span>Débit direct sur votre compte Wave</span>
                          </span>
                          <span className="text-[10px] font-black bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">
                            Direct Wave
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Numéro de compte Wave à débiter *
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required
                              placeholder="Ex: 07 48 11 22 33"
                              value={wavePhoneNumber || phone}
                              onChange={e => setWavePhoneNumber(e.target.value)}
                              className="w-full px-3 py-2.5 pl-9 bg-white border border-blue-300 rounded-xl text-sm font-mono font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Phone className="w-4 h-4 text-blue-500 absolute left-3 top-3" />
                          </div>
                          <p className="text-[11px] text-blue-800 mt-1.5 leading-snug">
                            Le montant total de <strong>{totalAmount.toLocaleString('fr-FR')} FCFA</strong> sera prélevé de votre compte Wave vers le compte marchand SERFIG 2027.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ===================================================================== */}
              {/* FORMATEUR / AÎNÉ PARCOURS (3 ÉTAPES - ORANGE ET BLANC)               */}
              {/* ===================================================================== */}
              {activeTab === 'formateur' && (
                <>
                  {/* ÉTAPE 1 : STATUT (FORMATEUR OU AÎNÉ) & DOMAINE */}
                  {wizardStep === 1 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 1 : Type d'Intervention & Domaine
                          </h3>
                          <p className="text-xs text-slate-500">
                            Choisissez si vous intervenez en qualité de Formateur ou d'Aîné de l'AEEMCI.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          1 / 3
                        </span>
                      </div>

                      {/* 2 Roles Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTrainerSubtype('formateur')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                            trainerSubtype === 'formateur'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-2xl">🎓</span>
                          <div>
                            <span className="block text-sm font-black">Formateur Officiel</span>
                            <span className={`text-[11px] block mt-0.5 leading-snug ${trainerSubtype === 'formateur' ? 'text-orange-100' : 'text-slate-500'}`}>
                              Dispensation de cours de Fiqh, Hadith, Dogme, Ateliers pratiques.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTrainerSubtype('aine')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                            trainerSubtype === 'aine'
                              ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
                              : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-2xl">🤝</span>
                          <div>
                            <span className="block text-sm font-black">Aîné de l'AEEMCI</span>
                            <span className={`text-[11px] block mt-0.5 leading-snug ${trainerSubtype === 'aine' ? 'text-orange-100' : 'text-slate-500'}`}>
                              Conseil des sages, parrainage, encadrement moral et orientation.
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          {trainerSubtype === 'aine' 
                            ? 'Domaine de conseil ou thème d\'intervention *' 
                            : 'Matière ou Thème du cours à dispenser *'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={
                            trainerSubtype === 'aine'
                              ? "Ex: Orientation académique, Insertion professionnelle, Éthique musulmane"
                              : "Ex: Fiqh de la prière et purification, Sciences du Hadith, Tajweed"
                          }
                          value={teachingSubject}
                          onChange={e => setTeachingSubject(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Titre & Disponibilité */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Titre / Fonction *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Oustaz, Imam, Cadre, Enseignant..."
                            value={trainerTitle}
                            onChange={e => setTrainerTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Disponibilité durant la semaine *
                          </label>
                          <select
                            value={trainerAvailability}
                            onChange={e => setTrainerAvailability(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Toute la semaine (12 au 18 avril 2027)">Toute la semaine (12 au 18 avril 2027)</option>
                            <option value="Début de séminaire (Lundi - Mercredi)">Début de séminaire (Lundi - Mercredi)</option>
                            <option value="Milieu de séminaire (Mercredi - Vendredi)">Milieu de séminaire (Mercredi - Vendredi)</option>
                            <option value="Week-end de clôture (Vendredi - Dimanche)">Week-end de clôture (Vendredi - Dimanche)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 2 : COORDONNÉES & PRÉSENTATION */}
                  {wizardStep === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 2 : Identité & Hébergement
                          </h3>
                          <p className="text-xs text-slate-500">
                            Vos coordonnées pour la logistique d'accueil et votre badge officiel.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          2 / 3
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Nom & Prénoms complets *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Oustaz DIABY Mamadou"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Numéro Téléphone (Appels) *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: 07 48 11 22 33"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Numéro WhatsApp
                          </label>
                          <input
                            type="tel"
                            placeholder="Ex: 07 48 11 22 33"
                            value={whatsapp}
                            onChange={e => setWhatsapp(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Hébergement sur place à Gagnoa
                          </label>
                          <select
                            value={trainerAccommodation}
                            onChange={e => setTrainerAccommodation(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="Dortoir Formateurs / Aînés pris en charge">Dortoir Formateurs / Aînés pris en charge par l'AEEMCI</option>
                            <option value="Hébergement personnel autonome à Gagnoa">Hébergement personnel autonome à Gagnoa</option>
                          </select>
                        </div>

                        {/* Photo */}
                        <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-14 bg-white border-2 border-orange-500 rounded-md overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                              {photoUrl ? (
                                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">Photo d'Identité pour le Badge Officiel</p>
                              <p className="text-[11px] text-slate-500">Pour le badge {trainerSubtype === 'aine' ? 'Aîné' : 'Formateur'}.</p>
                            </div>
                          </div>

                          <label className="px-3.5 py-2 bg-orange-100 hover:bg-orange-200 text-orange-950 border border-orange-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{photoUrl ? 'Changer' : 'Ajouter Photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setPhotoUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ÉTAPE 3 : PRISE EN CHARGE & CONFIRMATION */}
                  {wizardStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Étape 3 : Prise en Charge Intégrale
                          </h3>
                          <p className="text-xs text-slate-500">
                            Hébergement, restauration et accès pédagogique 100% offerts par l'AEEMCI Région du Gôh.
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-orange-100 text-orange-900 text-[11px] font-black rounded-lg">
                          3 / 3
                        </span>
                      </div>

                      <div className="p-5 bg-orange-50/80 rounded-2xl border-2 border-orange-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black uppercase text-orange-950 block">
                              Participation {trainerSubtype === 'aine' ? 'Aîné de l\'AEEMCI' : 'Formateur Officiel'}
                            </span>
                            <span className="text-xs text-orange-700">
                              Prise en charge intégrale par le Secrétariat Régional du Gôh.
                            </span>
                          </div>
                          <span className="px-4 py-1.5 rounded-xl bg-orange-600 text-white font-black text-sm shadow-sm">
                            0 FCFA • OFFERT
                          </span>
                        </div>

                        <div className="pt-3 border-t border-orange-200 text-xs text-slate-600 space-y-1.5">
                          <p>✅ Accès prioritaire au réfectoire et aux espaces dédiés</p>
                          <p>✅ Hébergement formateurs / aînés pris en charge</p>
                          <p>✅ Badge officiel plastifié et fiche d'inscription générés immédiatement</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ===================================================================== */}
              {/* STEPPER NAVIGATION BUTTONS (BACK / NEXT / SUBMIT - ORANGE & BLANC)    */}
              {/* ===================================================================== */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                )}

                {wizardStep < getTotalSteps() ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-orange-600 hover:bg-orange-500 shadow-md shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Continuer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit()}
                    disabled={isSubmitting}
                    className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
                      paymentMethod === 'Wave' && activeTab !== 'formateur'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Enregistrement en cours...</span>
                    ) : activeTab === 'formateur' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Valider l'Inscription ({trainerSubtype === 'aine' ? 'Aîné' : 'Formateur'})</span>
                      </>
                    ) : paymentMethod === 'Wave' ? (
                      <>
                        <span className="text-base">🌊</span>
                        <span>Valider et Débiter {totalAmount.toLocaleString('fr-FR')} FCFA sur Wave</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmer mon Inscription ({totalAmount.toLocaleString('fr-FR')} FCFA)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE WAVE DIRECT DEBIT MODAL OVERLAY                               */}
      {/* ========================================================================= */}
      {showWaveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border-2 border-blue-200 relative animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setShowWaveModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Wave Mascot */}
            <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30 mb-3">
              🐧
            </div>

            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              Paiement Wave Côte d'Ivoire
            </div>

            <h3 className="text-lg font-black text-slate-900 leading-tight">
              Débit Direct sur Compte Wave
            </h3>

            <p className="text-xs text-slate-600 mt-1">
              Règlement officiel SERFIG 2027 • Compte Marchand AEEMCI Gôh
            </p>

            {/* Amount Box */}
            <div className="my-4 p-4 bg-blue-50/90 rounded-2xl border border-blue-200">
              <span className="text-xs text-slate-600 block">Montant prélevé :</span>
              <span className="text-3xl font-black text-blue-700 font-mono tracking-tight block my-0.5">
                {totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-xs font-bold text-slate-700 block mt-1">
                Compte débité : <span className="font-mono text-blue-900 font-black">{wavePhoneNumber || phone}</span>
              </span>
            </div>

            {waveProcessingState === 'waiting' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Une notification de débit Wave a été préparée pour le compte <strong className="text-blue-900">{wavePhoneNumber || phone}</strong>. Confirmez pour débiter instantanément le compte marchand.
                </p>

                <button
                  type="button"
                  onClick={handleConfirmWaveDebit}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer le Débit Wave ({totalAmount.toLocaleString('fr-FR')} FCFA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWaveModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Modifier le numéro Wave
                </button>
              </div>
            )}

            {waveProcessingState === 'success' && (
              <div className="py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-base font-black text-emerald-800">
                  Débit Effectué avec Succès !
                </h4>
                <p className="text-xs text-slate-600">
                  Génération du reçu officiel A4 et du badge plastifié...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
