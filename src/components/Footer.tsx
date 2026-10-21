import React from 'react';
import { SeminarConfig } from '../types';
import { Phone, Mail, MapPin, Shield, ArrowUp, MessageCircle, ExternalLink, CheckCircle } from 'lucide-react';

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
    <footer className="bg-white text-slate-700 pt-16 pb-8 border-t-2 border-orange-500 relative">
      {/* Ligne décorative verte en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#10b981]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-slate-200">
          
          {/* Col 1 : Identité officielle */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full p-1 bg-white border-2 border-orange-500 shadow-sm shrink-0 flex items-center justify-center">
                <img 
                  src="/assets/aistudio/1771719145696_b78691d8.png" 
                  alt="Logo homologué AEEMCI" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 block tracking-tight">
                  {config.editionName}
                </span>
                <span className="text-xs text-orange-600 font-bold">
                  {config.motto}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {config.fullTitle}. Plateforme officielle de gestion, inscriptions et suivi organisée par l'AEEMCI ({config.region}).
            </p>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>« Foi • Fraternité • Travail »</span>
            </div>
          </div>

          {/* Col 2 : Navigation Rapide */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Navigation Rapide
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <a href="#presentation" className="text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>À Propos du Séminaire</span>
                </a>
              </li>
              <li>
                <a href="#types-inscription" className="text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>Formules Séminariste & Formateur</span>
                </a>
              </li>
              <li>
                <a href="#programme" className="text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>Programme des 7 Jours</span>
                </a>
              </li>
              <li>
                <a href="#polo" className="text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>Boutique Polo Officiel</span>
                </a>
              </li>
              <li>
                <a href="#guide" className="text-slate-600 hover:text-orange-600 transition-colors flex items-center gap-1.5">
                  <span className="text-slate-400">›</span>
                  <span>Guide du Séminariste & Trousseau</span>
                </a>
              </li>
              <li className="pt-1">
                <button
                  onClick={onOpenVerify}
                  className="text-emerald-700 hover:text-emerald-800 font-bold transition-colors cursor-pointer flex items-center gap-1.5 hover:underline"
                >
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>Vérifier mon Inscription / Mon Badge</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 : Contacts & Siège (Données homologuées du Gôh) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Contacts & Siège
              </h4>
            </div>
            <div className="space-y-3 text-xs">
              {/* Email */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-semibold">Email :</span>
                  <a
                    href="mailto:aeemcisrgoh@gmail.com"
                    className="text-slate-900 hover:text-orange-600 transition-colors font-bold break-all"
                  >
                    aeemcisrgoh@gmail.com
                  </a>
                </div>
              </div>

              {/* Siège social */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-semibold">Siège social :</span>
                  <span className="text-slate-900 font-bold">
                    Gagnoa carrefour Orange Money
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block font-semibold">Contact :</span>
                  <div className="text-slate-900 font-bold flex flex-wrap items-center gap-1.5">
                    <a href="tel:+2250788609677" className="hover:text-orange-600 transition-colors">
                      (+225) 0788609677
                    </a>
                    <span className="text-slate-400">/</span>
                    <a href="tel:+2250141273083" className="hover:text-orange-600 transition-colors">
                      0141273083
                    </a>
                    <span className="text-slate-400">/</span>
                    <a href="tel:+2250574613512" className="hover:text-orange-600 transition-colors">
                      0574613512
                    </a>
                  </div>
                </div>
              </div>

              {/* Urgence WhatsApp */}
              <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300 mt-0.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-orange-600 font-bold text-[11px] block">Urgence :</span>
                  <a
                    href="https://wa.me/2250564843912"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-900 hover:text-emerald-700 font-black transition-colors"
                  >
                    <span>0564843912</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                      whatsapp
                    </span>
                  </a>
                </div>
              </div>

              {/* Lieu du Séminaire */}
              <div className="text-[11px] text-slate-500 pt-1">
                <span className="font-semibold text-slate-700">Lieu du séminaire :</span> Lycée Moderne 1 & 2 de Gagnoa
              </div>
            </div>
          </div>

          {/* Col 4 : Paiement Sécurisé (WAVE DIRECT UNIQUEMENT - AUCUN SIMULATEUR) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Paiement Sécurisé
              </h4>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Règlement officiel exclusivement par <strong className="text-orange-600">Wave Direct</strong> :
            </p>

            {/* Carte Wave Direct (Blanc / Orange) */}
            <div className="p-4 bg-orange-50/70 rounded-2xl border-2 border-orange-200 text-xs space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black tracking-wide">
                  <span>🌊</span> Wave Direct
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Officiel
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Numéro Wave du Séminaire :</span>
                <span className="text-base font-black text-orange-600 font-mono tracking-tight block">
                  (+225) 0788609677
                </span>
              </div>

              <div className="pt-1.5 border-t border-orange-200/80 text-[11px] text-slate-600">
                <p><strong>Bénéficiaire :</strong> AEEMCI Gôh / SERFIG 2027</p>
                <p className="text-slate-500 text-[10px] mt-0.5">
                  Paiement direct sécurisé, sans intermédiaire ni simulateur.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={onOpenAdmin}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>Administration {config.acronym}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI) - Secrétariat Régional du Gôh. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-600 font-medium">
              Développé pour l'AEEMCI Côte d'Ivoire
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 transition-all cursor-pointer shadow-2xs"
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
