import React from 'react';
import { SeminarConfig } from '../types';
import { AeemciLogo } from './AeemciLogo';
import { Phone, Mail, MapPin, Heart, Shield, ArrowUp, ExternalLink } from 'lucide-react';

interface FooterProps {
  config: SeminarConfig;
  onOpenAdmin: () => void;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  config,
  onOpenAdmin,
  onOpenRegister,
  onOpenVerify
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AeemciLogo size="md" src={config.logoUrl} />
              <div>
                <span className="text-base font-black text-white block">
                  {config.editionName}
                </span>
                <span className="text-xs text-amber-400 font-bold">
                  {config.motto}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {config.fullTitle}. Plateforme officielle de gestion, inscriptions et suivi organisée par l'AEEMCI ({config.region}).
            </p>

            <div className="text-xs text-emerald-400/90 font-medium">
              « Foi • Fraternité • Travail »
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Navigation Rapide
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#presentation" className="hover:text-amber-400 transition-colors">
                  À Propos du Séminaire
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-amber-400 transition-colors">
                  Formules Séminariste & Formateur
                </a>
              </li>
              <li>
                <a href="#programme" className="hover:text-amber-400 transition-colors">
                  Programme des 7 Jours
                </a>
              </li>
              <li>
                <a href="#polo" className="hover:text-amber-400 transition-colors">
                  Boutique Polo Officiel
                </a>
              </li>
              <li>
                <a href="#guide" className="hover:text-amber-400 transition-colors">
                  Guide du Séminariste & Trousseau
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenVerify}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                >
                  Vérifier mon Inscription / Mon Badge
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Comité d'Organisation
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{config.contacts.primaryPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{config.contacts.secondaryPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="line-clamp-1">{config.contacts.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{config.location.venue}, {config.location.city} ({config.region})</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Mobile Money info & Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Paiement Sécurisé
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Règlement par Wave ou Mobile Money officiel :
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
              <p><span className="text-slate-500">Wave/OM:</span> <span className="text-amber-400 font-bold">{config.paymentNumbers.wave}</span></p>
              <p><span className="text-slate-500">MTN:</span> <span className="text-amber-400 font-bold">{config.paymentNumbers.mtnMoMo}</span></p>
              <p className="text-[10px] text-slate-400 font-sans mt-1">Au nom de : {config.paymentNumbers.recipientName}</p>
            </div>

            <div className="mt-4">
              <button
                onClick={onOpenAdmin}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Administration {config.acronym}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {config.organizer}. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-[11px]">
              Développé pour l'AEEMCI Côte d'Ivoire
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Retour en haut"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
