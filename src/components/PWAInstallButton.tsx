import React, { useState } from 'react';
import { Smartphone, Download, Check, X, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'floating' | 'banner' | 'menu-item';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const { canInstall, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('pwa_banner_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  // Si l'application est déjà lancée en mode autonome installé, ne pas afficher
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      const success = await installApp();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      // Si le prompt natif n'est pas prêt ou si iOS / autre navigateur, afficher le guide pas à pas
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Bouton style Navbar (Desktop / Header) */}
      {variant === 'navbar' && (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-800 bg-orange-50 hover:bg-orange-100/90 border border-orange-200/80 rounded-xl transition-all cursor-pointer transform active:scale-95 shadow-2xs ${className}`}
          title="Installer SERFIG 2027 sur votre écran d'accueil (Accès direct & hors-ligne)"
        >
          {installSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700">Installé !</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-orange-600 animate-pulse" />
              <span>Installer l'app</span>
            </>
          )}
        </button>
      )}

      {/* Bouton style Menu Mobile Déroulant */}
      {variant === 'menu-item' && (
        <button
          onClick={handleClick}
          className={`w-full p-3 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 rounded-xl text-left font-bold text-xs text-orange-950 transition-all cursor-pointer flex items-center justify-between group ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-extrabold text-orange-900">Installer SERFIG sur l'écran d'accueil</span>
              <span className="text-[10px] text-orange-700 font-normal">Accès rapide 1-clic comme une vraie application</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-orange-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Bannière d'incitation flottante discrète */}
      {variant === 'banner' && !isDismissed && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-30 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="SERFIG 2027"
              className="w-10 h-10 rounded-xl bg-white p-1 object-contain shrink-0 shadow-xs border border-white/20"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">Installer l'app SERFIG 2027</p>
              <p className="text-[11px] text-slate-300 line-clamp-1">Accès direct 1-clic & consultation hors-ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleClick}
              className="px-3 py-1.5 bg-[#f26315] hover:bg-orange-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20 active:scale-95"
            >
              Installer
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Masquer"
              aria-label="Masquer la bannière"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal d'Installation (iOS, Android, Chrome & Desktop) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-left">
            {/* Header avec Logo SERFIG */}
            <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 p-6 text-white relative">
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="SERFIG 2027"
                  className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md object-contain border border-white/30"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-orange-100">
                    Application Officielle PWA
                  </span>
                  <h3 className="text-xl font-black tracking-tight leading-tight">
                    SERFIG 2027 • AEEMCI Gôh
                  </h3>
                  <p className="text-xs text-orange-50/90 mt-0.5">
                    Installez l'application sur votre smartphone ou PC
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu du Guide */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Avantages de l'installation */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <div className="p-2">
                  <span className="block text-base">⚡</span>
                  <span className="text-[11px] font-bold text-slate-800">Lancement 1-clic</span>
                  <span className="text-[10px] text-slate-500 block">Depuis l'écran d'accueil</span>
                </div>
                <div className="p-2 border-x border-slate-200">
                  <span className="block text-base">📶</span>
                  <span className="text-[11px] font-bold text-slate-800">Mode Hors-ligne</span>
                  <span className="text-[10px] text-slate-500 block">Reçu & fiches sauvegardés</span>
                </div>
                <div className="p-2">
                  <span className="block text-base">🚀</span>
                  <span className="text-[11px] font-bold text-slate-800">Plein écran</span>
                  <span className="text-[10px] text-slate-500 block">Sans barre d'adresse</span>
                </div>
              </div>

              {isIOS ? (
                /* Instructions spécifiques pour iPhone / iPad Safari */
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                    <Share className="w-4 h-4 text-amber-700" />
                    <span>Instructions pour iPhone / iPad (Safari)</span>
                  </div>

                  <ol className="space-y-3 text-xs text-slate-700 pl-1">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        Appuyez sur le bouton <strong>Partager</strong> <Share className="w-3.5 h-3.5 inline text-sky-600 mx-1" /> situé dans la barre en bas de votre écran Safari.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        Faites défiler le menu vers le bas et touchez <strong className="text-slate-900">« Sur l'écran d'accueil »</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-1" />.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        Touchez <strong className="text-orange-600">« Ajouter »</strong> en haut à droite. L'icône SERFIG 2027 est désormais installée sur votre iPhone !
                      </div>
                    </li>
                  </ol>
                </div>
              ) : (
                /* Instructions Android Chrome & Ordinateurs */
                <div className="space-y-3">
                  {canInstall && (
                    <button
                      onClick={async () => {
                        const success = await installApp();
                        if (success) {
                          setShowGuideModal(false);
                        }
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>Installer automatiquement maintenant</span>
                    </button>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-orange-600" />
                      <span>Sur Android (Google Chrome / Samsung Internet)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      1. Appuyez sur les trois points verticaux <strong>(⋮)</strong> en haut à droite du navigateur.<br />
                      2. Sélectionnez <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.<br />
                      3. Confirmez pour retrouver l'icône SERFIG 2027 parmi vos applications.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Sur Ordinateur (Chrome / Edge / Brave)</span>
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Cliquez sur la petite icône d'installation <strong>(🖥️ ⊕)</strong> située à droite dans la barre d'adresse du navigateur ou dans le menu principal <strong>(⋮)</strong> &gt; <strong>« Installer SERFIG 2027 »</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton fermer */}
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
