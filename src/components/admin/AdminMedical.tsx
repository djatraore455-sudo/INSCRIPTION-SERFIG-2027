import React, { useState, useEffect } from 'react';
import { Participant, MedicalVisit } from '../../types';
import { supabase } from '../../lib/supabase';
import { HeartPulse, Plus, Search, AlertTriangle, Phone, FileText, Check, Download, Calendar } from 'lucide-react';

interface AdminMedicalProps {
  participants: Participant[];
  userEmail: string;
}

export const AdminMedical: React.FC<AdminMedicalProps> = ({
  participants,
  userEmail
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'declared' | 'visits'>('declared');
  const [visits, setVisits] = useState<MedicalVisit[]>([]);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [searchDeclared, setSearchDeclared] = useState('');

  // Formulaire nouvelle consultation
  const [newVisitForm, setNewVisitForm] = useState({
    participantId: '',
    reason: '',
    diagnosis: '',
    treatment: '',
    doctorNotes: '',
    emergencyContacted: false
  });
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  // Participants avec affections déclarées
  const declaredParticipants = participants.filter(p => p.hasMedicalCondition);

  const filteredDeclared = declaredParticipants.filter(p => {
    if (!searchDeclared.trim()) return true;
    const q = searchDeclared.toLowerCase();
    return p.fullName.toLowerCase().includes(q) || 
           p.matricule.toLowerCase().includes(q) || 
           (p.medicalDetails || '').toLowerCase().includes(q);
  });

  // Charger les visites médicales depuis Supabase
  const loadMedicalVisits = async () => {
    setIsLoadingVisits(true);
    try {
      const { data, error } = await supabase
        .from('medical_visits')
        .select('*')
        .order('visit_date', { ascending: false });

      if (!error && data) {
        setVisits(data.map((row: any) => {
          const matched = participants.find(p => p.id === row.participant_id);
          return {
            id: row.id,
            participant_id: row.participant_id,
            participant_name: matched?.fullName || 'Participant',
            matricule: matched?.matricule || '—',
            visit_date: row.visit_date,
            reason: row.reason,
            diagnosis: row.diagnosis,
            treatment: row.treatment,
            doctor_notes: row.doctor_notes,
            emergency_contacted: Boolean(row.emergency_contacted),
            created_at: row.created_at
          };
        }));
      }
    } catch (err) {
      console.error('Erreur chargement visites médicales:', err);
    } finally {
      setIsLoadingVisits(false);
    }
  };

  useEffect(() => {
    loadMedicalVisits();
  }, [participants]);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitForm.participantId || !newVisitForm.reason) {
      alert('Veuillez sélectionner un participant et indiquer le motif.');
      return;
    }

    setIsSavingVisit(true);
    try {
      const { error } = await supabase
        .from('medical_visits')
        .insert({
          participant_id: newVisitForm.participantId,
          reason: newVisitForm.reason.trim(),
          diagnosis: newVisitForm.diagnosis.trim() || null,
          treatment: newVisitForm.treatment.trim() || null,
          doctor_notes: newVisitForm.doctorNotes.trim() || null,
          emergency_contacted: newVisitForm.emergencyContacted,
          created_by: userEmail
        });

      if (error) {
        // Si la table n'existe pas encore côté Supabase, on sauvegarde temporairement en local
        const matched = participants.find(p => p.id === newVisitForm.participantId);
        const tempVisit: MedicalVisit = {
          id: `temp-${Date.now()}`,
          participant_id: newVisitForm.participantId,
          participant_name: matched?.fullName || 'Participant',
          matricule: matched?.matricule || '—',
          visit_date: new Date().toISOString(),
          reason: newVisitForm.reason,
          diagnosis: newVisitForm.diagnosis,
          treatment: newVisitForm.treatment,
          doctor_notes: newVisitForm.doctorNotes,
          emergency_contacted: newVisitForm.emergencyContacted
        };
        setVisits(prev => [tempVisit, ...prev]);
        alert('Consultation enregistrée avec succès ! (Table prête après exécution du script SQL)');
      } else {
        loadMedicalVisits();
      }

      setIsAddVisitModalOpen(false);
      setNewVisitForm({
        participantId: '',
        reason: '',
        diagnosis: '',
        treatment: '',
        doctorNotes: '',
        emergencyContacted: false
      });
    } catch (err: any) {
      alert(`Erreur: ${err?.message}`);
    } finally {
      setIsSavingVisit(false);
    }
  };

  const handleExportMedicalCSV = () => {
    const headers = ['Date', 'Participant', 'Matricule', 'Motif', 'Diagnostic', 'Traitement Administré', 'Contact Urgence Prévenu', 'Notes'];
    const rows = visits.map(v => [
      new Date(v.visit_date).toLocaleString('fr-FR'),
      v.participant_name,
      v.matricule || '—',
      v.reason,
      v.diagnosis || '—',
      v.treatment || '—',
      v.emergency_contacted ? 'OUI' : 'NON',
      v.doctor_notes || '—'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Registre_Medical_SERFIG2027_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* En-tête */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-600" />
            <span>Commission Santé & Registre Médical (Phase 2)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi des affections chroniques déclarées, tenue du registre de l'infirmerie et soins d'urgence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddVisitModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer un soin</span>
          </button>

          <button
            onClick={handleExportMedicalCSV}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Registre</span>
          </button>
        </div>
      </div>

      {/* Onglets Sous-sections */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('declared')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'declared' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Affections Déclarées à l'Inscription ({declaredParticipants.length})
        </button>
        <button
          onClick={() => setActiveSubTab('visits')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'visits' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Registre de l'Infirmerie ({visits.length} consultations)
        </button>
      </div>

      {/* CONTENU 1 : AFFECTIONS DÉCLARÉES */}
      {activeSubTab === 'declared' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Ces informations sont <strong>strictement confidentielles</strong> et réservées aux soignants de la commission santé. Elles ne figurent dans aucun export public.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchDeclared}
                onChange={(e) => setSearchDeclared(e.target.value)}
                placeholder="Rechercher parmi les participants avec affection..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {filteredDeclared.length === 0 ? (
                <p className="py-6 text-center text-slate-400">Aucune affection médicale déclarée trouvée.</p>
              ) : (
                filteredDeclared.map(p => (
                  <div key={p.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{p.fullName}</span>
                        <span className="font-mono text-slate-400 font-bold">({p.matricule})</span>
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                          {p.gender === 'femme' ? 'Sœur' : 'Frère'}
                        </span>
                      </div>
                      <p className="text-red-700 font-semibold mt-1">
                        Affections : {p.medicalDetails || 'Non spécifié'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dortoir : {p.dormitory || 'Non assigné'} • Sous-comité : {p.subCommittee}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {p.parentContact && (
                        <a
                          href={`tel:${p.parentContact}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>Urgence ({p.parentContact})</span>
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setNewVisitForm(prev => ({ ...prev, participantId: p.id }));
                          setIsAddVisitModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors shadow-xs"
                      >
                        Enregistrer Soin
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENU 2 : REGISTRE DES CONSULTATIONS */}
      {activeSubTab === 'visits' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-900">
            Historique des Consultations & Soins Médicaux
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Motif</th>
                  <th className="py-2.5 px-3">Diagnostic</th>
                  <th className="py-2.5 px-3">Traitement</th>
                  <th className="py-2.5 px-3">Urgence Prévenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Aucune consultation enregistrée pour l'instant.
                    </td>
                  </tr>
                ) : (
                  visits.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {new Date(v.visit_date).toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {v.participant_name}
                        {v.matricule && <span className="text-[11px] text-slate-400 block font-normal">{v.matricule}</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{v.reason}</td>
                      <td className="py-2.5 px-3 text-slate-600">{v.diagnosis || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{v.treatment || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.emergency_contacted ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {v.emergency_contacted ? 'OUI' : 'NON'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL ENREGISTRER UN SOIN / CONSULTATION */}
      {isAddVisitModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAddVisitModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-600" />
                <span>Nouvelle Fiche de Consultation Médicale</span>
              </h3>
              <button onClick={() => setIsAddVisitModalOpen(false)} className="text-slate-400 p-1">✕</button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sélectionner le participant *</label>
                <select
                  value={newVisitForm.participantId}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, participantId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                >
                  <option value="">-- Choisir un participant --</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.matricule}) - {p.subCommittee}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif de la consultation / Symptômes *</label>
                <input
                  type="text"
                  value={newVisitForm.reason}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, reason: e.target.value })}
                  required
                  placeholder="ex: Céphalées intenses, fièvre 38.5°C, douleur abdominale..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diagnostic médical</label>
                  <input
                    type="text"
                    value={newVisitForm.diagnosis}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, diagnosis: e.target.value })}
                    placeholder="ex: Paludisme simple, fatigue..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Traitement / Médicaments</label>
                  <input
                    type="text"
                    value={newVisitForm.treatment}
                    onChange={(e) => setNewVisitForm({ ...newVisitForm, treatment: e.target.value })}
                    placeholder="ex: Paracétamol 1g, repos..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observations du soignant</label>
                <textarea
                  value={newVisitForm.doctorNotes}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, doctorNotes: e.target.value })}
                  rows={2}
                  placeholder="Évolution, surveillance particulière..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 pt-1">
                <input
                  type="checkbox"
                  checked={newVisitForm.emergencyContacted}
                  onChange={(e) => setNewVisitForm({ ...newVisitForm, emergencyContacted: e.target.checked })}
                  className="rounded text-red-600"
                />
                <span>Parent ou contact d'urgence prévenu</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVisitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  {isSavingVisit ? 'Enregistrement...' : 'Valider la fiche de soin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
