import React, { useState, useEffect } from 'react';
import { Participant, ParticipantType, SeminarConfig } from './types';
import { getActiveSeminarConfig, getParticipants } from './services/storage';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SeminarOverview } from './components/SeminarOverview';
import { ScheduleSection } from './components/ScheduleSection';
import { PoloSection } from './components/PoloSection';
import { SeminarGuide } from './components/SeminarGuide';
import { RegistrationModal } from './components/RegistrationModal';
import { VerifyRegistrationModal } from './components/VerifyRegistrationModal';
import { AdminModal } from './components/AdminModal';
import { SponsorModal } from './components/SponsorModal';
import { Footer } from './components/Footer';
import { UserCheck, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SeminarConfig>(() => getActiveSeminarConfig());

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerInitialType, setRegisterInitialType] = useState<ParticipantType>('seminariste');
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);

  // Sync title with active seminar
  useEffect(() => {
    document.title = `Portail ${config.editionName} - AEEMCI Gestion du Séminaire`;
  }, [config]);

  const handleOpenRegister = (type: ParticipantType = 'seminariste') => {
    setRegisterInitialType(type);
    setIsRegisterOpen(true);
  };

  const handleConfigUpdated = (newConfig: SeminarConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navigation */}
      <Navbar
        config={config}
        onOpenRegister={() => handleOpenRegister('seminariste')}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSponsor={() => setIsSponsorOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          config={config}
          onOpenRegister={() => handleOpenRegister('seminariste')}
          onOpenVerify={() => setIsVerifyOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />

        {/* Seminar Presentation & Formula Cards (Séminariste / Formateur / Commission) */}
        <SeminarOverview
          config={config}
          onOpenRegisterWithType={handleOpenRegister}
          onOpenSponsor={() => setIsSponsorOpen(true)}
        />

        {/* 7-Day Schedule Section */}
        <ScheduleSection config={config} />

        {/* Official Polo Boutique Section */}
        <PoloSection
          config={config}
          onOpenRegister={() => handleOpenRegister('seminariste')}
        />

        {/* Guide & Rules & FAQ */}
        <SeminarGuide config={config} />
      </main>

      {/* Footer */}
      <Footer
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenRegister={() => handleOpenRegister('seminariste')}
        onOpenVerify={() => setIsVerifyOpen(true)}
      />

      {/* Floating Bottom Quick Bar (Mobile & Quick Access) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-sm w-[92%] sm:w-auto bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center justify-between sm:gap-4">
        <button
          onClick={() => handleOpenRegister('seminariste')}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/25"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>S'inscrire SERFIG</span>
        </button>

        <button
          onClick={() => setIsVerifyOpen(true)}
          className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mon Badge</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700"></div>

        <button
          onClick={() => setIsAdminOpen(true)}
          className="px-3 py-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Panneau de gestion & paramètres SERFIG 2027"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>

      {/* Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        config={config}
        initialType={registerInitialType}
      />

      <VerifyRegistrationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        config={config}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigUpdated={handleConfigUpdated}
      />

      <SponsorModal
        isOpen={isSponsorOpen}
        onClose={() => setIsSponsorOpen(false)}
        config={config}
      />
    </div>
  );
}
