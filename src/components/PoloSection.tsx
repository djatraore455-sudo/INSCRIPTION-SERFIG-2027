import React, { useState } from 'react';
import { SeminarConfig } from '../types';
import { Shirt, Check, ShoppingBag, Sparkles } from 'lucide-react';

interface PoloSectionProps {
  config: SeminarConfig;
  onOpenRegister: () => void;
}

export const PoloSection: React.FC<PoloSectionProps> = ({ config, onOpenRegister }) => {
  const [itemType, setItemType] = useState<'polo' | 'tshirt'>('polo');
  const [selectedColor, setSelectedColor] = useState<'Vert' | 'Blanc' | 'Noir'>('Vert');

  return (
    <section id="polo" className="py-16 sm:py-24 bg-slate-50 text-slate-800 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 text-xs font-black uppercase tracking-wider">
            Boutique Officielle du Séminaire
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            Polos & Tee-shirts Officiels
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Portez fièrement les couleurs du {config.editionName} (Région du Gôh) durant le séminaire.
          </p>
        </div>

        {/* 2 Comparison Cards (Polo 2500 F vs Tee-shirt 2000 F) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Polo Officiel 2 500 FCFA */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-orange-500 shadow-xl flex flex-col relative">
            <span className="px-3 py-1 rounded-full bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider w-fit mb-3">
              Recommandé Cérémonies
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Polo Officiel Brodé</h3>
                <p className="text-xs text-slate-500 mt-0.5">Maille piquée 100% coton, col chemise renforcé</p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-orange-600">2 500</span>
                <span className="text-xs font-bold text-slate-400 block">FCFA</span>
              </div>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-emerald-800 text-white flex flex-col items-center justify-center shadow-lg relative border-2 border-white">
                <div className="w-14 h-4 bg-emerald-950 rounded-b-md"></div>
                <Shirt className="w-10 h-10 text-white mt-1" />
                <span className="text-[8px] font-black uppercase text-amber-300 mt-1">SERFIG GÔH</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 mb-6 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Broderie haute définition logo officiel AEEMCI</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Col chemise élégant avec boutons renforcés</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tailles disponibles : S, M, L, XL, 2XL, 3XL</span>
              </li>
            </ul>

            <button
              onClick={onOpenRegister}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Commander le Polo (2 500 F)</span>
            </button>
          </div>

          {/* Card 2: Tee-shirt Simple 2 000 FCFA */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[10px] font-black uppercase tracking-wider w-fit mb-3">
              Formule Économique
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Tee-shirt Simple</h3>
                <p className="text-xs text-slate-500 mt-0.5">Coton peigné doux, col rond confortable</p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">2 000</span>
                <span className="text-xs font-bold text-slate-400 block">FCFA</span>
              </div>
            </div>

            <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <div className="w-28 h-28 rounded-2xl bg-white text-emerald-900 flex flex-col items-center justify-center shadow-lg relative border-2 border-slate-200">
                <div className="w-12 h-2.5 bg-slate-200 rounded-b-md"></div>
                <Shirt className="w-10 h-10 text-emerald-800 mt-2" />
                <span className="text-[8px] font-black uppercase text-orange-600 mt-1">SERFIG GÔH</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 mb-6 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Sérigraphie officielle durable SERFIG 2027</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Idéal pour les ateliers et activités sportives</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Tailles disponibles : S, M, L, XL, 2XL, 3XL</span>
              </li>
            </ul>

            <button
              onClick={onOpenRegister}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Commander le Tee-shirt (2 000 F)</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
