import React from 'react';
import { ParticipantType, SeminarConfig } from '../types';
import { BookOpen, Award, Utensils, Home, ArrowRight, CheckCircle2 } from 'lucide-react';

interface SeminarOverviewProps {
  config: SeminarConfig;
  onOpenRegisterWithType: (type: ParticipantType) => void;
  onOpenSponsor: () => void;
}

export const SeminarOverview: React.FC<SeminarOverviewProps> = ({
  config,
  onOpenRegisterWithType,
}) => {
  return (
    <section id="presentation" className="py-16 sm:py-24 bg-white text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading matching screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-orange-600 text-white text-xs font-black tracking-wide shadow-xs shrink-0">
              Pourquoi participer ?
            </span>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Ce qui vous attend au {config.editionName}
              </h2>
              {/* Green decorative underline bar */}
              <div className="w-16 h-1 bg-emerald-700 rounded-full mt-2"></div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm sm:text-right">
            Une expérience complète pour votre développement spirituel et personnel
          </p>
        </div>

        {/* 4 Feature Cards (exact replica of the screenshot cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-16">
          {/* Card 1: Cours approfondis */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-5 shadow-xs">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Cours approfondis
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Sessions quotidiennes sur le Coran, la Sunna, le Fiqh et la spiritualité
            </p>
          </div>

          {/* Card 2: Certificat officiel */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-5 shadow-xs">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Certificat officiel
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Attestation de participation délivrée en fin de séminaire
            </p>
          </div>

          {/* Card 3: Repas inclus */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-5 shadow-xs">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Repas inclus
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Pension complète avec petit-déjeuner, déjeuner et dîner
            </p>
          </div>

          {/* Card 4: Hébergement confortable */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col items-start">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mb-5 shadow-xs">
              <Home className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Hébergement confortable
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Logement sécurisé et climatisé pour tous les participants au Lycée Moderne de Gagnoa
            </p>
          </div>
        </div>

        {/* Minimalist Participation & Tarifs Section */}
        <div id="tarifs" className="pt-6 border-t border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 text-xs font-black uppercase tracking-wider">
              Participation Forfaitaire Unique
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Tarif Séminariste : 2 000 FCFA
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Un tarif unique et accessible pour tous les séminaristes de la Région du Gôh.
            </p>
          </div>

          {/* 3 Clear Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Card 1: Séminariste (2 000 FCFA) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-orange-500 shadow-xl flex flex-col relative">
              <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider w-fit mb-3">
                Formule Séminariste
              </span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-4xl font-black text-slate-900">2 000</span>
                <span className="text-sm font-bold text-orange-600">FCFA</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Pour tous les élèves et étudiants des 8 sous-comités du Gôh.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 flex-1 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Accès complet aux 7 jours de cours</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hébergement dortoir sécurisé inclus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Restauration 3 repas / jour garantie</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Attestation officielle & Badge QR Code</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegisterWithType('seminariste')}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>S'inscrire (2 000 FCFA)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Formateur (Gratuit) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 flex flex-col">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider w-fit mb-3">
                Formateur / Oustaz
              </span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-4xl font-black text-slate-900">0</span>
                <span className="text-sm font-bold text-blue-600">FCFA</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Prise en charge totale par l'AEEMCI Région du Gôh.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 flex-1 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Dispense de cours ou ateliers thématiques</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Hébergement et restauration 100% offerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Attestation d'honneur officielle</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegisterWithType('formateur')}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
              >
                <span>Postuler comme Formateur</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Membre Commission (2 000 FCFA) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 flex flex-col">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider w-fit mb-3">
                Commission d'Organisation
              </span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-4xl font-black text-slate-900">2 000</span>
                <span className="text-sm font-bold text-emerald-700">FCFA</span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Badge membre commission & organisation logistique.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-700 flex-1 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sécurité, Restauration, Santé, Accueil...</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Badge officiel Membre de Commission</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hébergement & restauration inclus</span>
                </li>
              </ul>

              <button
                onClick={() => onOpenRegisterWithType('commission')}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-auto"
              >
                <span>Rejoindre une Commission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sous-comités du Gôh list */}
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/90 text-center max-w-4xl mx-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Les 8 Sous-Comités de la Région du Gôh (Tarif unique : 2 000 FCFA)
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-3">
              {[
                'GAGNOA',
                'Guibéroua',
                'Oumé',
                'Bayota',
                'Diégonéfla',
                'Ouragahio',
                'Tonla',
                'Lahouda',
                'Extérieur & Autres'
              ].map(sc => (
                <span
                  key={sc}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  📍 {sc}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
