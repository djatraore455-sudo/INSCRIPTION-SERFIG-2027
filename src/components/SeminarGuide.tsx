import React, { useState } from 'react';
import { SeminarConfig } from '../types';
import { SEMINAR_GUIDE_ITEMS, FAQ_ITEMS } from '../data/initialData';
import { CheckCircle2, Shield, HeartHandshake, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SeminarGuideProps {
  config: SeminarConfig;
}

export const SeminarGuide: React.FC<SeminarGuideProps> = ({ config }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <section id="guide" className="py-16 sm:py-24 bg-slate-50 text-slate-800 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Conseils & Pratique
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            Guide du Séminariste & Trousseau
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Pour passer un excellent séminaire et profiter pleinement de chaque instant spirituel, voici les éléments indispensables à apporter et les consignes à observer.
          </p>
        </div>

        {/* 3 Guide Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SEMINAR_GUIDE_ITEMS.map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  {idx === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : idx === 1 ? <Shield className="w-5 h-5 text-emerald-700" /> : <HeartHandshake className="w-5 h-5 text-emerald-700" />}
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {item.category}
                </h3>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 flex-1">
                {item.items.map((sub, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold mt-0.5">•</span>
                    <span>{sub}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Questions Fréquentes
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-2">
              Tout ce que vous devez savoir
            </h3>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
