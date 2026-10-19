import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Participant, SeminarConfig } from '../types';
import { AeemciLogo } from './AeemciLogo';
import { 
  Printer, 
  Download, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  User, 
  Utensils, 
  BookOpen, 
  Camera, 
  Upload, 
  Check, 
  ExternalLink, 
  Phone, 
  Calendar,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { updateParticipantStatus, calculateAge } from '../services/storage';

interface RegistrationReceiptProps {
  participant: Participant;
  config: SeminarConfig;
  onUpdateParticipant?: (updated: Participant) => void;
  onOpenParticipantSpace?: (participant: Participant) => void;
  showActions?: boolean;
}

export const RegistrationReceipt: React.FC<RegistrationReceiptProps> = ({
  participant: initialParticipant,
  config,
  onUpdateParticipant,
  onOpenParticipantSpace,
  showActions = true
}) => {
  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setParticipant(initialParticipant);
  }, [initialParticipant]);

  useEffect(() => {
    // Generate QR Code containing link to Espace Séminariste / Verification
    const payload = JSON.stringify({
      matricule: participant.matricule,
      nom: participant.fullName,
      statut: participant.type,
      recu: participant.receiptNumber || '—',
      region: config.region,
      action: 'ESPACE_SEMINARISTE_SERFIG2027'
    });

    QRCode.toDataURL(payload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#046c4e',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate QR code for receipt', err));
  }, [participant, config]);

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        const updated = { ...participant, photoUrl };
        setParticipant(updated);
        updateParticipantStatus(participant.id, { photoUrl });
        if (onUpdateParticipant) onUpdateParticipant(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle meal validation
  const toggleMealCheckin = (meal: 'breakfast' | 'lunch' | 'dinner') => {
    const currentMeals = participant.mealAttendance || {
      breakfast: false,
      lunch: false,
      dinner: false
    };
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isNowActive = !currentMeals[meal];
    
    const updatedMeals = {
      ...currentMeals,
      [meal]: isNowActive,
      [`${meal}At`]: isNowActive ? now : undefined,
      lastMealName: isNowActive ? (meal === 'breakfast' ? 'Petit-déjeuner' : meal === 'lunch' ? 'Déjeuner' : 'Dîner') : currentMeals.lastMealName,
      lastMealAt: isNowActive ? now : currentMeals.lastMealAt
    };

    const updated = {
      ...participant,
      mealAttendance: updatedMeals
    };
    setParticipant(updated);
    updateParticipantStatus(participant.id, { mealAttendance: updatedMeals });
    if (onUpdateParticipant) onUpdateParticipant(updated);
  };

  // Toggle course attendance
  const toggleCourseAttendance = () => {
    const current = participant.courseAttendance || { validated: false };
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isNowValid = !current.validated;

    const updatedCourse = {
      validated: isNowValid,
      validatedAt: isNowValid ? now : undefined,
      courseTitle: isNowValid ? 'Module Islamique SERFIG 2027' : undefined,
      supervisor: isNowValid ? 'Commission Pédagogique Gôh' : undefined
    };

    const updated = {
      ...participant,
      courseAttendance: updatedCourse
    };
    setParticipant(updated);
    updateParticipantStatus(participant.id, { courseAttendance: updatedCourse });
    if (onUpdateParticipant) onUpdateParticipant(updated);
  };

  // Split name for display
  const nameParts = participant.fullName.trim().split(' ');
  const lastName = nameParts[0].toUpperCase();
  const firstNames = nameParts.slice(1).join(' ').toUpperCase() || lastName;

  // Format date
  const receiptDate = participant.registeredAt 
    ? new Date(participant.registeredAt).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');

  // Specific labels and consignes by participant type
  const getStatusInfo = () => {
    switch (participant.type) {
      case 'formateur': {
        const isAine = participant.trainerSubtype === 'aine';
        return {
          titleHeader: isAine 
            ? 'FICHE D\'INSCRIPTION AÎNÉ DE L\'AEEMCI - REÇU SERFIG 27'
            : 'FICHE D\'INSCRIPTION FORMATEUR - REÇU SERFIG 27',
          statusLabel: isAine ? 'AÎNÉ DE L\'AEEMCI' : 'FORMATEUR',
          matriculeLabel: isAine ? 'MATRICULE AÎNÉ' : 'MATRICULE FORMATEUR',
          identificationTitle: isAine ? 'IDENTIFICATION DE L\'AÎNÉ DE L\'AEEMCI' : 'IDENTIFICATION DU FORMATEUR',
          consignesTitle: isAine 
            ? 'CONSIGNES POUR LES AÎNÉS ET CONSEILLERS DE L\'AEEMCI' 
            : 'CONSIGNES POUR LES FORMATEURS ET ENSEIGNANTS',
          intro: isAine ? 'En tant qu\'Aîné de l\'AEEMCI, vous êtes invité à prévoir :' : 'En tant que Formateur, vous devez prévoir :',
          items: isAine ? [
            'Votre badge et cette fiche d\'enregistrement pour l\'accès aux espaces réservés.',
            'Vos notes de partage d\'expérience, d\'orientation professionnelle et d\'éthique.',
            'Tenue soignée et exemplaire conformément aux valeurs de l\'AEEMCI.',
            'Vos effets personnels de séjour et votre pièce d\'identité officielle.'
          ] : [
            'Vos supports pédagogiques complets (polycopiés, fiches de cours, clés USB, présentations).',
            'Tenue soignée, exemplaire et conforme à la dignité et à la bienséance islamique.',
            'Vos effets personnels de séjour et votre pièce d\'identité officielle.',
            'Votre fiche d\'inscription et ce reçu pour l\'accès prioritaire au réfectoire et aux salles de cours.'
          ],
          responsibilitiesTitle: isAine ? 'Rôle consultatif & parrainage :' : 'Responsabilités pédagogiques :',
          responsibilities: isAine ? [
            'Partage d\'expérience et écoute active de la jeune génération d\'élèves et étudiants.',
            'Conseils stratégiques auprès du bureau régional et de la commission d\'organisation.',
            'Animation de panels d\'orientation académique, professionnelle et d\'entrepreneuriat.',
            'Transmission vivante de la devise de l\'AEEMCI : Science - Foi - Action.'
          ] : [
            'Respect scrupuleux des horaires d\'ouverture et de clôture de chaque module d\'enseignement.',
            'Émargement des feuilles de présence des séminaristes à chaque début de séance.',
            'Disponibilité pour les séances d\'orientation doctrinale et les questions-réponses des séminaristes.',
            'Veiller à la bonne compréhension et à la transmission fidèle des valeurs de l\'Islam du juste milieu.'
          ],
          contacts: [
            { label: 'Coordination Pédagogique SERFIG', phone: config.contacts.primaryPhone },
            { label: 'Logistique & Accueil Enseignants', phone: config.contacts.secondaryPhone },
            { label: 'Urgences & Assistance', phone: '+225 01 02 03 04 05' }
          ]
        };
      }

      case 'commission':
        return {
          titleHeader: 'FICHE D\'INSCRIPTION COMMISSION - RECU SERFIG 27',
          statusLabel: 'MEMBRE DE COMMISSION',
          matriculeLabel: 'MATRICULE COMMISSION',
          identificationTitle: `IDENTIFICATION DU MEMBRE DE COMMISSION (${(participant.commission || 'ORGANISATION').toUpperCase()})`,
          consignesTitle: 'CONSIGNES POUR LES MEMBRES DES COMMISSIONS',
          intro: 'En tant que Membre de la Commission d\'organisation, vous devez prévoir :',
          items: [
            'Votre polo ou gilet officiel de commission pour être immédiatement identifiable par les séminaristes.',
            'Votre matériel de travail spécifique (registres, fiches de pointage restaurant, trousse, sifflet, badge).',
            'Votre literie personnelle (drap, couverture, moustiquaire) et nécessaire de toilette.',
            'Vos pièces d\'identité et cette fiche d\'inscription / reçu officiel.'
          ],
          responsibilitiesTitle: 'Responsabilités organisationnelles :',
          responsibilities: [
            'Ponctualité stricte aux réunions de coordination quotidiennes (après la prière de Fadjr et après Isha).',
            'Encadrement bienveillant, écoute active et assistance continue aux plus de 400 séminaristes attendus.',
            'Contrôle rigoureux du passage au restaurant et du bon déroulement des repas aux heures indiquées.',
            'Veiller au maintien permanent de la propreté, de la sécurité et de la discipline sur tout le site.'
          ],
          contacts: [
            { label: 'Secrétariat Régional AEEMCI Gôh', phone: config.contacts.primaryPhone },
            { label: 'Supervision Générale du Séminaire', phone: config.contacts.secondaryPhone },
            { label: 'Permanence Sécurité & Urgences', phone: '+225 01 02 03 04 05' }
          ]
        };

      default: // seminariste
        return {
          titleHeader: 'FICHE D\'INSCRIPTION SEMINARISTE - RECU SERFIG 27',
          statusLabel: 'SÉMINARISTE',
          matriculeLabel: 'MATRICULE SÉMINARISTE',
          identificationTitle: 'IDENTIFICATION DU SÉMINARISTE',
          consignesTitle: 'CONSIGNES POUR LES SÉMINARISTES (TROUSSEAU & DISCIPLINE)',
          intro: 'En tant que Séminariste, vous devez obligatoirement prévoir :',
          items: [
            'Le Saint Coran (arabe avec traduction française), un tapis de prière individuel, bloc-notes et stylos.',
            'Des vêtements décents et conformes à l\'éthique islamique (djellabas, pantalons amples ; hijabs couvrants, abayas).',
            'Votre literie personnelle (drap, couverture légère, moustiquaire imprégnée).',
            'Nécessaire de toilette complet, serviette, sandales d\'eau et petite monnaie pour besoins d\'usage.',
            'Vos documents d\'identité et cette fiche d\'inscription / reçu munie de votre QR code personnel.'
          ],
          responsibilitiesTitle: 'Responsabilités spéciales & Vie en communauté :',
          responsibilities: [
            'Présence obligatoire à toutes les 5 prières collectives à la mosquée du séminaire.',
            'Assiduité stricte à l\'ensemble des cours, conférences et ateliers sans aucun retard.',
            'Port obligatoire et permanent du badge officiel lors de tous les déplacements sur le site.',
            'Présentation obligatoire de cette fiche ou de votre QR code au réfectoire pour valider chaque repas.',
            'Respect strict du couvre-feu et extinction absolue des feux dans les dortoirs à 22h30.'
          ],
          contacts: [
            { label: 'Coordination Régionale AEEMCI Gôh', phone: config.contacts.primaryPhone },
            { label: 'Commission Restauration & Logistique', phone: config.contacts.secondaryPhone },
            { label: 'Commission Santé & Urgences médicales', phone: '+225 01 02 03 04 05' }
          ]
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col items-center w-full">
      {/* Top action buttons (hidden when printing) */}
      {showActions && (
        <div className="w-full max-w-4xl mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping"></span>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Fiche d'Inscription Officielle & Reçu AEEMCI
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Format Officiel A4
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenParticipantSpace && (
              <button
                onClick={() => onOpenParticipantSpace(participant)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Ouvrir Espace Séminariste
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimer la Fiche (A4)
            </button>
          </div>
        </div>
      )}

      {/* Official A4 Registration Receipt Document */}
      <div 
        id={`receipt-${participant.matricule}`}
        className="printable-receipt-sheet w-full max-w-[800px] bg-white text-slate-900 shadow-2xl border border-slate-300 relative rounded-sm font-sans selection:bg-emerald-100 print:shadow-none print:border-none print:w-[210mm] print:max-w-none print:m-0"
        style={{ minHeight: '1050px' }}
      >
        {/* Top Header Banner in deep AEEMCI emerald green */}
        <div className="bg-[#046c4e] text-white px-5 py-3 relative border-b-2 border-emerald-900">
          <div className="flex items-center gap-4">
            {/* AEEMCI Logo in white rounded cutout just like the original */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 bg-white rounded-2xl p-1.5 shadow-md flex items-center justify-center shrink-0 border border-emerald-800">
              <AeemciLogo size="md" src={config.logoUrl} className="w-full h-full object-contain" />
            </div>

            {/* Header Text */}
            <div className="flex-1 text-center pr-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white font-serif">
                AEEMCI
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-emerald-50 tracking-normal mt-0.5">
                Association des Elèves et Etudiants Musulmans de Côte d'Ivoire
              </p>
              <div className="mt-1 inline-block bg-emerald-800/80 px-3 py-0.5 rounded-md border border-emerald-700/80">
                <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-white">
                  {statusInfo.titleHeader}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-banner with SERFIG 2027 visual branding (Watermark banner) */}
        <div className="relative px-6 py-3 bg-gradient-to-r from-emerald-50/60 via-amber-50/40 to-emerald-50/60 border-b border-slate-200 overflow-hidden">
          {/* Background subtle watermark text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <span className="text-6xl font-black tracking-widest text-emerald-950 uppercase select-none">
              {config.acronym} 2027
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-black text-xs shadow-xs border border-emerald-700 shrink-0">
                SERFIG
              </div>
              <div>
                <span className="text-base sm:text-lg font-black tracking-wider text-emerald-950 uppercase block font-serif">
                  {config.editionName} • RÉGION DU GÔH
                </span>
                <span className="text-[10px] text-slate-600 block">
                  {config.fullTitle} — Lycée Moderne 1 & 2 de {config.location.city}
                </span>
              </div>
            </div>

            {/* Note about official logo */}
            <div className="text-[9px] font-medium text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-md text-center">
              <span>{config.displayDates}</span>
              <span className="block text-[8px] text-emerald-700 font-semibold italic mt-0.5">
                Logo officiel SERFIG en intégration
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Number & Date bar */}
        <div className="px-6 py-2.5 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-normal">REÇU N° :</span>
            <span className="font-mono font-black text-emerald-900 text-sm">
              {participant.receiptNumber || '—'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-normal">Date :</span>
            <span className="font-bold text-slate-900">
              {receiptDate}
            </span>
          </div>
        </div>

        {/* Matricule Banner (Large centered bold as shown in the scan) */}
        <div className="py-2.5 px-4 text-center bg-white">
          <h2 className="text-lg sm:text-xl font-black text-slate-950 tracking-wider font-mono">
            {statusInfo.matriculeLabel} : <span className="text-emerald-900">{participant.matricule}</span>
          </h2>
        </div>

        {/* Green Divider Line */}
        <div className="h-1 bg-[#046c4e] w-full"></div>

        {/* Main Body */}
        <div className="p-5 sm:p-7 space-y-5 text-slate-800 text-xs sm:text-[13px]">
          
          {/* SECTION 1: IDENTIFICATION DU PARTICIPANT */}
          <div>
            <h3 className="font-black text-sm uppercase text-slate-950 tracking-wide pb-1.5 border-b border-slate-300 mb-3 flex items-center justify-between">
              <span>{statusInfo.identificationTitle}</span>
              <span className="text-[10px] font-bold text-emerald-800 lowercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {participant.subCommittee}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* Left & Middle Column: Detailed attributes */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Nom :</span>
                  <span className="font-extrabold text-slate-950 uppercase">{lastName}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Ville / Sous-Comité :</span>
                  <span className="font-extrabold text-slate-950 uppercase">{participant.subCommittee.replace('Sous-Comité ', '')}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Prénom(s) :</span>
                  <span className="font-extrabold text-slate-950 uppercase">{firstNames}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Niveau d'étude :</span>
                  <span className="font-bold text-slate-900">{participant.schoolLevel || '—'}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Sexe :</span>
                  <span className="font-bold text-slate-900">{participant.gender === 'homme' ? 'Masculin' : 'Féminin'}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Taille Polo / T-shirt :</span>
                  <span className="font-bold text-slate-900">
                    {participant.hasPolo 
                      ? `${participant.clothingType === 'tshirt' ? 'T-shirt' : 'Polo'} ${participant.poloSize || 'L'}`
                      : 'Non commandé'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Contact :</span>
                  <span className="font-bold text-slate-900 font-mono">{participant.phone}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Dortoir :</span>
                  <span className="font-bold text-emerald-900">
                    {participant.dormitory || '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Âge :</span>
                  <span className="font-bold text-slate-900">
                    {calculateAge(participant.birthDate) !== null ? `${calculateAge(participant.birthDate)} ans` : '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Contact Parent / Tuteur :</span>
                  <span className="font-bold text-slate-900 font-mono">{participant.parentContact || '—'}</span>
                </div>

                {/* Specific field for Formateur */}
                {participant.type === 'formateur' && participant.teachingSubject && (
                  <div className="sm:col-span-2 flex items-baseline justify-between border-b border-slate-100 pb-1 bg-blue-50/50 px-2 rounded">
                    <span className="text-blue-900 font-medium text-xs">Module enseigné :</span>
                    <span className="font-bold text-blue-950">{participant.teachingSubject}</span>
                  </div>
                )}

                {/* Specific field for Commission */}
                {participant.type === 'commission' && (
                  <div className="sm:col-span-2 flex items-baseline justify-between border-b border-slate-100 pb-1 bg-amber-50/50 px-2 rounded">
                    <span className="text-amber-900 font-medium text-xs">Commission assignée :</span>
                    <span className="font-bold text-amber-950">{participant.commission || 'Organisation'} ({participant.commissionRole || 'Membre actif'})</span>
                  </div>
                )}
              </div>

              {/* Right Column: Participant Photo with watermarked security frame */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div className="relative group">
                  {/* Decorative stamped border just like the user's scan */}
                  <div className="w-28 h-36 sm:w-32 sm:h-40 bg-slate-100 border-2 border-emerald-700 rounded-sm shadow-md overflow-hidden relative flex flex-col items-center justify-center">
                    {participant.photoUrl ? (
                      <img 
                        src={participant.photoUrl} 
                        alt={participant.fullName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                        <User className="w-12 h-12 text-slate-400 mb-1" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Photo d'Identité</span>
                      </div>
                    )}

                    {/* Watermark security frame stamp on photo edges */}
                    <div className="absolute inset-0 pointer-events-none border border-emerald-600/30 flex flex-col justify-between p-0.5 text-[6px] font-mono text-emerald-800/40 select-none">
                      <div className="flex justify-between">
                        <span>SERFIG 27</span>
                        <span>AEEMCI GÔH</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GÔH 2027</span>
                        <span>OFFICIEL</span>
                      </div>
                    </div>

                    {/* Upload button hover overlay (hidden in print) */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="no-print absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-bold transition-opacity cursor-pointer p-1"
                      title="Changer la photo d'identité"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span>Changer Photo</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 text-center block mt-1 font-semibold">
                    Photo Séminariste
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: TRANSPORT ET PAIEMENT & QR CODE D'ACCÈS */}
          <div className="pt-2 border-t border-slate-200">
            <h3 className="font-black text-sm uppercase text-slate-950 tracking-wide pb-1.5 border-b border-slate-300 mb-3">
              TRANSPORT ET PAIEMENT
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Payment Details */}
              <div className="md:col-span-8 space-y-2">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Mode transport :</span>
                  <span className="font-bold text-slate-900">
                    {participant.transportMode || '—'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-600 font-medium text-xs">Montant de la participation :</span>
                  <span className="font-bold text-slate-900">
                    {participant.registrationFee} FCFA
                  </span>
                </div>

                {participant.hasPolo && (
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600 font-medium text-xs">Montant Vêtement ({participant.clothingType === 'tshirt' ? 'Tee-shirt' : 'Polo'}) :</span>
                    <span className="font-bold text-slate-900">
                      {participant.clothingFee || (participant.clothingType === 'tshirt' ? config.tshirtPrice : config.poloPrice)} FCFA
                    </span>
                  </div>
                )}

                <div className="flex items-baseline justify-between border-b border-slate-200 pb-1 bg-emerald-50/60 px-2 py-1 rounded">
                  <span className="text-emerald-950 font-bold text-xs">Montant total payé :</span>
                  <span className="font-black text-emerald-900 text-base">
                    {participant.totalFee} FCFA
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Statut du règlement :</span>
                  {participant.paymentStatus === 'paye' || participant.paymentStatus === 'gratuit' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                      Paiement Validé ({participant.paymentMethod || 'Wave / OM'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded border border-orange-300">
                      <Clock className="w-3.5 h-3.5 text-orange-600" />
                      En attente de paiement sur place
                    </span>
                  )}
                </div>
              </div>

              {/* QR Code Column */}
              <div className="md:col-span-4 flex flex-col items-center justify-center">
                <div 
                  onClick={() => onOpenParticipantSpace && onOpenParticipantSpace(participant)}
                  className="bg-white p-2 rounded-xl border-2 border-dashed border-emerald-600 shadow-sm flex flex-col items-center cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                  title="Scanner ou cliquer pour ouvrir l'Espace Séminariste"
                >
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code Espace Séminariste" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 animate-pulse rounded"></div>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-emerald-900 uppercase mt-1 tracking-tight text-center">
                    QR Espace Séminariste
                  </span>
                  <span className="text-[8px] text-slate-500 text-center block">
                    (Vérification & Émargement)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: VALIDATION EN DIRECT : PRÉSENCE AU COURS & PASSAGE RESTAURANT */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-300 mb-2">
              <h3 className="font-black text-sm uppercase text-slate-950 tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>VALIDATION DU SÉMINAIRE : PRÉSENCE AUX COURS & RESTAURATION</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Émargement Quotidien
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Validation Présence au cours */}
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      Présence aux Cours Islamiques
                    </span>
                    {participant.courseAttendance?.validated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-200/90 px-2 py-0.5 rounded border border-emerald-400">
                        <Check className="w-3 h-3 text-emerald-800" />
                        VALIDÉE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                        En attente d'émargement
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-600 mt-1">
                    {participant.courseAttendance?.validated
                      ? `Présence confirmée à ${participant.courseAttendance.validatedAt || '08:30'} par ${participant.courseAttendance.supervisor || 'Commission Pédagogique'}.`
                      : 'Présentation requise auprès du formateur à chaque séance pour validation.'}
                  </p>
                </div>

                {/* Validation button for supervisor/demo (hidden in print) */}
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between no-print">
                  <span className="text-[9px] text-emerald-800 font-semibold">Pointage superviseur :</span>
                  <button
                    onClick={toggleCourseAttendance}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      participant.courseAttendance?.validated
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-white border border-emerald-600 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {participant.courseAttendance?.validated ? '✓ Présence Validée (Cliquer pour annuler)' : 'Valider la Présence au Cours'}
                  </button>
                </div>
              </div>

              {/* Confirmation Passage au Restaurant à l'heure du repas */}
              <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950 flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5 text-amber-700" />
                      Passage au Restaurant / Réfectoire
                    </span>
                    {(participant.mealAttendance?.breakfast || participant.mealAttendance?.lunch || participant.mealAttendance?.dinner) ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-400">
                        <Check className="w-3 h-3 text-amber-800" />
                        REPAS EN COURS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                        En attente
                      </span>
                    )}
                  </div>

                  {/* 3 Meals Tracker */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2 text-center text-[10px]">
                    {/* Breakfast */}
                    <div 
                      onClick={() => toggleMealCheckin('breakfast')}
                      className={`p-1.5 rounded border cursor-pointer transition-all ${
                        participant.mealAttendance?.breakfast 
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300'
                      }`}
                      title="Cliquer pour valider ou annuler le petit-déjeuner"
                    >
                      <span className="block text-[8px] font-bold uppercase text-slate-600">P.Déjeuner</span>
                      <span>{participant.mealAttendance?.breakfast ? `✓ ${participant.mealAttendance.breakfastAt || '07:30'}` : 'Non passé'}</span>
                    </div>

                    {/* Lunch */}
                    <div 
                      onClick={() => toggleMealCheckin('lunch')}
                      className={`p-1.5 rounded border cursor-pointer transition-all ${
                        participant.mealAttendance?.lunch 
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300'
                      }`}
                      title="Cliquer pour valider ou annuler le déjeuner"
                    >
                      <span className="block text-[8px] font-bold uppercase text-slate-600">Déjeuner</span>
                      <span>{participant.mealAttendance?.lunch ? `✓ ${participant.mealAttendance.lunchAt || '13:00'}` : 'Non passé'}</span>
                    </div>

                    {/* Dinner */}
                    <div 
                      onClick={() => toggleMealCheckin('dinner')}
                      className={`p-1.5 rounded border cursor-pointer transition-all ${
                        participant.mealAttendance?.dinner 
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300'
                      }`}
                      title="Cliquer pour valider ou annuler le dîner"
                    >
                      <span className="block text-[8px] font-bold uppercase text-slate-600">Dîner</span>
                      <span>{participant.mealAttendance?.dinner ? `✓ ${participant.mealAttendance.dinnerAt || '20:30'}` : 'Non passé'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-amber-900 mt-2 font-medium">
                  {participant.mealAttendance?.lastMealName
                    ? `Dernier repas validé : ${participant.mealAttendance.lastMealName} à ${participant.mealAttendance.lastMealAt}.`
                    : 'Présentation de ce reçu avec QR code obligatoire à l\'entrée du réfectoire.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4: CONSIGNES SELON LE STATUT (Sur fond crème/jaune pâle comme la photo) */}
          <div className="bg-[#fffde7] border border-[#fef08a] rounded-xl p-4 sm:p-5 shadow-2xs">
            <h3 className="font-black text-xs sm:text-sm uppercase text-[#854d0e] tracking-wide mb-2.5 pb-1 border-b border-[#fef08a]">
              {statusInfo.consignesTitle}
            </h3>

            {/* Introduction */}
            <p className="font-bold text-slate-900 text-xs mb-2">
              {statusInfo.intro}
            </p>

            {/* Items list */}
            <ul className="space-y-1.5 text-xs text-slate-700 mb-3 pl-1">
              {statusInfo.items.map((it, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold mt-0.5">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>

            {/* Responsibilities list */}
            <p className="font-bold text-slate-900 text-xs mb-1.5 pt-2 border-t border-[#fef08a]/80">
              {statusInfo.responsibilitiesTitle}
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 mb-3 pl-1">
              {statusInfo.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-700 font-bold mt-0.5">•</span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>

            {/* Emergency Contacts */}
            <p className="font-bold text-slate-900 text-xs mb-1.5 pt-2 border-t border-[#fef08a]/80">
              Contacts d'urgence {config.editionName} :
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
              {statusInfo.contacts.map((c, idx) => (
                <div key={idx} className="bg-white/80 p-1.5 rounded border border-[#fef08a] flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{c.label}</span>
                  <span className="font-bold text-emerald-950 font-mono text-xs">{c.phone}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Official Footer Banner in deep AEEMCI green (Matching exactly the photo provided) */}
        <div className="mt-4 bg-[#046c4e] text-white px-5 py-3 text-center text-[10px] sm:text-[11px] leading-tight space-y-1">
          <p className="font-medium">
            Siège Social : Mosquée An-Nour de la Riviera II / 08 BP 2462 Abidjan 08
          </p>
          <p className="font-bold tracking-wide">
            27 33 75 42 12 / 07 09 99 55 31 / 05 44 54 34 89 / aeemci@yahoo.fr / www.aeemci.ci
          </p>
          <div className="pt-1 border-t border-emerald-800">
            <p className="font-black tracking-widest uppercase text-emerald-100 text-xs font-serif">
              AEEMCI, pour une identité islamique !
            </p>
          </div>
        </div>
      </div>

      {/* Floating or secondary print trigger */}
      {showActions && (
        <div className="mt-4 text-center no-print">
          <p className="text-xs text-slate-500">
            Conseil d'impression : activez l'option "Graphismes d'arrière-plan" dans vos paramètres d'impression pour conserver les couleurs officielles.
          </p>
        </div>
      )}
    </div>
  );
};
