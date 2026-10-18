import React from 'react';
import { SeminarConfig } from '../types';
import { Calendar, Users, GraduationCap, Clock, ChevronDown, User, ChevronRight } from 'lucide-react';

interface HeroProps {
  config: SeminarConfig;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
  onOpenAdmin: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  config,
  onOpenRegister,
}) => {
  return (
    <div id="accueil" className="relative bg-gradient-to-b from-orange-500 via-orange-600 to-amber-700 text-white overflow-hidden py-14 sm:py-20 select-none">
      {/* Background Photography Texture with Warm Overlay */}
      <div 
        className="absolute inset-0 opacity-15 mix-blend-overlay bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url('/src/assets/images/serfig_goh_banner_1792249086757.jpg')` }}
      ></div>

      {/* Atmospheric radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Edition Pill */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold mb-5 shadow-xs">
          <span>★</span>
          <span>Édition 2027</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none mb-3">
          {config.editionName}
        </h1>

        {/* Subtitle */}
        <h2 className="text-lg sm:text-2xl font-bold text-white/95 mb-5 tracking-tight">
          Séminaire de Formation Islamique du Gôh
        </h2>

        {/* Descriptive Text matching reference website */}
        <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto leading-relaxed font-normal mb-8">
          Rejoignez-nous pour une semaine enrichissante de formation spirituelle et intellectuelle. Approfondissez votre foi, tissez des liens fraternels et enrichissez vos connaissances islamiques dans une ambiance conviviale et bienveillante.
        </p>

        {/* Main Prominent White Button with Orange Text */}
        <div className="mb-10 flex justify-center">
          <button
            onClick={onOpenRegister}
            className="px-8 py-4 rounded-full font-extrabold text-sm sm:text-base text-orange-600 bg-white hover:bg-orange-50 shadow-2xl hover:shadow-white/20 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <User className="w-4 h-4 fill-orange-600 text-orange-600" />
            <span>Je m'inscris maintenant</span>
            <ChevronRight className="w-4 h-4 text-orange-600" />
          </button>
        </div>

        {/* Big Date Glassmorphism Card */}
        <div className="max-w-xl mx-auto mb-6 p-5 sm:p-6 rounded-3xl bg-white/15 backdrop-blur-md border border-white/25 shadow-xl text-center">
          <div className="flex items-center justify-center gap-3">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            <span className="text-2xl sm:text-4xl font-black tracking-wide text-white">
              12 - 18 AVRIL 2027
            </span>
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
            7 jours de formation intensive • Gagnoa
          </p>
        </div>

        {/* 3 Stat Glassmorphic Cards as in reference screenshot */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {/* Card 1: 400+ attendus */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-md text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-white block leading-tight">
                {config.stats.expectedParticipants}+
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 line-clamp-1">
                Participants attendus
              </span>
            </div>
          </div>

          {/* Card 2: 20+ formateurs */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-md text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-white block leading-tight">
                20+
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 line-clamp-1">
                Formateurs experts
              </span>
            </div>
          </div>

          {/* Card 3: 7 jours intensifs */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-md text-left flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black text-white block leading-tight">
                7
              </span>
              <span className="text-[10px] sm:text-xs text-white/80 line-clamp-1">
                Jours intensifs
              </span>
            </div>
          </div>
        </div>

        {/* Little Downward Chevron indicator */}
        <div className="mt-8 flex justify-center text-white/70 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
