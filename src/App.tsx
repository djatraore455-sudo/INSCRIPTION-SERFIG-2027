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
import { ParticipantSpaceModal } from './components/ParticipantSpaceModal';
import { Footer } from './components/Footer';
import { UserCheck, Sparkles, Shield, ArrowRight, FileText } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SeminarConfig>(() => getActiveSeminarConfig());

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerInitialType, setRegisterInitialType] = useState<ParticipantType>('seminariste');
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);
  
  // Participant Space & Receipt Modal state
  const [isParticipantSpaceOpen, setIsParticipantSpaceOpen] = useState(false);
  const [currentSpaceParticipant, setCurrentSpaceParticipant] = useState<Participant | null>(null);

  // Sync title with active seminar
  useEffect(() => {
    document.title = `Portail ${config.editionName} - AEEMCI Gestion du Séminaire`;
  }, [config]);

  const handleOpenRegister = (type: ParticipantType = 'seminariste') => {
    setRegisterInitialType(type);
    setIsRegisterOpen(true);
  };

  const handleScrollToTypes = () => {
    const el = document.getElementById('types-inscription');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      handleOpenRegister('seminariste');
    }
  };

  const handleOpenParticipantSpace = (participant?: Participant) => {
    if (participant) {
      setCurrentSpaceParticipant(participant);
      setIsParticipantSpaceOpen(true);
      return;
    }

    const participants = getParticipants();
    if (participants.length > 0) {
      // Open with first participant (e.g. DOUMBIA Allassane from user reference)
      setCurrentSpaceParticipant(participants[0]);
      setIsParticipantSpaceOpen(true);
    } else {
      setIsVerifyOpen(true);
    }
  };

  const handleConfigUpdated = (newConfig: SeminarConfig) => {
    setConfig(newConfig);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navigation */}
      <Navbar
        config={config}
        onOpenRegister={handleScrollToTypes}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSponsor={() => setIsSponsorOpen(true)}
        onOpenParticipantSpace={() => handleOpenParticipantSpace()}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          config={config}
          onOpenRegister={handleScrollToTypes}
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
          onOpenRegister={handleScrollToTypes}
        />

        {/* Guide & Rules & FAQ */}
        <SeminarGuide config={config} />
      </main>

      {/* Footer */}
      <Footer
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenRegister={handleScrollToTypes}
        onOpenVerify={() => setIsVerifyOpen(true)}
      />

      {/* Floating Bottom Quick Bar (Mobile & Quick Access) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[95%] sm:w-auto bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center justify-between sm:gap-3">
        <button
          onClick={handleScrollToTypes}
          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-full text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/25"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>S'inscrire</span>
        </button>

        <button
          onClick={() => handleOpenParticipantSpace()}
          className="px-3 py-1.5 text-xs font-bold text-emerald-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
          title="Consulter mon Reçu A4 & Émargement"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mon Reçu</span>
        </button>

        <button
          onClick={() => setIsVerifyOpen(true)}
          className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-300" />
          <span>Badge</span>
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
        onOpenParticipantSpace={(p) => handleOpenParticipantSpace(p)}
        onOpenAdmin={() => {
          setIsRegisterOpen(false);
          setIsAdminOpen(true);
        }}
      />

      <VerifyRegistrationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        config={config}
        onOpenParticipantSpace={(p) => handleOpenParticipantSpace(p)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigUpdated={handleConfigUpdated}
        onOpenParticipantSpace={(p) => handleOpenParticipantSpace(p)}
      />

      <SponsorModal
        isOpen={isSponsorOpen}
        onClose={() => setIsSponsorOpen(false)}
        config={config}
      />

      {currentSpaceParticipant && (
        <ParticipantSpaceModal
          isOpen={isParticipantSpaceOpen}
          onClose={() => setIsParticipantSpaceOpen(false)}
          participant={currentSpaceParticipant}
          config={config}
          onUpdateParticipant={(updated) => {
            setCurrentSpaceParticipant(updated);
          }}
        />
      )}
    </div>
  );
}
