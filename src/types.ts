export type ParticipantType = 'seminariste' | 'formateur' | 'commission';

export type PaymentStatus = 'paye' | 'en_attente' | 'gratuit';

export type PaymentMethod = 'Wave' | 'Orange Money' | 'MTN MoMo' | 'Moov Money' | 'Espèces sur place';

export interface SubCommitteeConfig {
  id: string;
  name: string;
  fee: number;
  isPopular?: boolean;
  contactPerson?: string;
  contactPhone?: string;
}

export interface SeminarConfig {
  id: string;
  code: string; // e.g. "SERFIG_2027" or "SEFIHA_2026"
  editionName: string; // e.g. "SERFIG 2027"
  editionNumber: string; // e.g. "7ème Édition"
  acronym: string; // "SERFIG"
  fullTitle: string; // "Séminaire Régional de Formation Islamique du Gontougo"
  region: string; // "Gôh"
  organizer: string; // "AEEMCI - Secrétariat Régional du Gôh"
  motto: string; // "Science - Foi - Action"
  logoUrl?: string;
  bannerUrl?: string;
  startDate: string; // "2027-04-12"
  endDate: string; // "2027-04-18"
  displayDates: string; // "Du Lundi 12 au Dimanche 18 Avril 2027"
  durationDays: number; // 7
  location: {
    city: string; // "Bondoukou"
    venue: string; // "Lycée Moderne 1 & 2 de Bondoukou"
    region: string; // "Région du Gontougo, Côte d'Ivoire"
  };
  theme: {
    title: string;
    description: string;
    verseArabic?: string;
    verseTranslation?: string;
    verseReference?: string;
  };
  subCommittees: SubCommitteeConfig[];
  poloPrice: number; // 2500 FCFA
  tshirtPrice: number; // 2000 FCFA
  commissionFee: number;
  contacts: {
    primaryPhone: string;
    secondaryPhone: string;
    phone3?: string;
    whatsapp: string;
    emergencyPhone?: string;
    email: string;
    address: string;
  };
  paymentNumbers: {
    wave: string;
    orangeMoney: string;
    mtnMoMo: string;
    moovMoney: string;
    recipientName: string;
  };
  stats: {
    expectedParticipants: number;
    capacity: number;
  };
}

export interface Participant {
  id: string;
  matricule: string;
  type: ParticipantType;
  fullName: string;
  gender: 'homme' | 'femme';
  phone: string;
  whatsapp: string;
  email?: string;
  subCommittee: string;
  schoolLevel?: string; // 'Collège' | 'Lycée' | 'Université' | 'Autre'
  schoolName?: string;
  birthDate?: string; // Format ISO: AAAA-MM-JJ
  parentName?: string;
  parentContact?: string;
  hasMedicalCondition?: boolean;
  medicalDetails?: string;
  dormitory?: string;
  transportMode?: string;
  photoUrl?: string;
  receiptNumber?: string;
  clothingType?: 'aucun' | 'polo' | 'tshirt';
  hasPolo: boolean;
  poloSize?: 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  poloColor?: string;
  clothingFee?: number;
  
  // Specific for formateurs & aînés
  trainerSubtype?: 'formateur' | 'aine';
  teachingSubject?: string;
  trainerBio?: string;
  trainerTitle?: string;
  availability?: string;
  
  // Specific for commission
  commission?: string;
  commissionRole?: string;
  commissionExperience?: string;
  wavePhoneNumber?: string;
  
  // Finances
  registrationFee: number;
  poloFee: number;
  totalFee: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  
  // Attendance & Check-in
  checkedIn: boolean;
  checkedInAt?: string;
  
  // Course attendance validation
  courseAttendance?: {
    validated: boolean;
    validatedAt?: string;
    courseTitle?: string;
    supervisor?: string;
  };
  
  // Meal and Restaurant pass confirmation
  mealAttendance?: {
    breakfast: boolean;
    breakfastAt?: string;
    lunch: boolean;
    lunchAt?: string;
    dinner: boolean;
    dinnerAt?: string;
    lastMealName?: string;
    lastMealAt?: string;
  };
  
  registeredAt: string;
  notes?: string;
}

export interface ScheduleItem {
  time: string;
  title: string;
  category: 'priere' | 'cours' | 'repas' | 'atelier' | 'conference' | 'sport' | 'ceremonie';
  speaker?: string;
  location?: string;
  description?: string;
}

export interface DaySchedule {
  dayNumber: number;
  dayName: string;
  date: string;
  theme: string;
  items: ScheduleItem[];
}

export interface Donation {
  id: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  purpose: string;
  date: string;
  paymentMethod: string;
}
