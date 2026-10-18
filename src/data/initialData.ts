import { SeminarConfig, Participant, DaySchedule } from '../types';

export const SERFIG_2027_CONFIG: SeminarConfig = {
  id: 'serfig-2027',
  code: 'SERFIG_2027',
  editionName: 'SERFIG 2027',
  editionNumber: '7ème Édition',
  acronym: 'SERFIG',
  fullTitle: 'Séminaire Régional de Formation Islamique du Gôh',
  region: 'Gôh',
  organizer: "Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI) - Secrétariat Régional du Gôh",
  motto: 'Science - Foi - Action',
  logoUrl: '/src/assets/images/aeemci_official_logo_1792254182659.jpg',
  bannerUrl: '/src/assets/images/serfig_goh_banner_1792249086757.jpg',
  startDate: '2027-04-12',
  endDate: '2027-04-18',
  displayDates: 'Du 12 au 18 Avril 2027',
  durationDays: 7,
  location: {
    city: 'Gagnoa',
    venue: 'Lycée Moderne 1 & 2 de Gagnoa',
    region: 'Région du Gôh (Côte d\'Ivoire)'
  },
  theme: {
    title: 'Jeunesse musulmane et défis contemporains : Enracinement spirituel, excellence académique et leadership vertueux',
    description: 'Une semaine d\'immersion spirituelle, doctrinale et pratique pour doter les élèves et étudiants des compétences religieuses et managériales nécessaires pour impacter positivement la société.',
    verseArabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    verseTranslation: 'Allah élèvera en degrés ceux d\'entre vous qui auront cru et ceux qui auront reçu le savoir.',
    verseReference: 'Sourate Al-Mujadilah (58), Verset 11'
  },
  subCommittees: [
    { id: 'sc-gagnoa', name: 'Sous-Comité Gagnoa', fee: 2000, contactPerson: 'Oustaz Traoré', contactPhone: '+225 07 48 12 34 56' },
    { id: 'sc-guiberoua', name: 'Sous-Comité Guibéroua', fee: 2000, contactPerson: 'Frère Cissé', contactPhone: '+225 07 09 88 77 66' },
    { id: 'sc-oume', name: 'Sous-Comité Oumé', fee: 2000, contactPerson: 'Frère Coulibaly', contactPhone: '+225 05 64 22 11 00' },
    { id: 'sc-bayota', name: 'Sous-Comité Bayota', fee: 2000, contactPerson: 'Frère Sylla', contactPhone: '+225 01 02 03 04 05' },
    { id: 'sc-diegonefla', name: 'Sous-Comité Diégonéfla', fee: 2000, contactPerson: 'Frère Bamba', contactPhone: '+225 05 55 44 33 22' },
    { id: 'sc-ouragahio', name: 'Sous-Comité Ouragahio', fee: 2000, contactPerson: 'Frère Touré', contactPhone: '+225 07 87 65 43 21' },
    { id: 'sc-tonla', name: 'Sous-Comité Tonla', fee: 2000, contactPerson: 'Frère Koné', contactPhone: '+225 07 77 88 99 00' },
    { id: 'sc-lahouda', name: 'Sous-Comité Lahouda', fee: 2000, contactPerson: 'Frère Diaby', contactPhone: '+225 05 44 33 22 11' },
    { id: 'sc-exterieur', name: 'Extérieur & Autres Régions', fee: 2000, contactPerson: 'Secrétariat Régional', contactPhone: '+225 07 08 45 12 30' }
  ],
  poloPrice: 2500,
  tshirtPrice: 2000,
  commissionFee: 2000,
  contacts: {
    primaryPhone: '+225 07 08 45 12 30',
    secondaryPhone: '+225 05 64 03 55 95',
    whatsapp: '+225 07 08 45 12 30',
    email: 'contact@aeemci-goh.org',
    address: 'Siège Régional AEEMCI, Quartier Dioulabougou / Sokoura, Gagnoa'
  },
  paymentNumbers: {
    wave: '+225 07 08 45 12 30',
    orangeMoney: '+225 07 08 45 12 30',
    mtnMoMo: '+225 05 64 03 55 95',
    moovMoney: '+225 01 40 12 34 56',
    recipientName: 'AEEMCI Gôh / SERFIG'
  },
  stats: {
    expectedParticipants: 400,
    capacity: 550
  }
};

