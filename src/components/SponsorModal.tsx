import React, { useState } from 'react';
import { SeminarConfig } from '../types';
import { addDonation } from '../services/storage';
import { X, Heart, Sparkles, CreditCard, Check, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SeminarConfig;
}

export const SponsorModal: React.FC<SponsorModalProps> = ({ isOpen, onClose, config }) => {
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [amount, setAmount] = useState<number>(10000);
  const [purpose, setPurpose] = useState('Parrainage de plusieurs élèves démunis');
  const [paymentMethod, setPaymentMethod] = useState('Wave');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donorPhone.trim() || amount <= 0) return;

    addDonation({
      donorName: donorName.trim(),
      donorPhone: donorPhone.trim(),
      amount,
      purpose,
      paymentMethod
    });

    confetti({ particleCount: 70, spread: 60 });
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-xs uppercase font-extrabold text-amber-300">
              Soutien & Solidarité Islamique
            </span>
          </div>
          <h2 className="text-xl font-black mt-1">
            Parrainer un Séminariste Démuni
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Offrez à un jeune musulman l'opportunité de participer au {config.editionName} ({config.region}).
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Jazakallahu Khayran !</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                Qu'Allah vous récompense infiniment pour votre générosité envers les jeunes apprenants.
              </p>
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-left font-mono">
                <p><strong>Bénéficiaire :</strong> {config.paymentNumbers.recipientName}</p>
                <p><strong>Wave / Orange Money :</strong> {config.paymentNumbers.wave}</p>
                <p><strong>Montant promis :</strong> {amount.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Votre Nom ou Nom de votre Famille *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: El Hadj Touré / Famille Ouattara"
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Téléphone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 07 08 00 11 22"
                  value={donorPhone}
                  onChange={e => setDonorPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Amount buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Montant de la Contribution (FCFA)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[5000, 10000, 25000, 50000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        amount === val
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val.toLocaleString('fr-FR')} F
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={amount}
                  onChange={e => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-900"
                  placeholder="Ou montant libre..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Affectation du don
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Parrainage de plusieurs élèves démunis">Parrainage de plusieurs élèves démunis</option>
                  <option value="Soutien à la Restauration des séminaristes">Soutien à la Restauration des séminaristes</option>
                  <option value="Santé et pharmacie d'urgence du séminaire">Santé et pharmacie d'urgence du séminaire</option>
                  <option value="Don général à l'organisation SERFIG">Don général à l'organisation SERFIG</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>Confirmer mon Don</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
