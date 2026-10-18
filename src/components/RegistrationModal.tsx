import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Participant, ParticipantType, SeminarConfig } from '../types';
import { addParticipant } from '../services/storage';
import { BadgeCard } from './BadgeCard';
import { X, Check, CreditCard, Sparkles, AlertCircle, Shirt } from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
  initialType?: ParticipantType;
  onRegistered?: (participant: Participant) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  config,
  initialType = 'seminariste',
  onRegistered
}) => {
  const [activeTab, setActiveTab] = useState<ParticipantType>(initialType);
  const [createdParticipant, setCreatedParticipant] = useState<Participant | null>(null);

  // Common fields
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'homme' | 'femme'>('homme');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [subCommittee, setSubCommittee] = useState(config.subCommittees[0]?.name || 'Sous-Comité Gagnoa Commune');

  // Séminariste fields
  const [schoolLevel, setSchoolLevel] = useState('Lycée');
  const [schoolName, setSchoolName] = useState('');
  const [clothingChoice, setClothingChoice] = useState<'aucun' | 'polo' | 'tshirt'>('polo');
  const [poloSize, setPoloSize] = useState<'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'>('L');
  const [poloColor, setPoloColor] = useState('Vert Forêt');

  // Formateur fields
  const [teachingSubject, setTeachingSubject] = useState('');
  const [trainerBio, setTrainerBio] = useState('');

  // Commission fields
  const [commission, setCommission] = useState('Sécurité & Discipline');
  const [commissionRole, setCommissionRole] = useState('Membre actif');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Espèces sur place'>('Wave');
  const [paymentReference, setPaymentReference] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Calculate pricing
  const currentSubCommittee = config.subCommittees.find(s => s.name === subCommittee) || config.subCommittees[0];
  const registrationFee = activeTab === 'seminariste' 
    ? (currentSubCommittee?.fee || 2000) 
    : activeTab === 'commission' 
      ? config.commissionFee 
      : 0;

  const clothingFee = activeTab === 'seminariste' 
    ? (clothingChoice === 'polo' ? config.poloPrice : clothingChoice === 'tshirt' ? (config.tshirtPrice || 2000) : 0)
    : 0;
  const totalAmount = registrationFee + clothingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !phone.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet et votre numéro de téléphone.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPart = addParticipant({
        type: activeTab,
        fullName: fullName.trim(),
        gender,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim() || undefined,
        subCommittee,
        schoolLevel: activeTab === 'seminariste' ? schoolLevel : undefined,
        schoolName: activeTab === 'seminariste' ? schoolName.trim() : undefined,
        clothingType: activeTab === 'seminariste' ? clothingChoice : undefined,
        hasPolo: activeTab === 'seminariste' && clothingChoice !== 'aucun',
        poloSize: activeTab === 'seminariste' && clothingChoice !== 'aucun' ? poloSize : undefined,
        poloColor: activeTab === 'seminariste' && clothingChoice !== 'aucun' ? poloColor : undefined,
        teachingSubject: activeTab === 'formateur' ? teachingSubject.trim() : undefined,
        trainerBio: activeTab === 'formateur' ? trainerBio.trim() : undefined,
        commission: activeTab === 'commission' ? commission : undefined,
        commissionRole: activeTab === 'commission' ? commissionRole : undefined,
        registrationFee,
        poloFee: clothingFee,
        clothingFee,
        totalFee: totalAmount,
        paymentStatus: activeTab === 'formateur' ? 'gratuit' : (paymentReference ? 'paye' : 'en_attente'),
        paymentMethod: activeTab === 'formateur' ? undefined : paymentMethod,
        paymentReference: paymentReference.trim() || undefined
      }, config);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setCreatedParticipant(newPart);
      if (onRegistered) onRegistered(newPart);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNew = () => {
    setCreatedParticipant(null);
    setFullName('');
    setPhone('');
    setPaymentReference('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-black uppercase tracking-wider">
              {config.editionName}
            </span>
            <span className="text-emerald-200 text-xs font-bold">Région du Gôh • {config.location.city}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1.5 text-white">
            Formulaire d'Enregistrement au Séminaire
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
            {config.fullTitle} • {config.displayDates}
          </p>

          {/* Registration Type Tabs (Only if not already created) */}
          {!createdParticipant && (
            <div className="grid grid-cols-3 gap-2 mt-4 bg-emerald-950/60 p-1.5 rounded-2xl border border-emerald-700/60">
              <button
                type="button"
                onClick={() => setActiveTab('seminariste')}
                className={`py-2 px-2 text-xs font-black rounded-xl transition-all text-center cursor-pointer ${
                  activeTab === 'seminariste'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                🎓 Séminariste
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('formateur')}
                className={`py-2 px-2 text-xs font-black rounded-xl transition-all text-center cursor-pointer ${
                  activeTab === 'formateur'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                📖 Formateur
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('commission')}
                className={`py-2 px-2 text-xs font-black rounded-xl transition-all text-center cursor-pointer ${
                  activeTab === 'commission'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-emerald-100 hover:bg-emerald-800/60'
                }`}
              >
                ⚙️ Commission
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {createdParticipant ? (
            /* Success View with Badge Card */
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mb-3 shadow-inner">
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Al-Hamdoullilah ! Inscription Réussie</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Votre inscription pour <span className="font-semibold text-emerald-800">{createdParticipant.fullName}</span> a été enregistrée avec succès sous le matricule officiel ci-dessous.
              </p>

              <div className="my-6 flex justify-center">
                <BadgeCard participant={createdParticipant} config={config} showActions={true} />
              </div>

              {/* Payment Instructions if pending */}
              {createdParticipant.paymentStatus === 'en_attente' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-300 text-left text-xs sm:text-sm text-amber-900 max-w-md mx-auto">
                  <div className="flex items-center gap-2 font-bold text-amber-800 mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span>Règlement de vos frais ({createdParticipant.totalFee.toLocaleString('fr-FR')} FCFA)</span>
                  </div>
                  <p className="text-amber-800/90 text-xs">
                    Vous pouvez régler dès maintenant par Mobile Money pour valider immédiatement votre badge, ou payer en espèces à l'accueil du séminaire.
                  </p>
                  <div className="mt-2 space-y-1 font-mono text-xs bg-white/70 p-2 rounded border border-amber-200">
                    <div className="flex justify-between">
                      <span>Wave :</span> <span className="font-bold">{config.paymentNumbers.wave}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Orange Money :</span> <span className="font-bold">{config.paymentNumbers.orangeMoney}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MTN MoMo :</span> <span className="font-bold">{config.paymentNumbers.mtnMoMo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bénéficiaire :</span> <span className="font-bold">{config.paymentNumbers.recipientName}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-md"
                >
                  Terminer & Fermer
                </button>
                <button
                  type="button"
                  onClick={handleResetForNew}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  Inscrire un autre frère/sœur
                </button>
              </div>
            </div>
          ) : (
            /* Form view */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Category banner explanation */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                <span className="text-base shrink-0">ℹ️</span>
                <div>
                  {activeTab === 'seminariste' && (
                    <span>
                      <strong>Formule Séminariste :</strong> Hébergement complet, 3 repas/jour, cours islamiques, ateliers, documents pédagogiques et attestation officielle.
                    </span>
                  )}
                  {activeTab === 'formateur' && (
                    <span>
                      <strong>Formule Formateur / Oustaz :</strong> Inscription gratuite, prise en charge hébergement et restauration 100% offerte par le comité d'organisation.
                    </span>
                  )}
                  {activeTab === 'commission' && (
                    <span>
                      <strong>Membre de Commission :</strong> Participation active à l'organisation (restauration, sécurité, logistique, santé). Badge officiel membre inclus.
                    </span>
                  )}
                </div>
              </div>

              {/* Step 1: Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom & Prénoms complets *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Traoré Ibrahim Kalil"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
                          ? 'bg-emerald-800 text-white border-emerald-800'
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
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      🧕 Sœur
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sous-Comité AEEMCI *
                  </label>
                  <select
                    value={subCommittee}
                    onChange={e => setSubCommittee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {config.subCommittees.map(sc => (
                      <option key={sc.id} value={sc.name}>
                        {sc.name} ({sc.fee.toLocaleString('fr-FR')} FCFA)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Numéro de Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 07 48 11 22 33"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Numéro WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 07 48 11 22 33 (ou identique)"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Tab specific fields */}
              {activeTab === 'seminariste' && (
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Cursus Scolaire & Hébergement
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Niveau d'études</label>
                      <select
                        value={schoolLevel}
                        onChange={e => setSchoolLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      >
                        <option value="Collège">Collège (6ème à 3ème)</option>
                        <option value="Lycée">Lycée (2nde à Terminale)</option>
                        <option value="Université / Supérieur">Université / Grande École</option>
                        <option value="Professionnel / Travailleur">Professionnel / Travailleur</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Établissement ou Commune</label>
                      <input
                        type="text"
                        placeholder="Ex: Lycée Moderne 1 Bondoukou"
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Clothing Selection Card */}
                  <div className="mt-3 p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Shirt className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Tenue Officielle du Séminaire (Optionnel)
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Polo officiel brodé (2 500 FCFA) ou Tee-shirt simple (2 000 FCFA)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setClothingChoice('aucun')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          clothingChoice === 'aucun'
                            ? 'bg-slate-800 text-white border-slate-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 text-xs'
                        }`}
                      >
                        <span className="block text-xs font-bold">Aucun</span>
                        <span className="text-[10px] opacity-80">+0 FCFA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClothingChoice('polo')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          clothingChoice === 'polo'
                            ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 text-xs'
                        }`}
                      >
                        <span className="block text-xs font-bold">👕 Polo Brodé</span>
                        <span className="text-[10px] font-semibold text-orange-200">+2 500 FCFA</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setClothingChoice('tshirt')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          clothingChoice === 'tshirt'
                            ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 text-xs'
                        }`}
                      >
                        <span className="block text-xs font-bold">👕 Tee-shirt Simple</span>
                        <span className="text-[10px] font-semibold text-orange-200">+2 000 FCFA</span>
                      </button>
                    </div>

                    {clothingChoice !== 'aucun' && (
                      <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-orange-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Taille</label>
                          <select
                            value={poloSize}
                            onChange={e => setPoloSize(e.target.value as any)}
                            className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-xs font-bold"
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
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Couleur</label>
                          <select
                            value={poloColor}
                            onChange={e => setPoloColor(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-orange-300 rounded-lg text-xs font-bold"
                          >
                            <option value="Vert Forêt">Vert Forêt AEEMCI</option>
                            <option value="Blanc Col Vert">Blanc Cérémonie</option>
                            <option value="Noir">Noir Prestige</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'formateur' && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Matière ou Thème d'intervention *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Sciences du Coran, Fiqh, Leadership, Prise de parole"
                      value={teachingSubject}
                      onChange={e => setTeachingSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Courte biographie ou diplôme
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Diplômé en théologie islamique, Enseignant..."
                      value={trainerBio}
                      onChange={e => setTrainerBio(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'commission' && (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Commission choisie *
                    </label>
                    <select
                      value={commission}
                      onChange={e => setCommission(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                    >
                      <option value="Pédagogie & Encadrement">Pédagogie & Encadrement</option>
                      <option value="Sécurité & Discipline">Sécurité & Discipline</option>
                      <option value="Restauration">Restauration</option>
                      <option value="Santé & Premiers Secours">Santé & Premiers Secours</option>
                      <option value="Logistique & Dortoirs">Logistique & Dortoirs</option>
                      <option value="Communication & Média">Communication & Média</option>
                      <option value="Finances & Accueil">Finances & Accueil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Poste / Rôle souhaité
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Membre actif, Responsable d'équipe..."
                      value={commissionRole}
                      onChange={e => setCommissionRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Price Breakdown & Payment */}
              {activeTab !== 'formateur' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                    <span>Frais de participation :</span>
                    <span className="font-semibold">{registrationFee.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {activeTab === 'seminariste' && clothingChoice !== 'aucun' && (
                    <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                      <span>{clothingChoice === 'polo' ? 'Polo Officiel Brodé' : 'Tee-shirt Simple'} :</span>
                      <span className="font-semibold text-orange-600">+{clothingFee.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-extrabold text-emerald-900 pt-2 border-t border-slate-200">
                    <span>Total à régler :</span>
                    <span className="text-base text-emerald-800">{totalAmount.toLocaleString('fr-FR')} FCFA</span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mode de règlement</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="Wave">Wave ({config.paymentNumbers.wave})</option>
                        <option value="Orange Money">Orange Money ({config.paymentNumbers.orangeMoney})</option>
                        <option value="MTN MoMo">MTN MoMo ({config.paymentNumbers.mtnMoMo})</option>
                        <option value="Moov Money">Moov Money ({config.paymentNumbers.moovMoney})</option>
                        <option value="Espèces sur place">Espèces à l'accueil du séminaire</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ID / Réf. Transaction (si déjà payé)</label>
                      <input
                        type="text"
                        placeholder="Ex: WAVE-83749..."
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-700/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmer mon Inscription</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