export const SEFIHA_2026_CONFIG: SeminarConfig = {
  id: 'sefiha-2026',
  code: 'SEFIHA_2026',
  editionName: 'SEFIHA 2026',
  editionNumber: '6ème Édition',
  acronym: 'SEFIHA',
  fullTitle: 'Séminaire de Formation Islamique du Hambol',
  region: 'Hambol',
  organizer: "Association des Élèves et Étudiants Musulmans de Côte d'Ivoire (AEEMCI) - Secrétariat Régional du Hambol",
  motto: 'Science - Foi - Action',
  logoUrl: '/src/assets/images/aeemci_official_logo_1792254182659.jpg',
  startDate: '2026-04-02',
  endDate: '2026-04-08',
  displayDates: 'Du 02 au 08 Avril 2026',
  durationDays: 7,
  location: {
    city: 'Katiola',
    venue: 'Lycée Moderne Gaston Ouassénan Koné de Katiola',
    region: 'Région du Hambol (Côte d\'Ivoire)'
  },
  theme: {
    title: 'Jeunesse et nouvelles technologies : contribution de l\'AEEMCI dans l\'engagement citoyen pour un meilleur impact des actions sociales',
    description: '7 jours de formation intensive avec des cours approfondis au quotidien : Coran, Sunnah, Fiqh et spiritualité pour un épanouissement complet.',
    verseArabic: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ',
    verseTranslation: 'Allah élèvera en degrés ceux d\'entre vous qui auront cru et ceux qui auront reçu le savoir.',
    verseReference: 'Sourate Al-Mujadilah (58), Verset 11'
  },
  subCommittees: [
    { id: 'sc-katiola', name: 'Sous-Comité Katiola', fee: 1000, contactPerson: 'Frère Coulibaly', contactPhone: '+225 05 64 03 55 95' },
    { id: 'sc-niakara', name: 'Sous-Comité Niakara', fee: 1000, contactPerson: 'Frère Koné', contactPhone: '+225 05 05 75 57 41' },
    { id: 'sc-dabakala', name: 'Sous-Comité Dabakala', fee: 1000, contactPerson: 'Frère Ouattara', contactPhone: '+225 07 47 00 11 22' },
    { id: 'sc-tafire', name: 'Sous-Comité Tafiré', fee: 1000, contactPerson: 'Frère Touré', contactPhone: '+225 05 12 34 56 78' },
    { id: 'sc-tortiya', name: 'Sous-Comité Tortiya', fee: 1000, contactPerson: 'Frère Bamba', contactPhone: '+225 07 88 99 00 11' },
    { id: 'sc-autres', name: 'Extérieur Hambol', fee: 1500, contactPerson: 'Secrétariat Hambol', contactPhone: '+225 05 64 03 55 95' }
  ],
  poloPrice: 2000,
  tshirtPrice: 2000,
  commissionFee: 2000,
  contacts: {
    primaryPhone: '+225 05 64 03 55 95',
    secondaryPhone: '+225 05 05 75 57 41',
    whatsapp: '+225 05 64 03 55 95',
    email: 'contact@aeemci-sefiha.com',
    address: 'Secrétariat Régional AEEMCI Hambol, Katiola'
  },
  paymentNumbers: {
    wave: '+225 05 64 03 55 95',
    orangeMoney: '+225 05 64 03 55 95',
    mtnMoMo: '+225 05 05 75 57 41',
    moovMoney: '+225 01 02 03 04 05',
    recipientName: 'AEEMCI Hambol / SEFIHA'
  },
  stats: {
    expectedParticipants: 450,
    capacity: 600
  }
};

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'part-000',
    matricule: 'SR2025114',
    receiptNumber: '24752',
    type: 'seminariste',
    fullName: 'DOUMBIA ALLASSANE',
    gender: 'homme',
    phone: '05 01 34 52 13',
    whatsapp: '05 01 34 52 13',
    email: 'allassane.doumbia@aeemci.ci',
    subCommittee: 'Sous-Comité Gagnoa',
    schoolLevel: 'Université',
    schoolName: 'Université Alassane Ouattara',
    age: 20,
    parentContact: '01 01 36 23 21',
    dormitory: 'Dortoir SR - Attribution automatique',
    transportMode: 'Transport personnel depuis l\'intérieur',
    clothingType: 'tshirt',
    hasPolo: true,
    poloSize: 'L',
    poloColor: 'Vert Forêt',
    clothingFee: 2000,
    registrationFee: 2000,
    poloFee: 2000,
    totalFee: 4000,
    paymentStatus: 'paye',
    paymentMethod: 'Wave',
    paymentReference: 'WAVE-REC-24752',
    checkedIn: true,
    checkedInAt: '2027-04-12T08:00:00Z',
    courseAttendance: {
      validated: true,
      validatedAt: '08:45',
      courseTitle: 'Sciences Islamiques & Fiqh — SERFIG 2027',
      supervisor: 'Commission Pédagogique Gôh'
    },
    mealAttendance: {
      breakfast: true,
      breakfastAt: '07:30',
      lunch: true,
      lunchAt: '13:10',
      dinner: false,
      lastMealName: 'Déjeuner',
      lastMealAt: '13:10'
    },
    registeredAt: '2025-07-28T09:15:00Z',
    notes: 'Reçu officiel SENAFOI/SERFIG N° 24752 - Secrétariat Régional'
  },
  {
    id: 'part-001',
    matricule: 'SERFIG27-SEM-1042',
    receiptNumber: '24753',
    type: 'seminariste',
    fullName: 'Traoré Ibrahim Kalil',
    gender: 'homme',
    phone: '+225 07 48 11 22 33',
    whatsapp: '+225 07 48 11 22 33',
    email: 'ibrahim.traore@gmail.com',
    subCommittee: 'Sous-Comité Gagnoa',
    schoolLevel: 'Lycée (Terminale D)',
    schoolName: 'Lycée Moderne 1 Gagnoa',
    age: 18,
    parentContact: '+225 07 08 45 12 30',
    dormitory: 'Dortoir Frères A - Salle 3',
    transportMode: 'Convoi Sous-comité Gagnoa',
    clothingType: 'polo',
    hasPolo: true,
    poloSize: 'L',
    poloColor: 'Vert Forêt',
    registrationFee: 2000,
    poloFee: 2500,
    totalFee: 4500,
    paymentStatus: 'paye',
    paymentMethod: 'Wave',
    paymentReference: 'WAVE-TX-984120',
    checkedIn: true,
    checkedInAt: '2027-04-12T08:15:00Z',
    courseAttendance: {
      validated: true,
      validatedAt: '09:00',
      courseTitle: 'Fiqh & Dogme Islamique',
      supervisor: 'Commission Pédagogique'
    },
    mealAttendance: {
      breakfast: true,
      breakfastAt: '07:45',
      lunch: true,
      lunchAt: '13:20',
      dinner: false,
      lastMealName: 'Déjeuner',
      lastMealAt: '13:20'
    },
    registeredAt: '2027-03-25T14:20:00Z',
    notes: 'Hébergé dortoir A1 - Frères'
  },
  {
    id: 'part-002',
    matricule: 'SERFIG27-SEM-1043',
    type: 'seminariste',
    fullName: 'Koné Aminata',
    gender: 'femme',
    phone: '+225 05 64 77 88 99',
    whatsapp: '+225 05 64 77 88 99',
    email: 'aminata.kone@outlook.com',
    subCommittee: 'Sous-Comité Oumé',
    schoolLevel: 'Lycée (Première A)',
    schoolName: 'Lycée Moderne d\'Oumé',
    clothingType: 'polo',
    hasPolo: true,
    poloSize: 'M',
    poloColor: 'Blanc Col Vert',
    registrationFee: 2000,
    poloFee: 2500,
    totalFee: 4500,
    paymentStatus: 'paye',
    paymentMethod: 'Orange Money',
    paymentReference: 'OM-CI-847291',
    checkedIn: true,
    checkedInAt: '2027-04-12T08:30:00Z',
    registeredAt: '2027-03-26T10:12:00Z',
    notes: 'Dortoir Sœurs B2'
  },
  {
    id: 'part-003',
    matricule: 'SERFIG27-SEM-1044',
    type: 'seminariste',
    fullName: 'Cissé Abdoul Karim',
    gender: 'homme',
    phone: '+225 01 40 55 66 77',
    whatsapp: '+225 01 40 55 66 77',
    subCommittee: 'Sous-Comité Guibéroua',
    schoolLevel: 'Université (Licence 2 Sciences Eco)',
    schoolName: 'Université Péléforo Gon Coulibaly',
    clothingType: 'aucun',
    hasPolo: false,
    registrationFee: 2000,
    poloFee: 0,
    totalFee: 2000,
    paymentStatus: 'en_attente',
    paymentMethod: 'Espèces sur place',
    checkedIn: false,
    registeredAt: '2027-03-28T16:45:00Z'
  },
  {
    id: 'part-004',
    matricule: 'SERFIG27-FOR-0201',
    type: 'formateur',
    fullName: 'Oustaz Touré Souleymane',
    gender: 'homme',
    phone: '+225 07 09 33 44 55',
    whatsapp: '+225 07 09 33 44 55',
    email: 'souleymane.toure@aeemci.org',
    subCommittee: 'Sous-Comité Gagnoa',
    teachingSubject: 'Fiqh des Adorations & Tajweed Pratique',
    trainerBio: 'Diplômé en Sciences Islamiques, Formateur Régional AEEMCI Gôh',
    hasPolo: true,
    poloSize: 'XL',
    poloColor: 'Vert Forêt',
    registrationFee: 0,
    poloFee: 0,
    totalFee: 0,
    paymentStatus: 'gratuit',
    checkedIn: true,
    checkedInAt: '2027-04-12T07:45:00Z',
    registeredAt: '2027-03-15T09:00:00Z',
    notes: 'Intervenant principal matinée'
  },
  {
    id: 'part-005',
    matricule: 'SERFIG27-COM-0301',
    type: 'commission',
    fullName: 'Bamba Mariam',
    gender: 'femme',
    phone: '+225 05 55 12 34 89',
    whatsapp: '+225 05 55 12 34 89',
    email: 'mariam.bamba@gmail.com',
    subCommittee: 'Sous-Comité Diégonéfla',
    commission: 'Santé & Premiers Secours',
    commissionRole: 'Responsable Adjointe',
    hasPolo: true,
    poloSize: 'L',
    poloColor: 'Vert Forêt',
    registrationFee: 2000,
    poloFee: 0,
    totalFee: 2000,
    paymentStatus: 'paye',
    paymentMethod: 'Wave',
    paymentReference: 'WAVE-COM-11029',
    checkedIn: true,
    checkedInAt: '2027-04-11T16:00:00Z',
    registeredAt: '2027-03-20T11:30:00Z',
    notes: 'Permanence infirmerie du séminaire'
  },
  {
    id: 'part-006',
    matricule: 'SERFIG27-COM-0302',
    type: 'commission',
    fullName: 'Sylla Moussa',
    gender: 'homme',
    phone: '+225 07 87 23 45 67',
    whatsapp: '+225 07 87 23 45 67',
    subCommittee: 'Sous-Comité Ouragahio',
    commission: 'Sécurité & Discipline',
    commissionRole: 'Chef d\'équipe de garde',
    hasPolo: true,
    poloSize: '2XL',
    poloColor: 'Noir',
    registrationFee: 2000,
    poloFee: 0,
    totalFee: 2000,
    paymentStatus: 'paye',
    paymentMethod: 'MTN MoMo',
    paymentReference: 'MTN-CI-665123',
    checkedIn: true,
    checkedInAt: '2027-04-11T15:00:00Z',
    registeredAt: '2027-03-21T08:15:00Z'
  },
  {
    id: 'part-007',
    matricule: 'SERFIG27-SEM-1045',
    type: 'seminariste',
    fullName: 'Diaby Fatoumata Zahra',
    gender: 'femme',
    phone: '+225 05 06 14 25 36',
    whatsapp: '+225 05 06 14 25 36',
    email: 'zahra.diaby@gmail.com',
    subCommittee: 'Sous-Comité Bayota',
    schoolLevel: 'Collège (Troisième)',
    schoolName: 'Collège Moderne de Bayota',
    hasPolo: true,
    poloSize: 'S',
    poloColor: 'Blanc Col Vert',
    registrationFee: 1500,
    poloFee: 2000,
    totalFee: 3500,
    paymentStatus: 'paye',
    paymentMethod: 'Wave',
    paymentReference: 'WAVE-TX-334901',
    checkedIn: false,
    registeredAt: '2027-03-29T12:00:00Z'
  }
];

