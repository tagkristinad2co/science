import { config } from '../config';

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

export interface FAQItem {
  question: string;
  answer: string;
}

export const getFaqItems = (
  isFounding: boolean,
  endDateText: string,
  upgrade: string,
  bundlePrice: string,
  _allowsCards: boolean = false
): FAQItem[] => {
  const items: FAQItem[] = [];

  if (isFounding) {
    items.push({
      question: 'What is the founding price?',
      answer: `It's our launch price for the first 7 days, until ${endDateText}. After that, the price goes up to ${config.official.price100} for 100 sheets and ${config.official.price200} for 200 sheets.`,
    });
  }

  items.push(
    {
      question: 'Is this a physical book?',
      answer: 'No. You get digital PDF sheets to download, view or print at home.',
    },
    {
      question: 'How do I receive the sheets?',
      answer:
        "Right after payment you'll see your download link on the thank-you page, and it's also sent to your email. Save the link so you can download again.",
    },
    {
      question: 'Which payment methods can I use?',
      answer: `Pay online with ${config.onlinePaymentLabel} through Stripe's secure checkout for an instant download, or pay by DuitNow / Touch 'n Go eWallet QR and upload your receipt. We'll unlock your download after checking the payment, usually ${config.manualPayment.reviewTime}.`,
    },
    {
      question: 'What age is it for?',
      answer:
        'It broadly suits upper primary and lower secondary learners. Difficulty varies by topic, so have a look at the preview pages to check the level.',
    },
    {
      question: 'Does it follow the KSSR / KSSM syllabus?',
      answer: "It's a supplementary visual reference, not an official syllabus resource. Many topics overlap with school science, but we don't claim formal alignment.",
    },
    {
      question: `What's the ${upgrade} add-on?`,
      answer: `Tick it at checkout to get another 100 different sheets, 200 in total, for ${bundlePrice}.`,
    },
    {
      question: 'Can I share it with my class?',
      answer: "The pack is for personal/household use only. Classroom sharing and resale aren't included.",
    }
  );

  return items;
};
