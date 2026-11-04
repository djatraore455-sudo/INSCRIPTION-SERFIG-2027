export interface TestQuestion {
  id: string;
  section: 'foi' | 'fiqh' | 'aeemci';
  sectionTitle: string;
  questionNumber: number;
  questionText: string;
  points: number;
  type: 'single' | 'multiple';
  options: string[];
  correctAnswers: number[]; // indices des bonnes réponses
  explanation?: string;
}

export const ENTRY_TEST_SECTIONS = [
  { id: 'foi', title: 'I. Éducation de la foi', totalPoints: 5 },
  { id: 'fiqh', title: 'II. Fiqh', totalPoints: 13 },
  { id: 'aeemci', title: 'III. AEEMCI', totalPoints: 2 },
];

export const ENTRY_TEST_QUESTIONS: TestQuestion[] = [
  // ─── SECTION I : ÉDUCATION DE LA FOI (5 POINTS) ──────────────────────
  {
    id: 'foi-1',
    section: 'foi',
    sectionTitle: 'I. Éducation de la foi — 5 points',
    questionNumber: 1,
    questionText: 'Qui est ton Seigneur, qui est ton Prophète et quelle est ta religion ?',
    points: 1,
    type: 'single',
    options: [
      'Allah, Mouhammad ﷺ, l\'islam',
      'Allah, Moussa, l\'islam',
      'Allah, Issa, le judaïsme',
      'Les anges, Mouhammad ﷺ, l\'islam'
    ],
    correctAnswers: [0],
    explanation: 'Les trois principes fondamentaux de la croyance islamique sont : la connaissance d\'Allah, de Son Prophète Mouhammad ﷺ et de la religion de l\'islam.'
  },
  {
    id: 'foi-2',
    section: 'foi',
    sectionTitle: 'I. Éducation de la foi — 5 points',
    questionNumber: 2,
    questionText: 'Quels sont les cinq piliers de l\'islam dans leur ordre habituel ?',
    points: 1,
    type: 'single',
    options: [
      'Prière, zakat, jeûne, pèlerinage, attestation de foi',
      'Attestation de foi, prière, zakat, jeûne du Ramadan, pèlerinage',
      'Attestation de foi, jeûne, prière, zakat, pèlerinage',
      'Pèlerinage, prière, zakat, jeûne, attestation de foi'
    ],
    correctAnswers: [1],
    explanation: 'Selon le hadith d\'Ibn Omar (RA), l\'islam est bâti sur cinq piliers débutant par les deux attestations de foi (Shahada), puis la prière (Salât), la zakat, le jeûne de Ramadan et le pèlerinage (Hajj).'
  },
  {
    id: 'foi-3',
    section: 'foi',
    sectionTitle: 'I. Éducation de la foi — 5 points',
    questionNumber: 3,
    questionText: 'L\'univers a existé de lui-même à partir du néant.',
    points: 1,
    type: 'single',
    options: [
      'Vrai',
      'Faux'
    ],
    correctAnswers: [1],
    explanation: 'Faux. Allah est le Créateur unique de toute chose à partir du néant (Al-Khâliq).'
  },
  {
    id: 'foi-4',
    section: 'foi',
    sectionTitle: 'I. Éducation de la foi — 5 points',
    questionNumber: 4,
    questionText: 'Quels sont quatre livres révélés généralement cités dans l\'enseignement islamique ?',
    points: 1,
    type: 'single',
    options: [
      'Tawrat, Zabur, Injil et Coran',
      'Coran, Sunna, Fiqh et Hadith',
      'Tawrat, Hadith, Zabur et Sunna',
      'Coran, Fiqh, Injil et Sira'
    ],
    correctAnswers: [0],
    explanation: 'Les quatre livres révélés par Allah cités dans le Coran sont la Tawrat (à Moussa), le Zabour (à Daoud), l\'Injil (à Issa) et le Noble Coran (à Mouhammad ﷺ).'
  },
  {
    id: 'foi-5',
    section: 'foi',
    sectionTitle: 'I. Éducation de la foi — 5 points',
    questionNumber: 5,
    questionText: 'Qu\'est-ce que le shirk ?',
    points: 1,
    type: 'single',
    options: [
      'Associer à Allah d\'autres êtres dans ce qui Lui est propre',
      'Manquer une prière par oubli',
      'Donner l\'aumône',
      'Jeûner volontairement'
    ],
    correctAnswers: [0],
    explanation: 'Le polythéisme ou associationnisme (Shirk) consiste à attribuer à un autre qu\'Allah ce qui revient exclusivement à Allah en matière de seigneurie, d\'adoration ou de noms et attributs.'
  },

  // ─── SECTION II : FIQH (13 POINTS) ──────────────────────────────────
  {
    id: 'fiqh-1',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 1,
    questionText: 'La purification (At-Tahâra) est :',
    points: 1.5,
    type: 'single',
    options: [
      'Recommandée uniquement',
      'Obligatoire pour certaines adorations',
      'Interdite'
    ],
    correctAnswers: [1],
    explanation: 'La purification rituelle est obligatoire (wâjib/fard) pour accomplir la prière, le tawaf ou toucher le Moushaf.'
  },
  {
    id: 'fiqh-2',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 2,
    questionText: 'Le Fiqh signifie :',
    points: 1.5,
    type: 'single',
    options: [
      'Jurisprudence islamique',
      'Étude des hadiths uniquement',
      'Histoire du Coran'
    ],
    correctAnswers: [0],
    explanation: 'Le Fiqh est la compréhension et la science de la jurisprudence islamique régissant les actes cultuels et relationnels.'
  },
  {
    id: 'fiqh-3',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 3,
    questionText: 'Quelle est la différence entre hadath mineur et hadath majeur ?',
    points: 2,
    type: 'single',
    options: [
      'Le mineur nécessite normalement le woudou, le majeur le ghusl',
      'Les deux nécessitent uniquement le woudou',
      'Le mineur nécessite le ghusl, le majeur le woudou',
      'Aucune purification n\'est nécessaire'
    ],
    correctAnswers: [0],
    explanation: 'L\'état d\'impureté mineure (hadath asghar) requiert les petites ablutions (woudou), tandis que l\'impureté majeure (hadath akbar) requiert le bain rituel (ghusl).'
  },
  {
    id: 'fiqh-4',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 4,
    questionText: 'Quelles eaux sont pures et purifiantes ?',
    points: 2,
    type: 'multiple',
    options: [
      'Eau mélangée avec du jus',
      'Eau de mer',
      'Eau de puits',
      'Eau de rivière'
    ],
    correctAnswers: [1, 2, 3],
    explanation: 'L\'eau de mer, de puits et de rivière sont des eaux naturelles pures et purifiantes (Mâ\' Tahoor). L\'eau mélangée avec du jus a perdu sa nature d\'eau pure.'
  },
  {
    id: 'fiqh-5',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 5,
    questionText: 'Une personne oublie de laver ses pieds pendant le woudou et commence à prier. Sa prière reste valide.',
    points: 1,
    type: 'single',
    options: [
      'Vrai',
      'Faux'
    ],
    correctAnswers: [1],
    explanation: 'Faux. Le lavage des pieds jusqu\'aux chevilles est un pilier (fard) du woudou selon le verset de la sourate Al-Ma\'idah. Sans cela, le woudou et la prière sont invalides.'
  },
  {
    id: 'fiqh-6',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 6,
    questionText: 'Citer deux causes de la grande ablution (Al-Ghusl).',
    points: 2,
    type: 'single',
    options: [
      'Sortie de mani et fin des menstrues',
      'Sommeil léger et fait de manger',
      'Consommation d\'eau et marche',
      'Simple fait de toucher ses vêtements'
    ],
    correctAnswers: [0],
    explanation: 'La sortie de sperme (mani) avec désir ou la fin des règles (menstrues/lochies) rendent le ghusl obligatoire.'
  },
  {
    id: 'fiqh-7',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 7,
    questionText: 'Le Tayammum peut remplacer le woudou en cas d\'absence d\'eau.',
    points: 1,
    type: 'single',
    options: [
      'Vrai',
      'Faux'
    ],
    correctAnswers: [0],
    explanation: 'Vrai. La lustration pulvérale (Tayammum) avec de la terre pure remplace le woudou ou le ghusl en cas d\'absence d\'eau ou d\'incapacité médicale d\'utiliser l\'eau.'
  },
  {
    id: 'fiqh-8',
    section: 'fiqh',
    sectionTitle: 'II. Fiqh — 13 points',
    questionNumber: 8,
    questionText: 'Dans quels cas le woudou devient-il invalide ?',
    points: 2,
    type: 'multiple',
    options: [
      'Perte de connaissance',
      'Sommeil profond',
      'Après avoir mangé',
      'Vol'
    ],
    correctAnswers: [0, 1],
    explanation: 'La perte de conscience (évanouissement, anesthésie) et le sommeil profond annulent les ablutions. Le vol est un péché grave mais n\'annule pas rituellement le woudou.'
  },

  // ─── SECTION III : AEEMCI (2 POINTS) ─────────────────────────────────
  {
    id: 'aeemci-1',
    section: 'aeemci',
    sectionTitle: 'III. AEEMCI — 2 points',
    questionNumber: 1,
    questionText: 'Combien de secrétariats régionaux compte l\'AEEMCI en 2026 ?',
    points: 1,
    type: 'single',
    options: [
      '30',
      '32',
      '34',
      '36'
    ],
    correctAnswers: [1],
    explanation: 'L\'AEEMCI compte 32 Secrétariats Régionaux sur l\'ensemble du territoire national de Côte d\'Ivoire.'
  },
  {
    id: 'aeemci-2',
    section: 'aeemci',
    sectionTitle: 'III. AEEMCI — 2 points',
    questionNumber: 2,
    questionText: 'Quel est le nom complet de votre secrétariat régional ?',
    points: 1,
    type: 'single',
    options: [
      'Secrétariat Régional du Gôh',
      'Secrétariat Régional du Gbêkê',
      'Secrétariat Régional du Haut-Sassandra',
      'Secrétariat Régional du Poro'
    ],
    correctAnswers: [0],
    explanation: 'Le Secrétariat Régional hôte du SERFIG 2027 est le Secrétariat Régional du Gôh (Gagnoa).'
  }
];

