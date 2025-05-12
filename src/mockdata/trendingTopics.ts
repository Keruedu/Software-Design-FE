export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  popularity: number;
  keywords: string[];
}

export const trendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Sustainable Fashion',
    category: 'Lifestyle',
    popularity: 97,
    keywords: ['eco-friendly', 'sustainable', 'fashion', 'environmentally friendly', 'green fashion']
  },
  {
    id: '2',
    title: 'AI in Healthcare',
    category: 'Technology',
    popularity: 95,
    keywords: ['artificial intelligence', 'healthcare', 'medical technology', 'AI diagnosis', 'healthcare innovation']
  },
  {
    id: '3',
    title: 'Easy Meal Prep',
    category: 'Food',
    popularity: 92,
    keywords: ['meal prep', 'quick recipes', 'healthy meals', 'food preparation', 'cooking tips']
  },
  {
    id: '4',
    title: 'Minimalist Living',
    category: 'Lifestyle',
    popularity: 89,
    keywords: ['minimalism', 'decluttering', 'simple living', 'minimal lifestyle', 'organization']
  },
  {
    id: '5',
    title: 'Digital Nomad Life',
    category: 'Travel',
    popularity: 88,
    keywords: ['digital nomad', 'remote work', 'travel lifestyle', 'working abroad', 'nomadic living']
  },
  {
    id: '6',
    title: 'Fitness at Home',
    category: 'Fitness',
    popularity: 87,
    keywords: ['home workout', 'fitness', 'exercise', 'home gym', 'workout routine']
  },
  {
    id: '7',
    title: 'Cryptocurrency Basics',
    category: 'Finance',
    popularity: 85,
    keywords: ['crypto', 'bitcoin', 'blockchain', 'investing', 'digital currency']
  },
  {
    id: '8',
    title: 'Mental Health Awareness',
    category: 'Health',
    popularity: 91,
    keywords: ['mental health', 'wellness', 'self-care', 'mindfulness', 'psychology']
  }
];
