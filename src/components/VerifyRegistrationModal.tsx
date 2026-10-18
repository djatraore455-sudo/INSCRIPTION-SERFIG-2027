import React, { useState } from 'react';
import { Participant, SeminarConfig } from '../types';
import { getParticipants, updateParticipantStatus } from '../services/storage';
import { BadgeCard } from './BadgeCard';
import { Search, X, CheckCircle, Clock, AlertTriangle, CreditCard } from 'lucide-react';

interface VerifyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
}

export const VerifyRegistrationModal: React.FC<VerifyRegistrationModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundParticipant, setFoundParticipant] = useState<Participant | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [isUpdatingRef, setIsUpdatingRef] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const participants = getParticipants();
    const clean = searchQuery.trim().toLowerCase().replace(/[\s\-\+]/g, '');

    const found = participants.find(p => 
      p.matricule.toLowerCase() === searchQuery.trim().toLowerCase() ||
      p.phone.replace(/[\s\-\+]/g, '').includes(clean) ||
      p.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    setFoundParticipant(found || null);
    setSearched(true);
    setMessage('');
  };

  const handleUpdatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundParticipant || !transactionRef.trim()) return;

    setIsUpdatingRef(true);
    const updated = updateParticipantStatus(foundParticipant.id, {
      paymentReference: transactionRef.trim(),
      paymentStatus: 'paye'
    });

    const refreshed = updated.find(p => p.id === foundParticipant.id);
    if (refreshed) {
      setFoundParticipant(refreshed);
      setMessage('Votre référence de paiement a été soumise avec succès !');
    }
    setIsUpdatingRef(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-950 p-4 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300">
              <Search className="w-4 h-4" />
            </span>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-300">
              Consultation & Vérification
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Vérifier mon Inscription & Mon Badge
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1">
            Retrouvez instantanément votre badge de participant et le statut de votre dossier {config.acronym}.
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Entrez votre numéro de téléphone ou matricule..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              Rechercher
            </button>
          </form>

          {/* Results */}
          {searched && (
            <div className="mt-6">
              {foundParticipant ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                    foundParticipant.paymentStatus === 'paye' || foundParticipant.paymentStatus === 'gratuit'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-3">
                      {foundParticipant.paymentStatus === 'paye' || foundParticipant.paymentStatus === 'gratuit' ? (
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm">
                          {foundParticipant.fullName}
                        </p>
                        <p className="text-xs opacity-90">
                          Matricule : <span className="font-mono font-bold">{foundParticipant.matricule}</span> • {foundParticipant.subCommittee}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        foundParticipant.paymentStatus === 'paye' || foundParticipant.paymentStatus === 'gratuit'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {foundParticipant.paymentStatus === 'paye' ? 'Validé' : foundParticipant.paymentStatus === 'gratuit' ? 'Gratuit' : 'Paiement en attente'}
                      </span>
                    </div>
                  </div>

                  {message && (
                    <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg">
                      {message}
                    </div>
                  )}

                  {/* Payment reminder if not yet paid */}
                  {foundParticipant.paymentStatus === 'en_attente' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span>Vous avez déjà effectué le paiement ? Déclarez votre référence :</span>
                      </div>
                      <form onSubmit={handleUpdatePayment} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Ex: Réf. Wave ou Orange Money..."
                          value={transactionRef}
                          onChange={e => setTransactionRef(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <button
                          type="submit"
                          disabled={isUpdatingRef}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Valider le paiement
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Badge Card view */}
                  <div className="pt-2 flex justify-center">
                    <BadgeCard participant={foundParticipant} config={config} showActions={true} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800">Aucune inscription trouvée</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Nous n'avons trouvé aucun dossier correspondant à votre recherche. Vérifiez l'orthographe ou effectuez une nouvelle inscription.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
