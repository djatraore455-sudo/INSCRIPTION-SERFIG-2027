import React, { useState } from 'react';
import { SeminarConfig } from '../types';
import { AeemciLogo } from './AeemciLogo';
import { LayoutDashboard, Menu, X, UserCheck, Calendar, Sparkles, HeartHandshake, FileText } from 'lucide-react';

interface NavbarProps {
  config: SeminarConfig;
  onOpenRegister: () => void;
  onOpenVerify: () => void;
  onOpenAdmin: () => void;
  onOpenSponsor: () => void;
  onOpenParticipantSpace?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  onOpenRegister,
  onOpenVerify,
  onOpenAdmin,
  onOpenSponsor,
  onOpenParticipantSpace
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Left: Brand with Official AEEMCI Logo */}
        <a href="#accueil" className="flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-full border border-slate-200 bg-white p-1 flex items-center justify-center shadow-xs">
            <AeemciLogo size="md" src={config.logoUrl} />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight block">
              {config.editionName}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1">
              {config.fullTitle}
            </p>
          </div>
        </a>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct link to Reçu & Espace Séminariste (desktop) */}
          <button
            onClick={onOpenParticipantSpace || onOpenVerify}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            title="Consulter ma fiche d'inscription, émargement des cours et restaurant"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Mon Reçu & Présence</span>
          </button>

          {/* Quick link to Badge search (desktop) */}
          <button
            onClick={onOpenVerify}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Vérifier Badge</span>
          </button>

          {/* Prominent Orange Dashboard Button */}
          <button
            onClick={onOpenAdmin}
            className="px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer transform active:scale-95"
            title="Accéder au Dashboard / Espace Administrateur"
          >
            <LayoutDashboard className="w-4 h-4 text-white" />
            <span>Dashboard</span>
          </button>

          {/* Hamburger Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Dropdown Menu (Accessible from the hamburger button) */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenRegister();
              }}
              className="p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-left font-bold text-xs text-orange-900 transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>S'inscrire au SERFIG (2 000 FCFA)</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVerify();
              }}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left font-bold text-xs text-emerald-900 transition-all cursor-pointer flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Vérifier mon Inscription & Badge</span>
            </button>

            <a
              href="#programme"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left font-bold text-xs text-slate-800 transition-all cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Programme des 7 Jours (Gagnoa)</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSponsor();
              }}
              className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left font-bold text-xs text-amber-900 transition-all cursor-pointer flex items-center gap-2"
            >
              <HeartHandshake className="w-4 h-4 text-amber-700" />
              <span>Parrainer un séminariste</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-900 rounded-xl text-left font-bold text-xs text-white transition-all cursor-pointer flex items-center gap-2 col-span-full sm:col-span-1"
            >
              <LayoutDashboard className="w-4 h-4 text-white" />
              <span>Espace Administrateur (Dashboard)</span>
            </button>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100">
            <a href="#presentation" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
              Ce qui vous attend
            </a>
            <a href="#polo" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
              Polo (2 500 F) & T-shirt (2 000 F)
            </a>
            <a href="#guide" onClick={() => setMobileMenuOpen(false)} className="hover:text-slate-900">
              Guide & Trousseau
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