export const INITIAL_SCHEDULE: DaySchedule[] = [
  {
    dayNumber: 1,
    dayName: 'Lundi 12 Avril 2027',
    date: '2027-04-12',
    theme: 'Accueil, Installation & Cérémonie d\'Ouverture',
    items: [
      { time: '08h00 - 12h00', title: 'Accueil des délégations et pointage des séminaristes', category: 'ceremonie', location: 'Hall Principal - Lycée Moderne Gagnoa', description: 'Vérification des inscriptions, remise des kits, badges et attribution des dortoirs' },
      { time: '13h00 - 14h30', title: 'Prière de Dhohr & Déjeuner fraternel', category: 'repas', location: 'Réfectoire du Séminaire' },
      { time: '15h00 - 17h00', title: 'Cérémonie Officielle d\'Ouverture du SERFIG 2027', category: 'ceremonie', location: 'Grande Salle des Fêtes', description: 'Allocutions des autorités administratives de la Région du Gôh, guides religieux et présentation du Secrétariat Régional AEEMCI' },
      { time: '18h30 - 20h00', title: 'Prière de Maghrib, Isha & Repas du soir', category: 'priere', location: 'Mosquée du Campus' },
      { time: '20h30 - 22h00', title: 'Séance de cadrage, consignes de vie et charte du séminariste', category: 'atelier', location: 'Grande Salle' }
    ]
  },
  {
    dayNumber: 2,
    dayName: 'Mardi 13 Avril 2027',
    date: '2027-04-13',
    theme: 'Fondements de la Foi (Tawhid) & Pratique de la Prière',
    items: [
      { time: '04h30 - 05h30', title: 'Réveil, Tahajjud & Prière de Fajr en assemblée', category: 'priere', location: 'Mosquée' },
      { time: '05h30 - 06h15', title: 'Adhkar du matin & Récitation Coranique (Hizb quotidien)', category: 'cours', location: 'Mosquée' },
      { time: '06h15 - 07h00', title: 'Séance d\'étirements et réveil physique', category: 'sport', location: 'Terrain de sport' },
      { time: '07h00 - 08h00', title: 'Petit-déjeuner & Toilette', category: 'repas', location: 'Réfectoire' },
      { time: '08h30 - 10h30', title: 'Module 1 : Le Tawhid, socle inébranlable de la foi du croyant', category: 'cours', speaker: 'Dr. Cissé (Enseignant-chercheur)', location: 'Salle Plénière' },
      { time: '10h30 - 11h00', title: 'Pause fraîcheur & Échanges', category: 'repas' },
      { time: '11h00 - 13h00', title: 'Module 2 : Atelier pratique de la purification (Woudou, Ghusl) et Salat', category: 'atelier', speaker: 'Oustaz Touré', location: 'Espace Démonstration' },
      { time: '13h00 - 15h00', title: 'Prière de Dhohr, Déjeuner & Sieste réparatrice', category: 'repas' },
      { time: '15h30 - 17h30', title: 'Conférence Thématique : La préservation des valeurs morales face aux dérives numériques', category: 'conference', speaker: 'Imam Central de Gagnoa' },
      { time: '20h30 - 22h00', title: 'Veillée spirituelle (Tazkiyat an-Nafs) & Récits des Pieux Prédécesseurs', category: 'cours' }
    ]
  },
  {
    dayNumber: 3,
    dayName: 'Mercredi 14 Avril 2027',
    date: '2027-04-14',
    theme: 'Excellence Académique & Méthodologie d\'Étude',
    items: [
      { time: '04h30 - 06h00', title: 'Fajr & Tafsir d\'une sélection de versets inspirants', category: 'priere' },
      { time: '07h00 - 08h00', title: 'Petit-déjeuner', category: 'repas' },
      { time: '08h30 - 10h30', title: 'Module 3 : Les règles de Tajweed pour perfectionner sa récitation', category: 'cours', speaker: 'Qari Souleymane' },
      { time: '11h00 - 13h00', title: 'Atelier de Méthodologie : Comment allier foi fervente et réussite scolaire éclatante', category: 'atelier', speaker: 'Cadres AEEMCI Région du Gôh' },
      { time: '15h30 - 17h30', title: 'Panel interactif : Orientation post-bac et carrières d\'avenir', category: 'conference' },
      { time: '20h30 - 22h00', title: 'Tournoi intellectuel inter-sous-comités (Génie Islamique & Culture Générale)', category: 'atelier' }
    ]
  },
  {
    dayNumber: 4,
    dayName: 'Jeudi 15 Avril 2027',
    date: '2027-04-15',
    theme: 'Leadership Musulman & Engagement Communautaire',
    items: [
      { time: '04h30 - 06h00', title: 'Prière de Fajr & Exhortation sur la fraternité en Allah', category: 'priere' },
      { time: '07h00 - 08h00', title: 'Petit-déjeuner', category: 'repas' },
      { time: '08h30 - 10h30', title: 'Module 4 : La Sunnah du Prophète (saw) dans les relations humaines et le leadership', category: 'cours' },
      { time: '11h00 - 13h00', title: 'Atelier Pratique : Art oratoire, prise de parole en public et gestion de réunions', category: 'atelier' },
      { time: '15h30 - 17h30', title: 'Action citoyenne éco-islamique : Opération ville propre et don de sang', category: 'atelier', location: 'Cour du Lycée & CHR de Gagnoa' },
      { time: '20h30 - 22h00', title: 'Projection d\'un documentaire édifiant et causerie-débat', category: 'conference' }
    ]
  },
  {
    dayNumber: 5,
    dayName: 'Vendredi 16 Avril 2027',
    date: '2027-04-16',
    theme: 'Jour Béni du Vendredi & Éthique Islamique',
    items: [
      { time: '04h30 - 06h00', title: 'Fajr & Récitation de la Sourate Al-Kahf', category: 'priere' },
      { time: '08h30 - 11h00', title: 'Module 5 : Fiqh des Transactions (Muamalat) et Éthique financière en Islam', category: 'cours' },
      { time: '12h00 - 14h30', title: 'Grande Prière de Joumou\'ah en congrégation & Khoutbah solennelle', category: 'priere', location: 'Grande Mosquée de Gagnoa' },
      { time: '15h30 - 17h30', title: 'Atelier Santé & Premiers Secours avec la Croix-Rouge et commission santé', category: 'atelier' },
      { time: '20h30 - 22h30', title: 'Soirée de louanges (Anashid spirituels) et témoignages d\'anciens de l\'AEEMCI', category: 'ceremonie' }
    ]
  },
  {
    dayNumber: 6,
    dayName: 'Samedi 17 Avril 2027',
    date: '2027-04-17',
    theme: 'Consolidation, Évaluations & Tournois Sportifs',
    items: [
      { time: '04h30 - 06h00', title: 'Fajr & Douas collectives pour la paix en Côte d\'Ivoire', category: 'priere' },
      { time: '08h30 - 11h30', title: 'Évaluation des connaissances acquises (Test de validation)', category: 'atelier' },
      { time: '15h00 - 18h00', title: 'Grande finale du tournoi de football de la Fraternité SERFIG Gôh', category: 'sport', location: 'Terrain de sport Lycée' },
      { time: '20h30 - 23h00', title: 'Grande veillée de gala : Remise des prix d\'excellence et sketchs pédagogiques', category: 'ceremonie' }
    ]
  },
  {
    dayNumber: 7,
    dayName: 'Dimanche 18 Avril 2027',
    date: '2027-04-18',
    theme: 'Clôture Solennelle, Attestations & Départs',
    items: [
      { time: '04h30 - 06h00', title: 'Fajr d\'adieu & Rappel final de persévérance', category: 'priere' },
      { time: '08h30 - 12h00', title: 'Cérémonie Officielle de Clôture du SERFIG 2027', category: 'ceremonie', location: 'Grande Salle', description: 'Lecture de la résolution finale, remise solennelle des Attestations de participation à tous les séminaristes, et allocution de clôture du Secrétaire Régional du Gôh' },
      { time: '12h30 - 14h00', title: 'Déjeuner de départ & Échange des contacts fraternels', category: 'repas' },
      { time: '14h00 - 17h00', title: 'Départ sécurisé de toutes les délégations vers leurs sous-comités respectifs (Oumé, Guibéroua, Diégonéfla...)', category: 'ceremonie' }
    ]
  }
];

