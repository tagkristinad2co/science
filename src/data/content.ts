export interface SheetPreview {
  id: string;
  image: string;
  title: string;
  alt: string;
  category: 'Biology' | 'Chemistry' | 'Physics' | 'Earth Science';
}

export const GALLERY_SHEETS: SheetPreview[] = [
  {
    id: 'page-1',
    image: '/assets/page-1.webp',
    title: 'Fossils & geological time',
    alt: 'Fossils and Geological Time Scale',
    category: 'Earth Science',
  },
  {
    id: 'page-3',
    image: '/assets/page-3.webp',
    title: 'Carbon cycle',
    alt: 'Carbon Cycle',
    category: 'Earth Science',
  },
  {
    id: 'page-5',
    image: '/assets/page-5.webp',
    title: 'Rock cycle',
    alt: 'Rock Cycle',
    category: 'Earth Science',
  },
  {
    id: 'page-8',
    image: '/assets/page-8.webp',
    title: 'Acids, bases & pH',
    alt: 'Acids Bases and pH',
    category: 'Chemistry',
  },
  {
    id: 'page-16',
    image: '/assets/page-16.webp',
    title: 'Cellular respiration',
    alt: 'Cellular Respiration',
    category: 'Biology',
  },
  {
    id: 'page-22',
    image: '/assets/page-22.webp',
    title: 'Human heart',
    alt: 'Human Heart',
    category: 'Biology',
  },
  {
    id: 'page-30',
    image: '/assets/page-30.webp',
    title: 'Sound waves',
    alt: 'Sound Waves',
    category: 'Physics',
  },
  {
    id: 'page-35',
    image: '/assets/page-35.webp',
    title: 'Electric current',
    alt: 'Electric Current',
    category: 'Physics',
  },
  {
    id: 'page-42',
    image: '/assets/page-42.webp',
    title: 'Periodic table',
    alt: 'Periodic Table',
    category: 'Chemistry',
  },
  {
    id: 'page-47',
    image: '/assets/page-47.webp',
    title: 'Covalent bonding',
    alt: 'Covalent Bonding',
    category: 'Chemistry',
  },
];

export interface Feature {
  emoji: string;
  title: string;
  description: string;
}

export const BENEFIT_FEATURES: Feature[] = [
  {
    emoji: '🧠',
    title: 'Visual explanations',
    description: 'Illustrated diagrams and key facts help explain how science concepts fit together.',
  },
  {
    emoji: '📚',
    title: 'Topic-by-topic',
    description: 'Dip into individual reference sheets whenever you want to revisit a concept.',
  },
  {
    emoji: '🖨️',
    title: 'Printable PDFs',
    description: 'Use the collection on-screen or print pages for personal home study.',
  },
  {
    emoji: '🌍',
    title: 'Four science areas',
    description: 'Explore biology, chemistry, physics and Earth science in one collection.',
  },
];

export const TOPIC_AREAS: Feature[] = [
  {
    emoji: '🧬',
    title: 'Biology',
    description: 'Human heart, cells, enzymes, respiration and more.',
  },
  {
    emoji: '⚗️',
    title: 'Chemistry',
    description: 'Acids and bases, periodic table, bonding and reactions.',
  },
  {
    emoji: '⚡',
    title: 'Physics',
    description: 'Electricity, magnetism, light and sound.',
  },
  {
    emoji: '🌋',
    title: 'Earth science',
    description: 'Fossils, the rock cycle, climate and Earth systems.',
  },
];

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Is this a physical book?',
    answer: 'No. You receive digital PDF study sheets you can download and view or print for personal learning.',
  },
  {
    question: 'What age is the collection for?',
    answer: 'The difficulty varies by topic. It is broadly relevant to older primary and lower-secondary learners; please inspect the free sample to decide if it suits your learner.',
  },
  {
    question: "Does it follow my country's school curriculum?",
    answer: 'It is a supplemental reference collection. We do not claim formal alignment with any particular national curriculum or exam board.',
  },
  {
    question: 'Am I receiving 100 pages?',
    answer: "No. The current Founder's Edition contains 50 sheets. A 100-sheet edition is planned but not part of this purchase.",
  },
  {
    question: 'Can I share it with my class?',
    answer: 'The $12.99 price is for personal/household study only. Classroom redistribution and resale are not included.',
  },
  {
    question: 'How do I get access?',
    answer: 'After successful payment, your configured checkout provider will supply digital delivery instructions.',
  },
];
