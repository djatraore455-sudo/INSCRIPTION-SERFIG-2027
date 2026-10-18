import React, { useState } from 'react';
import { DaySchedule, SeminarConfig } from '../types';
import { getSchedule } from '../services/storage';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';

interface ScheduleSectionProps {
  config: SeminarConfig;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({ config }) => {
  const schedule: DaySchedule[] = getSchedule();
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const activeDay = schedule[activeDayIndex] || schedule[0];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'priere':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'cours':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'atelier':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'conference':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'repas':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'sport':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <section id="programme" className="py-16 sm:py-24 bg-slate-50 text-slate-800 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Emploi du Temps
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            Programme des 7 Jours de Formation
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            Un rythme soutenu et équilibré alternant prières en congrégation, enseignements théoriques, ateliers pratiques, activités sportives et fraternité.
          </p>
        </div>

        {/* Day Selector Pills */}
        <div className="mt-10 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {schedule.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDayIndex(idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col items-center min-w-[100px] ${
                activeDayIndex === idx
                  ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-800/20 scale-105'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="text-[10px] uppercase opacity-80">Jour {day.dayNumber}</span>
              <span className="font-extrabold">{day.dayName.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Active Day Detail Card */}
        <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-xs font-black uppercase">
                  Jour {activeDay.dayNumber}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {activeDay.dayName}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                {activeDay.theme}
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              📍 {config.location.venue}
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 space-y-4">
            {activeDay.items.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-24 shrink-0 font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md text-center border border-emerald-200">
                    {item.time}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {item.title}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getCategoryBadge(item.category)}`}>
                        {item.category}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 mt-1">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                      {item.speaker && (
                        <span className="flex items-center gap-1 font-semibold text-blue-700">
                          <User className="w-3.5 h-3.5" />
                          <span>{item.speaker}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
