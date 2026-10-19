import { SeminarConfig, Participant, DaySchedule, Donation } from '../types';
import { SERFIG_2027_CONFIG, SEFIHA_2026_CONFIG, INITIAL_PARTICIPANTS, INITIAL_SCHEDULE } from '../data/initialData';

const CONFIG_KEY = 'aeemci_seminar_active_config_v1';
const PARTICIPANTS_KEY = 'aeemci_seminar_participants_v1';
const SCHEDULE_KEY = 'aeemci_seminar_schedule_v1';
const DONATIONS_KEY = 'aeemci_seminar_donations_v1';

export function getActiveSeminarConfig(): SeminarConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate away if previous cache had old Gontougo region or previous logo or old prices
      if (
        (parsed.region && parsed.region.toLowerCase().includes('gontougo')) ||
        parsed.poloPrice !== 2500 ||
        !parsed.subCommittees?.some((s: any) => s.id === 'sc-tonla')
      ) {
        saveSeminarConfig(SERFIG_2027_CONFIG);
        return SERFIG_2027_CONFIG;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load seminar config from storage', err);
  }
  return SERFIG_2027_CONFIG;
}

export function saveSeminarConfig(config: SeminarConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save seminar config', err);
  }
}

export function resetSeminarConfigToPreset(preset: 'SERFIG_2027' | 'SEFIHA_2026'): SeminarConfig {
  const selected = preset === 'SERFIG_2027' ? SERFIG_2027_CONFIG : SEFIHA_2026_CONFIG;
  saveSeminarConfig(selected);
  return selected;
}

/**
 * Calcule l'âge en années révolues à partir d'une date de naissance au format ISO (AAAA-MM-JJ).
 * Renvoie null si la date est absente ou invalide.
 */
export function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export function getParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Supprime les éventuelles anciennes données de démo enregistrées dans le navigateur
        return parsed.filter(p => !p.id?.startsWith('part-00'));
      }
    }
  } catch (err) {
    console.error('Failed to load participants', err);
  }
  // Ne pré-remplit plus aucune donnée d'exemple en production
  return [];
}

export function saveParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  } catch (err) {
    console.error('Failed to save participants', err);
  }
}