export const SEMINAR_GUIDE_ITEMS = [
  {
    category: 'Obligatoire dans la valise',
    items: [
      'Saint Coran (Mushaf) personnel et livre d\'invocations (Hisn Al Muslim)',
      'Tapis de prière individuel propre',
      'Cahier de notes grand format (200 pages) et stylos',
      'Draps de lit et moustiquaire imprégnée pour dortoir',
      'Tenues vestimentaires décentes conformes à l\'éthique islamique (Kamis, boubou pour les frères ; Hijab, abayas amples pour les sœurs)',
      'Nécessaire de toilette complet (savon, brosse à dents, serviette, sandales de douche)',
      'Lampe torche ou lampe rechargeable'
    ]
  },
  {
    category: 'Règles de discipline & Vie commune',
    items: [
      'Ponctualité absolue à toutes les prières en congrégation et aux cours',
      'Port obligatoire du badge officiel délivré par la commission',
      'Séparation stricte et respectueuse des espaces dortoirs frères et sœurs',
      'Interdiction de sortir de l\'enceinte du lycée sans autorisation signée de la commission sécurité',
      'Utilisation des téléphones strictement encadrée hors des heures de cours',
      'Esprit d\'entraide, de courtoisie et de fraternité islamique en toutes circonstances'
    ]
  },
  {
    category: 'Prise en charge incluse',
    items: [
      'Hébergement complet durant les 7 jours du séminaire',
      'Restauration complète 3 repas par jour (Petit-déjeuner, Déjeuner, Dîner équilibrés)',
      'Supports pédagogiques et documents de formation',
      'Assistance médicale d\'urgence assurée 24h/24 par la commission santé',
      'Attestation officielle de participation délivrée à la cérémonie de clôture'
    ]
  }
];

