import React, { useState } from 'react';
import { Participant, SeminarConfig } from '../types';
import { RegistrationReceipt } from './RegistrationReceipt';
import { BadgeCard } from './BadgeCard';
import { AeemciLogo } from './AeemciLogo';
import { 
  X, 
  FileText, 
  IdCard, 
  BookOpen, 
  Utensils, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  Check, 
  ShieldCheck, 
  User, 
  Printer, 
  Share2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { updateParticipantStatus } from '../services/storage';

interface ParticipantSpaceModalProps {
  participant: Participant;
  config: SeminarConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateParticipant?: (updated: Participant) => void;
}

export const ParticipantSpaceModal: React.FC<ParticipantSpaceModalProps> = ({
  participant: initialParticipant,
  config,
  isOpen,
  onClose,
  onUpdateParticipant
}) => {
  const [participant, setParticipant] = useState<Participant>(initialParticipant);
  const [activeTab, setActiveTab] = useState<'receipt' | 'badge' | 'attendance' | 'guide'>('receipt');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleUpdate = (updated: Participant) => {
    setParticipant(updated);
    if (onUpdateParticipant) onUpdateParticipant(updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getStatusBadge = () => {
    switch (participant.type) {
      case 'formateur':
        return <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-full text-xs font-black uppercase">Formateur Officiel</span>;
      case 'commission':
        return <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black uppercase">Commission {(participant.commission || 'Organisation').toUpperCase()}</span>;
      default:
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black uppercase">Séminariste</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[94vh]">
        
        {/* Top Header of the Espace Séminariste Modal */}
        <div className="bg-gradient-to-r from-[#046c4e] via-[#055a40] to-emerald-900 text-white p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar or Photo */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-md border-2 border-emerald-400 overflow-hidden flex items-center justify-center shrink-0">
                {participant.photoUrl ? (
                  <img src={participant.photoUrl} alt={participant.fullName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User className="w-10 h-10 text-emerald-800" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px]">
                ✓
              </span>
            </div>

            {/* Title & Info */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                {getStatusBadge()}
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 text-xs font-mono font-bold">
                  {participant.matricule}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 text-xs font-bold">
                  Reçu N° {participant.receiptNumber || '24752'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                {participant.fullName}
              </h2>
              
              <p className="text-xs text-emerald-100 flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  {participant.subCommittee} ({config.region})
                </span>
                <span>•</span>
                <span>Dortoir : {participant.dormitory || 'Attribution auto'}</span>
                <span>•</span>
                <span className="font-semibold text-amber-200">
                  {participant.paymentStatus === 'paye' ? 'Paiement Validé' : 'En attente de paiement'}
                </span>
              </p>
            </div>

            {/* Quick action: Share / Copy link */}
            <div className="hidden sm:flex flex-col items-end gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Lien copié !' : 'Partager mon Espace'}
              </button>
            </div>
          </div>

          {/* Quick status counters (Course attendance & Meal status) */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <span className="text-[10px] text-emerald-200 block">Présence Cours</span>
              <span className="font-black text-white">
                {participant.courseAttendance?.validated ? '✓ Validée' : '⏳ En attente'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <span className="text-[10px] text-emerald-200 block">Passage Restaurant</span>
              <span className="font-black text-white">
                {participant.mealAttendance?.lunch ? '✓ Déjeuner OK' : participant.mealAttendance?.dinner ? '✓ Dîner OK' : '⏳ Non émargé'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <span className="text-[10px] text-emerald-200 block">Polo / T-shirt</span>
              <span className="font-black text-white">
                {participant.hasPolo ? `${participant.clothingType === 'tshirt' ? 'T-shirt' : 'Polo'} ${participant.poloSize || 'L'}` : 'Non pris'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 text-center">
              <span className="text-[10px] text-emerald-200 block">Statut Séminaire</span>
              <span className="font-black text-white">
                Inscrit {config.editionName}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'receipt'
                ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Fiche d'Inscription & Reçu Officiel (A4)</span>
          </button>

          <button
            onClick={() => setActiveTab('badge')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'badge'
                ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <IdCard className="w-4 h-4 text-emerald-700" />
            <span>Badge Plastifié</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'attendance'
                ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Émargement Cours & Restaurant</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 flex flex-col items-center">
          {activeTab === 'receipt' && (
            <div className="w-full flex flex-col items-center">
              <RegistrationReceipt
                participant={participant}
                config={config}
                onUpdateParticipant={handleUpdate}
                showActions={true}
              />
            </div>
          )}

          {activeTab === 'badge' && (
            <div className="w-full flex flex-col items-center py-4">
              <BadgeCard
                participant={participant}
                config={config}
                showActions={true}
              />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="w-full max-w-3xl space-y-6">
              {/* Card 1: Course Attendance */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Validation de la Présence aux Cours Islamiques
                      </h3>
                      <p className="text-xs text-slate-600">
                        Chaque séminariste doit faire émarger sa présence auprès du formateur ou de la commission pédagogique.
                      </p>
                    </div>
                  </div>

                  {participant.courseAttendance?.validated ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-black">
                      ✓ Validée
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black">
                      ⏳ En attente
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Module actuel :</span>
                    <span className="font-bold text-slate-900">Sciences Islamiques & Fiqh — SERFIG 2027</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Statut d'émargement :</span>
                    <span className="font-bold text-emerald-900">
                      {participant.courseAttendance?.validated 
                        ? `Validé le jour même à ${participant.courseAttendance.validatedAt || '08:30'}`
                        : 'Non émargé pour la séance du jour'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      const isNowValid = !participant.courseAttendance?.validated;
                      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      const updated = {
                        ...participant,
                        courseAttendance: {
                          validated: isNowValid,
                          validatedAt: isNowValid ? now : undefined,
                          courseTitle: 'Module Islamique SERFIG 2027',
                          supervisor: 'Commission Pédagogique Gôh'
                        }
                      };
                      handleUpdate(updated);
                      updateParticipantStatus(participant.id, { courseAttendance: updated.courseAttendance });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      participant.courseAttendance?.validated
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {participant.courseAttendance?.validated ? 'Annuler l\'émargement' : 'Valider la présence maintenant'}
                  </button>
                </div>
              </div>

              {/* Card 2: Meal Checkin */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Passage au Restaurant / Réfectoire du Séminaire
                      </h3>
                      <p className="text-xs text-slate-600">
                        Présentez votre reçu ou QR code à l'entrée du restaurant à chaque service de repas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Petit déjeuner */}
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    participant.mealAttendance?.breakfast 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">07h00 - 08h15</span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">Petit-déjeuner</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {participant.mealAttendance?.breakfast ? `Validé à ${participant.mealAttendance.breakfastAt || '07:45'}` : 'Non passé'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const current = participant.mealAttendance || { breakfast: false, lunch: false, dinner: false };
                        const isNowActive = !current.breakfast;
                        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const updatedMeals = { ...current, breakfast: isNowActive, breakfastAt: isNowActive ? now : undefined };
                        const updated = { ...participant, mealAttendance: updatedMeals };
                        handleUpdate(updated);
                        updateParticipantStatus(participant.id, { mealAttendance: updatedMeals });
                      }}
                      className={`mt-3 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        participant.mealAttendance?.breakfast 
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      {participant.mealAttendance?.breakfast ? '✓ Confirmé' : 'Valider Petit-déj'}
                    </button>
                  </div>

                  {/* Déjeuner */}
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    participant.mealAttendance?.lunch 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">12h30 - 14h00</span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">Déjeuner</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {participant.mealAttendance?.lunch ? `Validé à ${participant.mealAttendance.lunchAt || '13:15'}` : 'Non passé'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const current = participant.mealAttendance || { breakfast: false, lunch: false, dinner: false };
                        const isNowActive = !current.lunch;
                        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const updatedMeals = { ...current, lunch: isNowActive, lunchAt: isNowActive ? now : undefined };
                        const updated = { ...participant, mealAttendance: updatedMeals };
                        handleUpdate(updated);
                        updateParticipantStatus(participant.id, { mealAttendance: updatedMeals });
                      }}
                      className={`mt-3 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        participant.mealAttendance?.lunch 
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      {participant.mealAttendance?.lunch ? '✓ Confirmé' : 'Valider Déjeuner'}
                    </button>
                  </div>

                  {/* Dîner */}
                  <div className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    participant.mealAttendance?.dinner 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase block">20h00 - 21h30</span>
                      <h4 className="font-black text-slate-900 text-sm mt-0.5">Dîner</h4>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {participant.mealAttendance?.dinner ? `Validé à ${participant.mealAttendance.dinnerAt || '20:45'}` : 'Non passé'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const current = participant.mealAttendance || { breakfast: false, lunch: false, dinner: false };
                        const isNowActive = !current.dinner;
                        const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        const updatedMeals = { ...current, dinner: isNowActive, dinnerAt: isNowActive ? now : undefined };
                        const updated = { ...participant, mealAttendance: updatedMeals };
                        handleUpdate(updated);
                        updateParticipantStatus(participant.id, { mealAttendance: updatedMeals });
                      }}
                      className={`mt-3 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        participant.mealAttendance?.dinner 
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800' 
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      {participant.mealAttendance?.dinner ? '✓ Confirmé' : 'Valider Dîner'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
