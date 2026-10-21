import React, { useState, useMemo } from 'react';
import { Participant, SeminarConfig } from '../../types';
import { MessageCircle, Send, Copy, Download, Filter, Check, Users, Sparkles } from 'lucide-react';

interface AdminMessagingProps {
  participants: Participant[];
  config: SeminarConfig;
  onLogActivity?: (action: string, details: any) => void;
}

export const AdminMessaging: React.FC<AdminMessagingProps> = ({
  participants,
  config,
  onLogActivity
}) => {
  const [targetAudience, setTargetAudience] = useState<'all' | 'paye' | 'en_attente' | 'formateur' | 'commission'>('en_attente');
  const [selectedSubCommittee, setSelectedSubCommittee] = useState<string>('all');
  const [templateType, setTemplateType] = useState<'rappel_paiement' | 'convocation' | 'consignes_arrivee' | 'personnalise'>('rappel_paiement');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  // Filtrage des destinataires
  const targetParticipants = useMemo(() => {
    return participants.filter(p => {
      if (targetAudience === 'paye' && p.paymentStatus !== 'paye') return false;
      if (targetAudience === 'en_attente' && p.paymentStatus !== 'en_attente') return false;
      if (targetAudience === 'formateur' && p.type !== 'formateur') return false;
      if (targetAudience === 'commission' && p.type !== 'commission') return false;

      if (selectedSubCommittee !== 'all' && !p.subCommittee.toLowerCase().includes(selectedSubCommittee.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [participants, targetAudience, selectedSubCommittee]);

  // Génération du texte personnalisé pour un participant
  const generateMessageFor = (p: Participant): string => {
    const venue = config.location?.venue || 'Lycée Moderne 1 & 2 de Gagnoa';
    const dates = config.displayDates || 'Du 17 au 22 Avril 2027';
    const contacts = config.contacts?.primaryPhone || '(+225) 0788609677';

    switch (templateType) {
      case 'rappel_paiement':
        return `Assalamu alaykum cher(e) frère/sœur ${p.fullName}.
Votre inscription pour le ${config.editionName} (${p.matricule}) à Gagnoa (${dates}) est enregistrée mais en attente de règlement de ${p.totalFee} FCFA.
Veuillez finaliser votre paiement via Wave / Orange Money au ${contacts} pour sécuriser votre place et dortoir.
Barakallahu feekum ! AEEMCI Région du Gôh.`;

      case 'convocation':
        return `Assalamu alaykum ${p.fullName} (Matricule: ${p.matricule}).
Votre inscription au ${config.editionName} est confirmée !
📍 Lieu : ${venue}.
📅 Dates : ${dates}.
${p.dormitory ? `🏠 Votre dortoir : ${p.dormitory}.` : ''}
🎒 Trousseau recommandé : Coran, bloc-notes, draps, nécessaire de toilette, tenue décente.
Contacts assistance : ${contacts}. Bon séminaire !`;

      case 'consignes_arrivee':
        return `Assalamu alaykum ${p.fullName}.
Pour votre arrivée au ${config.editionName} à Gagnoa :
1. Présentez votre reçu ou matricule ${p.matricule} à l'accueil pour le badge et l'accès dortoir.
2. Début de l'accueil : Samedi 17 Avril dès 08h00.
3. En cas d'urgence en route : ${config.contacts?.emergencyPhone || contacts}.
L'AEEMCI Gôh vous souhaite la bienvenue !`;

      case 'personnalise':
        return customMessage
          .replace(/{nom}/g, p.fullName)
          .replace(/{matricule}/g, p.matricule)
          .replace(/{total}/g, `${p.totalFee} FCFA`)
          .replace(/{sous_comite}/g, p.subCommittee)
          .replace(/{dortoir}/g, p.dormitory || 'Non assigné');
      default:
        return '';
    }
  };

  // Liste de tous les numéros au format propre
  const allPhoneNumbers = useMemo(() => {
    return targetParticipants
      .map(p => {
        const clean = (p.whatsapp || p.phone || '').replace(/\D/g, '');
        if (clean.length === 10) return `+225${clean}`;
        if (clean.startsWith('225') && clean.length === 12) return `+${clean}`;
        return clean.length >= 8 ? `+225${clean.slice(-10)}` : '';
      })
      .filter(phone => phone.length > 5);
  }, [targetParticipants]);

  const handleCopyAllNumbers = () => {
    const text = allPhoneNumbers.join(', ');
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
    if (onLogActivity) {
      onLogActivity('MESSAGING_COPY_NUMBERS', { count: allPhoneNumbers.length, audience: targetAudience });
    }
  };

  const handleExportContactsCSV = () => {
    const headers = ['Nom complet', 'Matricule', 'Rôle', 'Sous-comité', 'Statut Paiement', 'Téléphone', 'WhatsApp'];
    const rows = targetParticipants.map(p => [
      p.fullName,
      p.matricule,
      p.type,
      p.subCommittee,
      p.paymentStatus,
      p.phone,
      p.whatsapp
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Contacts_${targetAudience}_SERFIG2027_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête de la messagerie */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>Diffusion & Messagerie WhatsApp / SMS (Phase 2)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Générez des messages personnalisés pour les relances financières, convocations et informations pratiques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAllNumbers}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSuccess ? 'Numéros copiés !' : `Copier ${allPhoneNumbers.length} numéros`}</span>
          </button>

          <button
            onClick={handleExportContactsCSV}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Exporter la liste en CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Paramètres Destinataires & Modèles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Configuration du message */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            1. Ciblage des Destinataires
          </h4>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Public cible</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            >
              <option value="en_attente">Paiements en attente uniquement</option>
              <option value="paye">Participants confirmés (payés)</option>
              <option value="all">Tous les inscrits</option>
              <option value="formateur">Formateurs & Aînés</option>
              <option value="commission">Membres Commission</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Sous-comité</label>
            <select
              value={selectedSubCommittee}
              onChange={(e) => setSelectedSubCommittee(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
            >
              <option value="all">Tous les sous-comités</option>
              {['Gagnoa', 'Guibéroua', 'Oumé', 'Bayota', 'Diégonéfla', 'Ouragahio', 'Tonla', 'Lahouda', 'Extérieur'].map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              2. Modèle de Message
            </h4>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="template"
                  checked={templateType === 'rappel_paiement'}
                  onChange={() => setTemplateType('rappel_paiement')}
                  className="text-orange-600"
                />
                <span className="font-semibold text-slate-800">Rappel de paiement</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="template"
                  checked={templateType === 'convocation'}
                  onChange={() => setTemplateType('convocation')}
                  className="text-orange-600"
                />
                <span className="font-semibold text-slate-800">Convocation & Trousseau</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="template"
                  checked={templateType === 'consignes_arrivee'}
                  onChange={() => setTemplateType('consignes_arrivee')}
                  className="text-orange-600"
                />
                <span className="font-semibold text-slate-800">Consignes d'arrivée à Gagnoa</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="template"
                  checked={templateType === 'personnalise'}
                  onChange={() => setTemplateType('personnalise')}
                  className="text-orange-600"
                />
                <span className="font-semibold text-slate-800">Message personnalisé libre</span>
              </label>
            </div>
          </div>

          {templateType === 'personnalise' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Contenu (Variables : {'{nom}'}, {'{matricule}'}, {'{total}'}, {'{dortoir}'})
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={4}
                placeholder="Salam {nom}, votre matricule est {matricule}..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        {/* Colonne Droite : Aperçu et Envois Individuels */}
        <div className="lg:col-span-2 space-y-4">
          {/* Aperçu du message type */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Aperçu du message type généré :
            </span>
            <p className="text-xs text-slate-800 whitespace-pre-line font-mono bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
              {targetParticipants.length > 0 
                ? generateMessageFor(targetParticipants[0])
                : 'Sélectionnez des destinataires pour prévisualiser le message.'}
            </p>
          </div>

          {/* Liste des destinataires avec bouton d'ouverture WhatsApp direct */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Destinataires ciblés ({targetParticipants.length})
              </h4>
              <span className="text-xs text-slate-400">
                Clic sur WhatsApp ouvre directement la discussion avec le texte prérempli
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto text-xs">
              {targetParticipants.map(p => {
                const cleanPhone = (p.whatsapp || p.phone || '').replace(/\D/g, '').slice(-10);
                const msg = generateMessageFor(p);
                const waUrl = `https://wa.me/225${cleanPhone}?text=${encodeURIComponent(msg)}`;

                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900">{p.fullName}</span>
                      <span className="text-slate-400 font-mono ml-2">({p.matricule})</span>
                      <span className="text-[11px] text-slate-500 block">
                        {p.subCommittee} • Tél: {p.phone} • {p.totalFee} FCFA ({p.paymentStatus})
                      </span>
                    </div>

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