export const FAQ_ITEMS = [
  {
    question: 'Qu\'est-ce que le SERFIG et qui peut y participer ?',
    answer: 'Le SERFIG (Séminaire Régional de Formation Islamique du Gôh) est le grand rassemblement annuel d\'éducation, de spiritualité et de fraternité organisé par l\'AEEMCI Région du Gôh à Gagnoa. Il est ouvert à tous les élèves du secondaire (collèges et lycées), étudiants de l\'université ou grandes écoles, ainsi qu\'aux jeunes sympathisants musulmans.'
  },
  {
    question: 'Combien coûte la participation au séminaire ?',
    answer: 'La participation forfaitaire est de seulement 1 500 FCFA pour les séminaristes des sous-comités de la région du Gôh (Gagnoa, Oumé, Guibéroua, Diégonéfla, Ouragahio, Bayota, Gnagbodougnoa, Dougroupalégnoa) et 2 000 FCFA pour l\'extérieur. Ce tarif symbolique donne droit à l\'hébergement, la restauration 3 repas/jour, tous les cours, et l\'attestation officielle !'
  },
  {
    question: 'Le polo officiel est-il obligatoire ?',
    answer: 'Le polo officiel SERFIG est optionnel mais vivement recommandé pour l\'uniformité lors des cérémonies d\'ouverture, de clôture et de la prière du vendredi. Il coûte seulement 2 000 FCFA et est confectionné dans un tissu de haute qualité.'
  },
  {
    question: 'Comment s\'inscrire et payer les frais ?',
    answer: 'Vous pouvez vous inscrire directement sur cette plateforme en ligne en remplissant le formulaire en moins de 2 minutes. Vous pouvez effectuer votre paiement par Wave, Orange Money, MTN MoMo ou choisir de régler en espèces à votre arrivée à l\'accueil du séminaire.'
  },
  {
    question: 'Comment obtenir mon badge de participant ?',
    answer: 'Dès la validation de votre formulaire d\'inscription, votre badge officiel sécurisé avec votre matricule et QR Code est généré instantanément. Vous pouvez le télécharger ou l\'imprimer directement depuis votre téléphone ou ordinateur.'
  },
  {
    question: 'Comment les formateurs et membres de commission s\'enregistrent-ils ?',
    answer: 'Le portail dispose d\'onglets dédiés : les formateurs et intervenants sont pris en charge à 100% gratuitement. Les membres des commissions d\'organisation (restauration, sécurité, santé, média...) s\'enregistrent avec un tarif d\'organisation de 2 000 FCFA incluant leur badge officiel de commission.'
  }
];
