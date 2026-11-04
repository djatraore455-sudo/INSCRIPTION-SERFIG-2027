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
import { AdminPage } from './components/AdminPage';
import { SponsorModal } from './components/SponsorModal';
import { ParticipantSpaceModal } from './components/ParticipantSpaceModal';
import { Footer } from './components/Footer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { UserCheck, Sparkles, Shield, ArrowRight, FileText, GraduationCap } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SeminarConfig>(() => getActiveSeminarConfig());

  // Dedicated Route state for Admin Page (#/admin)
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return window.location.hash === '#/admin' || window.location.hash.startsWith('#/admin');
  });

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(window.location.hash === '#/admin' || window.location.hash.startsWith('#/admin'));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerInitialType, setRegisterInitialType] = useState<ParticipantType>('seminariste');
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);
  
  // Participant Space & Receipt Modal state
  const [isParticipantSpaceOpen, setIsParticipantSpaceOpen] = useState(false);
  const [currentSpaceParticipant, setCurrentSpaceParticipant] = useState<Participant | null>(null);
  const [spaceInitialTab, setSpaceInitialTab] = useState<'receipt' | 'badge' | 'attendance' | 'bulletin' | 'test'>('receipt');

  // URL query parameters parsing (e.g. ?matricule=... or ?test=true or #test)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const matriculeParam = params.get('matricule') || params.get('id');
      const isTestRequested = params.get('test') === 'true' || window.location.hash.includes('test');

      if (matriculeParam) {
        const participants = getParticipants();
        const clean = matriculeParam.trim().toLowerCase();
        const found = participants.find(p => p.matricule.toLowerCase() === clean || p.id.toLowerCase() === clean);
        if (found) {
          setCurrentSpaceParticipant(found);
          setSpaceInitialTab(isTestRequested ? 'test' : 'receipt');
          setIsParticipantSpaceOpen(true);
        }
      } else if (isTestRequested && !isAdminRoute) {
        handleOpenTest();
      }
    } catch {
      // ignore
    }
  }, [isAdminRoute]);

  // Sync title with active seminar
  useEffect(() => {
    if (isAdminRoute) {
      document.title = `Administration ${config.editionName} • AEEMCI Gôh`;
    } else {
      document.title = `Portail ${config.editionName} - AEEMCI Gestion du Séminaire`;
    }
  }, [config, isAdminRoute]);

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

  const handleOpenParticipantSpace = (
    participant?: Participant,
    tab: 'receipt' | 'badge' | 'attendance' | 'bulletin' | 'test' = 'receipt'
  ) => {
    setSpaceInitialTab(tab);
    if (participant) {
      setCurrentSpaceParticipant(participant);
      setIsParticipantSpaceOpen(true);
      return;
    }

    const participants = getParticipants();
    if (participants.length > 0) {
      // Ouvrir avec le premier séminariste (ou dernier actif)
      setCurrentSpaceParticipant(participants[0]);
      setIsParticipantSpaceOpen(true);
    } else {
      setIsVerifyOpen(true);
    }
  };

  const handleOpenTest = (participant?: Participant) => {
    handleOpenParticipantSpace(participant, 'test');
  };

  const handleConfigUpdated = (newConfig: SeminarConfig) => {
    setConfig(newConfig);
  };

  const handleNavigateToAdmin = () => {
    window.location.hash = '#/admin';
    setIsAdminRoute(true);
  };

  // Si la route est #/admin, afficher la page dédiée AdminPage
  if (isAdminRoute) {
    return (
      <AdminPage
        config={config}
        onBackToPublic={() => {
          window.location.hash = '';
          setIsAdminRoute(false);
        }}
        onConfigUpdated={handleConfigUpdated}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navigation */}
      <Navbar
        config={config}
        onOpenRegister={handleScrollToTypes}
        onOpenVerify={() => setIsVerifyOpen(true)}
        onOpenAdmin={handleNavigateToAdmin}
        onOpenSponsor={() => setIsSponsorOpen(true)}
        onOpenParticipantSpace={() => handleOpenParticipantSpace()}
        onOpenTest={() => handleOpenTest()}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          config={config}
          onOpenRegister={handleScrollToTypes}
          onOpenVerify={() => setIsVerifyOpen(true)}
          onOpenAdmin={handleNavigateToAdmin}
          onOpenTest={() => handleOpenTest()}
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
        onOpenAdmin={handleNavigateToAdmin}
        onOpenRegister={handleScrollToTypes}
        onOpenVerify={() => setIsVerifyOpen(true)}
      />

      {/* Floating Bottom Quick Bar (Mobile & Quick Access) - Palette Blanc, Orange & Vert */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[95%] sm:w-auto bg-white/95 backdrop-blur-md text-slate-800 px-3 py-2 rounded-full shadow-xl shadow-slate-900/10 border-2 border-orange-500/30 flex items-center justify-between gap-1.5 sm:gap-2">
        <button
          onClick={handleScrollToTypes}
          className="px-3 py-1.5 bg-[#f26315] hover:bg-orange-600 text-white font-extrabold rounded-full text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-orange-500/25 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>S'inscrire</span>
        </button>

        <button
          onClick={() => handleOpenTest()}
          className="px-3 py-1.5 text-xs font-black text-white bg-[#0b5334] hover:bg-emerald-900 rounded-full border border-emerald-800 transition-all flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
          title="Passer mon Test d'Entrée QCM en Ligne (Jour 1)"
        >
          <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
          <span>Test QCM</span>
        </button>

        <button
          onClick={() => handleOpenParticipantSpace()}
          className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 rounded-full border border-emerald-200 transition-all flex items-center gap-1 cursor-pointer"
          title="Consulter mon Reçu A4 & Émargement"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Reçu</span>
        </button>

        <button
          onClick={() => setIsVerifyOpen(true)}
          className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 transition-all flex items-center gap-1 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Badge</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200"></div>

        <button
          onClick={handleNavigateToAdmin}
          className="px-2.5 py-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/80 rounded-full border border-orange-200 transition-all flex items-center gap-1 cursor-pointer"
          title="Espace administration SERFIG 2027"
        >
          <Shield className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>

      {/* Bannière discrète d'installation PWA (mobile/desktop non encore installé) */}
      <PWAInstallButton variant="banner" />

      {/* Modals */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        config={config}
        initialType={registerInitialType}
        onOpenParticipantSpace={(p) => handleOpenParticipantSpace(p)}
        onOpenAdmin={() => {
          setIsRegisterOpen(false);
          handleNavigateToAdmin();
        }}
      />

      <VerifyRegistrationModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        config={config}
        onOpenParticipantSpace={(p, tab) => handleOpenParticipantSpace(p, tab || 'receipt')}
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
          initialTab={spaceInitialTab}
          onUpdateParticipant={(updated) => {
            setCurrentSpaceParticipant(updated);
          }}
        />
      )}
    </div>
  );
}
