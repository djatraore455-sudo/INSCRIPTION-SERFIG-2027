import React, { useState } from 'react';
import { Commission, CommissionNeed } from '../../../types/commissions';
import { createCommissionNeed } from '../../../services/commissionsService';
import { X, AlertTriangle, Send, Loader2, Clock, CheckCircle } from 'lucide-react';

interface CreateNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissions: Commission[];
  currentCommissionCode: string;
  onNeedCreated: (newNeed: CommissionNeed) => void;
}

export const CreateNeedModal: React.FC<CreateNeedModalProps> = ({
  isOpen,
  onClose,
  commissions,
  currentCommissionCode,
  onNeedCreated
}) => {
  const [fromCommission, setFromCommission] = useState(currentCommissionCode || 'restauration');
  const [targetCommission, setTargetCommission] = useState<string>(''); // '' = Coordination / PCO
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [unit, setUnit] = useState('');
  const [urgency, setUrgency] = useState<'normale' | 'haute' | 'critique'>('normale');
  const [neededBy, setNeededBy] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Veuillez renseigner l’intitulé du besoin.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const created = await createCommissionNeed({
        commission_code: fromCommission,
        target_commission: targetCommission ? targetCommission : null,
        title: title.trim(),
        details: details.trim() || undefined,
        quantity: quantity ? Number(quantity) : undefined,
        unit: unit.trim() || undefined,
        urgency,
        needed_by: neededBy || undefined
      });

      onNeedCreated(created);
      onClose();
    } catch (err: any) {
      console.error('Erreur émission besoin :', err);
      setErrorMsg(err?.message || 'Erreur lors de l’émission du besoin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Émettre un Besoin en Temps Réel</h3>
              <p className="text-xs text-slate-500">Alerter la coordination ou solliciter une commission en direct.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Commissions Émettrice & Cible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Commission émettrice :</label>
              <select
                value={fromCommission}
                onChange={e => setFromCommission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
              >
                {commissions.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Destinataire sollicité :</label>
              <select
                value={targetCommission}
                onChange={e => setTargetCommission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">🏛️ Coordination Générale / PCO</option>
                {commissions
                  .filter(c => c.code !== fromCommission)
                  .map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Niveau d'Urgence */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Degré d'urgence :</label>
            <div className="grid grid-cols-3 gap-2">
              <label
                onClick={() => setUrgency('normale')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  urgency === 'normale'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 font-black shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 font-semibold'
                }`}
              >
                <span>🟦 Normale</span>
                <span className="block text-[10px] text-slate-400 font-normal">Anticipation</span>
              </label>

              <label
                onClick={() => setUrgency('haute')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  urgency === 'haute'
                    ? 'border-orange-500 bg-orange-50 text-orange-900 font-black shadow-2xs ring-2 ring-orange-200'
                    : 'border-slate-200 bg-white text-slate-600 font-semibold'
                }`}
              >
                <span>🟧 Haute</span>
                <span className="block text-[10px] text-slate-400 font-normal">Dans la journée</span>
              </label>

              <label
                onClick={() => setUrgency('critique')}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  urgency === 'critique'
                    ? 'border-red-600 bg-red-50 text-red-900 font-black shadow-2xs ring-2 ring-red-300'
                    : 'border-slate-200 bg-white text-slate-600 font-semibold'
                }`}
              >
                <span>🟥 Critique</span>
                <span className="block text-[10px] text-red-600 font-bold">Immédiat / Blocage</span>
              </label>
            </div>
          </div>

          {/* Titre du besoin */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Intitulé du besoin <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ex: Rupture de bouteilles de gaz pour le dîner"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Quantité & Unité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantité requise (facultatif) :</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="ex: 3"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unité (ex: bouteilles, sacs, cartons) :</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="ex: bouteilles B12"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Détails / Contexte */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Détails complémentaires / Localisation :</label>
            <textarea
              rows={2}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="ex: Nous sommes à la cuisine principale. Besoin avant 16h pour préparer le repas de 19h."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Date souhaitée */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Date souhaitée :</label>
            <input
              type="date"
              value={neededBy}
              onChange={e => setNeededBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Boutons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Publication...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  <span>Publier le Besoin en Direct</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