export function generateMatricule(type: 'seminariste' | 'formateur' | 'commission', prefix: string = 'SERFIG27'): string {
  const typeCode = type === 'seminariste' ? 'SEM' : type === 'formateur' ? 'FOR' : 'COM';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${typeCode}-${randomNum}`;
}

export function addParticipant(participantData: Omit<Participant, 'id' | 'matricule' | 'registeredAt' | 'checkedIn'>, config: SeminarConfig): Participant {
  const participants = getParticipants();
  const prefix = config.acronym === 'SEFIHA' ? 'SEFIHA26' : 'SERFIG27';
  const matricule = generateMatricule(participantData.type, prefix);

  const newParticipant: Participant = {
    ...participantData,
    id: 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    matricule,
    receiptNumber: participantData.receiptNumber || undefined,
    dormitory: participantData.dormitory || undefined,
    transportMode: participantData.transportMode || undefined,
    birthDate: participantData.birthDate || undefined,
    parentContact: participantData.parentContact || undefined,
    checkedIn: false,
    courseAttendance: participantData.courseAttendance || {
      validated: false
    },
    mealAttendance: participantData.mealAttendance || {
      breakfast: false,
      lunch: false,
      dinner: false
    },
    registeredAt: new Date().toISOString()
  };

  const updated = [newParticipant, ...participants];
  saveParticipants(updated);
  return newParticipant;
}

export function updateParticipantStatus(id: string, updates: Partial<Participant>): Participant[] {
  const participants = getParticipants();
  const updated = participants.map(p => p.id === id ? { ...p, ...updates } : p);
  saveParticipants(updated);
  return updated;
}

export function toggleMealAttendance(identifier: string, meal: 'breakfast' | 'lunch' | 'dinner'): { success: boolean; participant?: Participant; message: string } {
  const participants = getParticipants();
  const cleanId = identifier.trim().toLowerCase();
  
  const index = participants.findIndex(p => 
    p.id === identifier ||
    p.matricule.toLowerCase() === cleanId ||
    (p.receiptNumber && p.receiptNumber.toLowerCase() === cleanId) ||
    p.phone.replace(/[\s\-\+]/g, '') === cleanId.replace(/[\s\-\+]/g, '')
  );

  if (index === -1) {
    return { success: false, message: 'Aucun participant trouvé pour ce matricule, reçu ou contact.' };
  }

  const p = participants[index];
  const currentMeals = p.mealAttendance || { breakfast: false, lunch: false, dinner: false };
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isNowActive = !currentMeals[meal];
  
  const mealNameFr = meal === 'breakfast' ? 'Petit-déjeuner' : meal === 'lunch' ? 'Déjeuner' : 'Dîner';

  const updatedMeals = {
    ...currentMeals,
    [meal]: isNowActive,
    [`${meal}At`]: isNowActive ? now : undefined,
    lastMealName: isNowActive ? mealNameFr : currentMeals.lastMealName,
    lastMealAt: isNowActive ? now : currentMeals.lastMealAt
  };

  const updatedParticipant = {
    ...p,
    mealAttendance: updatedMeals
  };

  participants[index] = updatedParticipant;
  saveParticipants(participants);

  return {
    success: true,
    participant: updatedParticipant,
    message: isNowActive 
      ? `Repas (${mealNameFr}) validé pour ${p.fullName} à ${now}. Passage restaurant confirmé.`
      : `Repas (${mealNameFr}) annulé pour ${p.fullName}.`
  };
}

export function toggleCourseAttendance(identifier: string): { success: boolean; participant?: Participant; message: string } {
  const participants = getParticipants();
  const cleanId = identifier.trim().toLowerCase();
  
  const index = participants.findIndex(p => 
    p.id === identifier ||
    p.matricule.toLowerCase() === cleanId ||
    (p.receiptNumber && p.receiptNumber.toLowerCase() === cleanId) ||
    p.phone.replace(/[\s\-\+]/g, '') === cleanId.replace(/[\s\-\+]/g, '')
  );

  if (index === -1) {
    return { success: false, message: 'Aucun participant trouvé pour ce matricule, reçu ou contact.' };
  }

  const p = participants[index];
  const current = p.courseAttendance || { validated: false };
  const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const isNowValid = !current.validated;

  const updatedCourse = {
    validated: isNowValid,
    validatedAt: isNowValid ? now : undefined,
    courseTitle: 'Sciences Islamiques & Fiqh — SERFIG 2027',
    supervisor: 'Commission Pédagogique Gôh'
  };

  const updatedParticipant = {
    ...p,
    courseAttendance: updatedCourse
  };

  participants[index] = updatedParticipant;
  saveParticipants(participants);

  return {
    success: true,
    participant: updatedParticipant,
    message: isNowValid
      ? `Présence aux cours validée pour ${p.fullName} à ${now}.`
      : `Présence aux cours annulée pour ${p.fullName}.`
  };
}

export function checkInParticipant(identifier: string): { success: boolean; participant?: Participant; message: string } {
  const participants = getParticipants();
  const cleanId = identifier.trim().toLowerCase();
  
  const found = participants.find(p => 
    p.matricule.toLowerCase() === cleanId || 
    p.phone.replace(/[\s\-\+]/g, '') === cleanId.replace(/[\s\-\+]/g, '') ||
    p.id === identifier
  );

  if (!found) {
    return { success: false, message: 'Aucun participant trouvé avec ce matricule ou numéro.' };
  }

  if (found.checkedIn) {
    return { 
      success: true, 
      participant: found, 
      message: `Ce participant (${found.fullName}) est déjà émargé le ${new Date(found.checkedInAt || '').toLocaleTimeString('fr-FR')}.` 
    };
  }

  const updatedParticipant: Participant = {
    ...found,
    checkedIn: true,
    checkedInAt: new Date().toISOString()
  };

  const updatedList = participants.map(p => p.id === found.id ? updatedParticipant : p);
  saveParticipants(updatedList);

  return {
    success: true,
    participant: updatedParticipant,
    message: `Pointage réussi ! Bienvenue à ${found.fullName} (${found.subCommittee}).`
  };
}

export function deleteParticipant(id: string): Participant[] {
  const participants = getParticipants();
  const updated = participants.filter(p => p.id !== id);
  saveParticipants(updated);
  return updated;
}

export function getSchedule(): DaySchedule[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load schedule', err);
  }
  return INITIAL_SCHEDULE;
}

export function getDonations(): Donation[] {
  try {
    const raw = localStorage.getItem(DONATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(d => d.id !== 'don-1' && d.id !== 'don-2');
      }
    }
  } catch (e) {
    console.error('Failed to load donations', e);
  }
  return [];
}

export function addDonation(donation: Omit<Donation, 'id' | 'date'>): Donation {
  const donations = getDonations();
  const newDonation: Donation = {
    ...donation,
    id: 'don-' + Date.now(),
    date: new Date().toISOString().split('T')[0]
  };
  const updated = [newDonation, ...donations];
  localStorage.setItem(DONATIONS_KEY, JSON.stringify(updated));
  return newDonation;
}

export function exportParticipantsToCSV(participants: Participant[]): void {
  const headers = [
    'Matricule',
    'Nom & Prénom',
    'Type',
    'Genre',
    'Date de Naissance',
    'Âge',
    'Téléphone',
    'WhatsApp',
    'Sous-Comité',
    'Niveau / Établissement',
    'Contact Parent',
    'Dortoir',
    'Mode de Transport',
    'Tenue (Polo / T-shirt)',
    'Taille',
    'Couleur',
    'Frais Inscription (FCFA)',
    'Frais Tenue (FCFA)',
    'Total (FCFA)',
    'Statut Paiement',
    'Moyen Paiement',
    'Référence Paiement',
    'N° Reçu',
    'Émargé / Présent',
    'Date Inscription'
  ];

  const rows = participants.map(p => {
    const ageVal = calculateAge(p.birthDate);
    return [
      `"${p.matricule || '—'}"`,
      `"${p.fullName.replace(/"/g, '""')}"`,
      `"${p.type}"`,
      `"${p.gender}"`,
      `"${p.birthDate || '—'}"`,
      `"${ageVal !== null ? ageVal : '—'}"`,
      `"${p.phone || '—'}"`,
      `"${p.whatsapp || '—'}"`,
      `"${p.subCommittee || '—'}"`,
      `"${(p.schoolLevel || p.teachingSubject || p.commission || '—').replace(/"/g, '""')}"`,
      `"${p.parentContact || '—'}"`,
      `"${p.dormitory || '—'}"`,
      `"${p.transportMode || '—'}"`,
      `"${p.hasPolo ? (p.clothingType === 'tshirt' ? 'T-shirt' : 'Polo') : 'NON'}"`,
      `"${p.poloSize || '—'}"`,
      `"${p.poloColor || '—'}"`,
      p.registrationFee,
      p.poloFee,
      p.totalFee,
      `"${p.paymentStatus}"`,
      `"${p.paymentMethod || '—'}"`,
      `"${p.paymentReference || '—'}"`,
      `"${p.receiptNumber || '—'}"`,
      `"${p.checkedIn ? 'OUI' : 'NON'}"`,
      `"${new Date(p.registeredAt).toLocaleDateString('fr-FR')}"`
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `participants_serfig_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
