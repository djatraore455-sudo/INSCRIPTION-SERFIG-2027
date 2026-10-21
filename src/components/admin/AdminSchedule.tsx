import React, { useState, useEffect } from 'react';
import { SeminarConfig, ScheduleItem } from '../../types';
import { supabase } from '../../lib/supabase';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  QrCode, 
  Trash2, 
  Edit3, 
  Check, 
  ArrowRight,
  BookOpen,
  Coffee,
  Sparkles
} from 'lucide-react';

interface AdminScheduleProps {
  config: SeminarConfig;
  onLaunchCheckinForSession: (sessionKey: string) => void;
  userEmail: string;
}

interface ScheduleEntry {
  id: string;
  day_date: string;
  day_title: string;
  time_start: string;
  time_end: string;
  title: string;
  speaker?: string;
  venue?: string;
  category: 'cours' | 'repas' | 'priere' | 'conference' | 'atelier' | 'ceremonie';
  session_key?: string;
}

export const AdminSchedule: React.FC<AdminScheduleProps> = ({
  config,
  onLaunchCheckinForSession,
  userEmail
}) => {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Formulaire nouvelle session
  const [newSessionForm, setNewSessionForm] = useState({
    day_date: '2027-04-17',
    day_title: 'Samedi 17 Avril 2027',
    time_start: '08:30',
    time_end: '10:00',
    title: '',
    speaker: '',
    venue: 'Grande Salle de Conférence',
    category: 'cours' as ScheduleEntry['category'],
    session_key: 'cours:2027-04-17'
  });

  // Charger le programme
  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seminar_schedule')
        .select('*')
        .order('day_date', { ascending: true })
        .order('time_start', { ascending: true });

      if (!error && data && data.length > 0) {
        setEntries(data);
      } else {
        // Fallback avec le programme standard SERFIG
        const defaultSchedule: ScheduleEntry[] = [
          {
            id: 's-1',
            day_date: '2027-04-17',
            day_title: 'Samedi 17 Avril 2027',
            time_start: '08:00',
            time_end: '12:00',
            title: 'Accueil & Enregistrement des délégations',
            speaker: 'Commission Accueil & Orientation',
            venue: 'Portail Principal / Hall d\'accueil',
            category: 'ceremonie',
            session_key: 'arrivee'
          },
          {
            id: 's-2',
            day_date: '2027-04-17',
            day_title: 'Samedi 17 Avril 2027',
            time_start: '12:30',
            time_end: '14:00',
            title: 'Déjeuner de Bienvenue',
            speaker: 'Commission Restauration',
            venue: 'Réfectoire Principal',
            category: 'repas',
            session_key: 'repas:2027-04-17:lunch'
          },
          {
            id: 's-3',
            day_date: '2027-04-17',
            day_title: 'Samedi 17 Avril 2027',
            time_start: '15:30',
            time_end: '17:30',
            title: 'Cérémonie Officielle d\'Ouverture du SERFIG 2027',
            speaker: 'Bureau Exécutif Régional & Invités d\'honneur',
            venue: 'Amphithéâtre',
            category: 'ceremonie',
            session_key: 'cours:2027-04-17'
          },
          {
            id: 's-4',
            day_date: '2027-04-18',
            day_title: 'Dimanche 18 Avril 2027',
            time_start: '07:00',
            time_end: '08:00',
            title: 'Petit-déjeuner des séminaristes',
            speaker: 'Commission Restauration',
            venue: 'Réfectoire Principal',
            category: 'repas',
            session_key: 'repas:2027-04-18:breakfast'
          },
          {
            id: 's-5',
            day_date: '2027-04-18',
            day_title: 'Dimanche 18 Avril 2027',
            time_start: '08:30',
            time_end: '10:30',
            title: 'Cours Inaugural : Science, Foi et Engagement Citoyen',
            speaker: 'Dr. Oustaz Cissé',
            venue: 'Salle 1 & 2',
            category: 'cours',
            session_key: 'cours:2027-04-18'
          },
          {
            id: 's-6',
            day_date: '2027-04-18',
            day_title: 'Dimanche 18 Avril 2027',
            time_start: '13:00',
            time_end: '14:30',
            title: 'Déjeuner',
            speaker: 'Commission Restauration',
            venue: 'Réfectoire Principal',
            category: 'repas',
            session_key: 'repas:2027-04-18:lunch'
          },
          {
            id: 's-7',
            day_date: '2027-04-18',
            day_title: 'Dimanche 18 Avril 2027',
            time_start: '20:00',
            time_end: '21:30',
            title: 'Dîner & Causerie fraternelle',
            speaker: 'Encadreurs',
            venue: 'Cour Centrale',
            category: 'repas',
            session_key: 'repas:2027-04-18:dinner'
          }
        ];
        setEntries(defaultSchedule);
      }
    } catch (err) {
      console.error('Erreur chargement programme:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionForm.title.trim()) return;

    const newEntry: ScheduleEntry = {
      id: `s-${Date.now()}`,
      day_date: newSessionForm.day_date,
      day_title: newSessionForm.day_title,
      time_start: newSessionForm.time_start,
      time_end: newSessionForm.time_end,
      title: newSessionForm.title.trim(),
      speaker: newSessionForm.speaker.trim() || undefined,
      venue: newSessionForm.venue.trim() || undefined,
      category: newSessionForm.category,
      session_key: newSessionForm.session_key.trim() || undefined
    };

    try {
      await supabase.from('seminar_schedule').insert([newEntry]);
    } catch {
      // Local addition
    }

    setEntries(prev => [...prev, newEntry]);
    setIsAddModalOpen(false);
    setNewSessionForm({
      day_date: '2027-04-17',
      day_title: 'Samedi 17 Avril 2027',
      time_start: '08:30',
      time_end: '10:00',
      title: '',
      speaker: '',
      venue: 'Grande Salle de Conférence',
      category: 'cours',
      session_key: 'cours:2027-04-17'
    });
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Supprimer cette session du programme ?')) return;
    try {
      await supabase.from('seminar_schedule').delete().eq('id', id);
    } catch {}
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const filteredEntries = entries.filter(e => {
    if (selectedDay === 'all') return true;
    return e.day_date === selectedDay;
  });

  const uniqueDays = Array.from(new Set(entries.map(e => e.day_date))).sort();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Programme Officiel du Séminaire (Phase 2)</h2>
            <p className="text-xs text-slate-500">
              Planning interactif des cours, conférences et repas avec liaison directe au pointage QR
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter une Session</span>
        </button>
      </div>

      {/* Filtres par jour */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDay('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
            selectedDay === 'all'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Tous les jours ({entries.length})
        </button>
        {uniqueDays.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              selectedDay === day
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Liste des sessions */}
      <div className="space-y-3">
        {filteredEntries.map(session => (
          <div
            key={session.id}
            className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs hover:border-orange-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-18 text-center shrink-0 p-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-black text-orange-600 block">{session.time_start}</span>
                <span className="text-[10px] text-slate-400 block">{session.time_end}</span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm">{session.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    session.category === 'repas' ? 'bg-amber-100 text-amber-800' :
                    session.category === 'cours' ? 'bg-blue-100 text-blue-800' :
                    session.category === 'priere' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {session.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                  {session.speaker && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {session.speaker}
                    </span>
                  )}
                  {session.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {session.venue}
                    </span>
                  )}
                  {session.session_key && (
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      Clé: {session.session_key}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions : Pointer & Supprimer */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {session.session_key && (
                <button
                  onClick={() => onLaunchCheckinForSession(session.session_key!)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Ouvrir le scanner QR avec cette session sélectionnée"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Pointer Session</span>
                </button>
              )}
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Supprimer la session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout Session */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Ajouter une Session au Programme</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Titre de l'activité / cours *</label>
                <input
                  type="text"
                  required
                  value={newSessionForm.title}
                  onChange={e => setNewSessionForm({ ...newSessionForm, title: e.target.value })}
                  placeholder="ex: Atelier Pratique : Gestion du Temps du Croyant"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date (AAAA-MM-JJ)</label>
                  <input
                    type="date"
                    required
                    value={newSessionForm.day_date}
                    onChange={e => setNewSessionForm({ ...newSessionForm, day_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newSessionForm.category}
                    onChange={e => setNewSessionForm({ ...newSessionForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="cours">Cours / Enseignement</option>
                    <option value="repas">Repas / Restauration</option>
                    <option value="conference">Conférence</option>
                    <option value="priere">Prière & Spiritualité</option>
                    <option value="atelier">Atelier pratique</option>
                    <option value="ceremonie">Cérémonie officielle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure Début</label>
                  <input
                    type="time"
                    required
                    value={newSessionForm.time_start}
                    onChange={e => setNewSessionForm({ ...newSessionForm, time_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Heure Fin</label>
                  <input
                    type="time"
                    required
                    value={newSessionForm.time_end}
                    onChange={e => setNewSessionForm({ ...newSessionForm, time_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Intervenant / Responsable</label>
                  <input
                    type="text"
                    value={newSessionForm.speaker}
                    onChange={e => setNewSessionForm({ ...newSessionForm, speaker: e.target.value })}
                    placeholder="ex: Oustaz Bakayoko"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lieu / Salle</label>
                  <input
                    type="text"
                    value={newSessionForm.venue}
                    onChange={e => setNewSessionForm({ ...newSessionForm, venue: e.target.value })}
                    placeholder="ex: Amphithéâtre"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clé de Pointage QR (session_key)</label>
                <input
                  type="text"
                  value={newSessionForm.session_key}
                  onChange={e => setNewSessionForm({ ...newSessionForm, session_key: e.target.value })}
                  placeholder="ex: cours:2027-04-18 ou repas:2027-04-18:lunch"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Permet de valider la présence spécifiquement pour cette activité.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
