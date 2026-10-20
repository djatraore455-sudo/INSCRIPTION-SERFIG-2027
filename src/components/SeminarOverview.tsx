import React from 'react';
import { ParticipantType, SeminarConfig } from '../types';
import { BookOpen, Award, Utensils, Home, User, Users, GraduationCap, Check, ChevronRight } from 'lucide-react';

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

        {/* Section 1: Types d'Inscription (Exact visual replica of reference image 1) */}
        <div id="types-inscription" className="pt-12 scroll-mt-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
            <div className="w-full md:w-1/4 flex justify-center md:justify-start">
              <span className="px-5 py-2 rounded-full bg-[#f26315] text-white text-xs font-black uppercase tracking-wider shadow-xs">
                Inscription
              </span>
            </div>

            <div className="w-full md:w-2/4 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight leading-tight">
                Choisissez votre<br />type<br />d'inscription
              </h2>
              <div className="w-16 h-1 bg-[#15803d] mx-auto mt-3 rounded-full" />
            </div>

            <div className="w-full md:w-1/4 text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xs mx-auto md:ml-auto">
                Sélectionnez la catégorie qui vous correspond pour commencer votre inscription
              </p>
            </div>
          </div>

          {/* Full-width green horizontal line */}
          <div className="w-full h-[2px] bg-[#16a34a] mt-6 mb-12 opacity-90" />

          {/* 3 Registration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-20">
            {/* Card 1: Séminariste (POPULAIRE) */}
            <div className="relative bg-white rounded-3xl border-2 border-[#f26315] p-7 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              {/* POPULAIRE badge */}
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 bg-[#f26315] text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs">
                POPULAIRE
              </div>

              <div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-orange-500/20 mb-6">
                  <User className="w-7 h-7 text-white fill-white" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Séminariste
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Participez au séminaire en tant qu'apprenant et bénéficiez d'une formation complète
                </p>

                {/* Checklist with green checkmarks */}
                <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 mb-6">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Accès à tous les cours et ateliers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Certificat de participation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Hébergement et restauration complète</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Support pédagogique et documentation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Polo {config.acronym ? `Polo ${config.editionName || config.acronym}` : 'Polo SEFIHA 2026'} (optionnel)</span>
                  </li>
                </ul>
              </div>

              <div>
                {/* Price Box */}
                <div className="bg-[#f8fafc] rounded-2xl py-4 px-4 text-center my-6 border border-slate-100">
                  <p className="text-[11px] text-slate-400 font-medium mb-0.5">À partir de</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#f26315] tracking-tight">
                    {(config.subCommittees && config.subCommittees.length > 0 
                      ? Math.min(...config.subCommittees.map(s => s.fee)) 
                      : 1000).toLocaleString('fr-FR').replace(/\u202F/g, ' ')} FCFA
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Selon votre sous-comité</p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onOpenRegisterWithType('seminariste')}
                  className="w-full py-3.5 px-4 bg-[#f26315] hover:bg-[#d95208] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>S'inscrire maintenant</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Card 2: Formateur */}
            <div className="relative bg-white rounded-3xl border border-slate-100 p-7 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-orange-500/20 mb-6">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Formateur
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Partagez votre expertise et contribuez à la formation des participants
                </p>

                {/* Checklist with green checkmarks */}
                <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 mb-6">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Dispenser des cours thématiques</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Encadrement des séminaristes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Attestation de formateur officielle</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Hébergement et restauration</span>
                  </li>
                </ul>
              </div>

              <div>
                {/* Price Box */}
                <div className="bg-[#f8fafc] rounded-2xl py-4 px-4 text-center my-6 border border-slate-100">
                  <p className="text-2xl sm:text-3xl font-black text-[#f26315] tracking-tight">
                    Gratuit
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Pour les formateurs</p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onOpenRegisterWithType('formateur')}
                  className="w-full py-3.5 px-4 bg-[#f26315] hover:bg-[#d95208] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>S'inscrire maintenant</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Card 3: Membre de Commission */}
            <div className="relative bg-white rounded-3xl border border-slate-100 p-7 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-orange-500/20 mb-6">
                  <Users className="w-7 h-7 text-white fill-white" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Membre de Commission
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
                  Contribuez à l'organisation et au bon déroulement du séminaire
                </p>

                {/* Checklist with green checkmarks */}
                <ul className="space-y-3 text-xs sm:text-[13px] text-slate-700 mb-6">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Participation active à l'organisation</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Coordination d'équipe et gestion</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Badge membre commission officiel</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[2.5] shrink-0 mt-0.5" />
                    <span>Accès privilégié aux activités</span>
                  </li>
                </ul>
              </div>

              <div>
                {/* Price Box */}
                <div className="bg-[#f8fafc] rounded-2xl py-4 px-4 text-center my-6 border border-slate-100">
                  <p className="text-2xl sm:text-3xl font-black text-[#f26315] tracking-tight">
                    {(config.commissionFee || 2000).toLocaleString('fr-FR').replace(/\u202F/g, ' ')} FCFA
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Frais d'inscription</p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onOpenRegisterWithType('commission')}
                  className="w-full py-3.5 px-4 bg-[#f26315] hover:bg-[#d95208] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>S'inscrire maintenant</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Tarifs par Sous-comité (Exact visual replica of reference image 2) */}
        <div id="tarifs-sous-comites" className="pt-6 scroll-mt-20">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
            <div className="w-full md:w-1/4 flex justify-center md:justify-start">
              <span className="px-5 py-2 rounded-full bg-[#f26315] text-white text-xs font-black uppercase tracking-wider shadow-xs">
                Tarification
              </span>
            </div>

            <div className="w-full md:w-2/4 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e293b] tracking-tight leading-tight">
                Tarifs par Sous-<br />comité
              </h2>
              <div className="w-16 h-1 bg-[#15803d] mx-auto mt-3 rounded-full" />
            </div>

            <div className="w-full md:w-1/4 text-center md:text-right">
              <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xs mx-auto md:ml-auto">
                Des tarifs transparents et accessibles selon votre localité
              </p>
            </div>
          </div>

          {/* Full-width green horizontal line */}
          <div className="w-full h-[2px] bg-[#16a34a] mt-6 mb-12 opacity-90" />

          {/* Sub-committees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(config.subCommittees && config.subCommittees.length > 0 
              ? config.subCommittees 
              : [
                  { id: 'sc-satama', name: 'Satama', fee: 1000 },
                  { id: 'sc-foumbolo', name: 'Foumbolo', fee: 1500 },
                  { id: 'sc-katiola', name: 'Katiola', fee: 2000, isPopular: true },
                  { id: 'sc-tafire', name: 'Tafiré', fee: 2000 },
                  { id: 'sc-dabakala', name: 'Dabakala', fee: 2000 },
                  { id: 'sc-boniere', name: 'Bonieré', fee: 2000 },
                  { id: 'sc-niakara', name: 'Niakara', fee: 3000 }
                ]
            ).map((sc) => {
              const cleanName = sc.name.replace(/^Sous-Comit[ée]\s+/i, '');
              const isPopular = sc.isPopular || cleanName.toLowerCase() === 'katiola' || cleanName.toLowerCase() === 'gagnoa';
              const fee = sc.fee;
              const poloPrice = config.poloPrice || 2000;
              const poloLabel = config.acronym ? `Polo ${config.acronym}` : 'Polo SEFIHA';
              const totalWithPolo = fee + poloPrice;

              return (
                <div
                  key={sc.id}
                  onClick={() => onOpenRegisterWithType('seminariste')}
                  className={`relative bg-white rounded-2xl p-6 transition-all flex flex-col justify-between cursor-pointer group hover:shadow-lg ${
                    isPopular 
                      ? 'border-2 border-[#f26315] shadow-md' 
                      : 'border border-slate-100 shadow-sm hover:border-slate-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 right-6 px-3 py-0.5 bg-[#f26315] text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs">
                      POPULAIRE
                    </div>
                  )}

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 text-center mb-3">
                      {cleanName}
                    </h3>

                    <div className="w-full h-px bg-slate-100 my-3" />

                    <div className="space-y-3.5 my-3">
                      <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        <span className="text-slate-500 font-medium">Participation</span>
                        <span className="font-bold text-slate-800">
                          {fee.toLocaleString('fr-FR').replace(/\u202F/g, ' ')} FCFA
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        <div className="text-left">
                          <span className="text-slate-500 italic block leading-tight">
                            {poloLabel}
                          </span>
                          <span className="text-slate-400 italic text-[11px]">
                            (optionnel)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800">
                            + {poloPrice.toLocaleString('fr-FR').replace(/\u202F/g, ' ')} FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-3" />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-left text-xs font-medium text-slate-700 leading-tight">
                      <span>Total avec</span>
                      <span className="block">polo</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black text-[#f26315] tracking-tight block leading-none">
                        {totalWithPolo.toLocaleString('fr-FR').replace(/\u202F/g, ' ')}
                      </span>
                      <span className="text-xs font-black text-[#f26315] tracking-wide">
                        FCFA
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert Info box matching Image 2 */}
          <div className="mt-10 max-w-4xl mx-auto rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4 sm:p-5 flex items-start sm:items-center gap-3.5 shadow-xs">
            <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 sm:mt-0 shadow-2xs">
              i
            </div>
            <p className="text-xs sm:text-sm text-[#1e40af] font-medium leading-relaxed">
              Le polo {config.editionName || 'SEFIHA 2026'} est optionnel. Vous pouvez choisir de participer sans commander de polo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