export function calculateScore(userAnswers: Record<string, number[]>): {
  totalScore: number;
  sectionScores: Record<string, number>;
  detailedResults: Array<{
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
  }>;
} {
  let totalScore = 0;
  const sectionScores: Record<string, number> = {
    foi: 0,
    fiqh: 0,
    aeemci: 0
  };

  const detailedResults = ENTRY_TEST_QUESTIONS.map(q => {
    const userSelected = userAnswers[q.id] || [];
    let pointsEarned = 0;
    let isCorrect = false;

    if (q.type === 'single') {
      if (userSelected.length === 1 && userSelected[0] === q.correctAnswers[0]) {
        pointsEarned = q.points;
        isCorrect = true;
      }
    } else {
      // Multiple choices (case à cocher)
      const correctSet = new Set(q.correctAnswers);
      const userSet = new Set(userSelected);

      // Vérifier si toutes les réponses de l'utilisateur sont correctes
      let hasWrongAnswer = false;
      userSelected.forEach(ans => {
        if (!correctSet.has(ans)) hasWrongAnswer = true;
      });

      if (!hasWrongAnswer && userSelected.length > 0) {
        // Proportion des bonnes réponses
        const ratio = userSelected.length / q.correctAnswers.length;
        pointsEarned = Number((q.points * ratio).toFixed(1));
        isCorrect = ratio === 1;
      }
    }

    totalScore += pointsEarned;
    sectionScores[q.section] = Number((sectionScores[q.section] + pointsEarned).toFixed(1));

    return {
      questionId: q.id,
      isCorrect,
      pointsEarned,
      maxPoints: q.points
    };
  });

  return {
    totalScore: Number(Math.min(20, Math.max(0, totalScore)).toFixed(1)),
    sectionScores,
    detailedResults
  };
}
