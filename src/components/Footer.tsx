import React from 'react';
import { SeminarConfig } from '../types';
import { AeemciLogo } from './AeemciLogo';
import { Phone, Mail, MapPin, Heart, Shield, ArrowUp, ExternalLink, MessageCircle } from 'lucide-react';

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

          {/* Col 3: Contacts & Siège */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Contacts & Siège
            </h4>
            <div className="space-y-3 text-xs">
              {/* Email */}
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Email :</span>
                  <a
                    href={`mailto:${config.contacts.email}`}
                    className="text-white hover:text-amber-400 transition-colors font-medium break-all"
                  >
                    {config.contacts.email}
                  </a>
                </div>
              </div>

              {/* Siège social */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Siège social :</span>
                  <span className="text-white font-medium">
                    {config.contacts.address}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Contact :</span>
                  <div className="text-white font-medium flex flex-wrap items-center gap-1.5">
                    <a href="tel:+2250788609677" className="hover:text-amber-400 transition-colors">
                      (+225) 0788609677
                    </a>
                    <span className="text-slate-500">/</span>
                    <a href="tel:+2250141273083" className="hover:text-amber-400 transition-colors">
                      0141273083
                    </a>
                    <span className="text-slate-500">/</span>
                    <a href="tel:+2250574613512" className="hover:text-amber-400 transition-colors">
                      0574613512
                    </a>
                  </div>
                </div>
              </div>

              {/* Urgence WhatsApp */}
              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800/80">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-400 font-bold text-[11px] block">Urgence :</span>
                  <a
                    href="https://wa.me/2250564843912"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white hover:text-emerald-300 font-semibold transition-colors"
                  >
                    <span>0564843912</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.5 rounded font-normal">
                      whatsapp
                    </span>
                  </a>
                </div>
              </div>

              {/* Lieu du Séminaire */}
              <div className="text-[11px] text-slate-400 pt-1">
                <span className="text-slate-500">Lieu du séminaire :</span> {config.location.venue}, {config.location.city}
              </div>
            </div>
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
