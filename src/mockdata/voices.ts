export interface Voice {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  accent?: string;
  previewUrl: string;
  tags: string[];
}

export const mockVoices: Voice[] = [
  {
    id: 'v1',
    name: 'Alex',
    gender: 'male',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-male-1.mp3',
    tags: ['clear', 'professional', 'authoritative']
  },
  {
    id: 'v2',
    name: 'Sophie',
    gender: 'female',
    language: 'English',
    accent: 'British',
    previewUrl: '/assets/sounds/voice-preview-female-1.mp3',
    tags: ['warm', 'friendly', 'engaging']
  },
  {
    id: 'v3',
    name: 'Michael',
    gender: 'male',
    language: 'English',
    accent: 'Australian',
    previewUrl: '/assets/sounds/voice-preview-male-2.mp3',
    tags: ['casual', 'conversational', 'relaxed']
  },
  {
    id: 'v4',
    name: 'Emma',
    gender: 'female',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-female-2.mp3',
    tags: ['energetic', 'youthful', 'upbeat']
  },
  {
    id: 'v5',
    name: 'Sam',
    gender: 'neutral',
    language: 'English',
    previewUrl: '/assets/sounds/voice-preview-neutral-1.mp3',
    tags: ['neutral', 'balanced', 'clear']
  },
  {
    id: 'v6',
    name: 'Hiroshi',
    gender: 'male',
    language: 'Japanese',
    previewUrl: '/assets/sounds/voice-preview-male-3.mp3',
    tags: ['professional', 'calm', 'measured']
  },
  {
    id: 'v7',
    name: 'Maria',
    gender: 'female',
    language: 'Spanish',
    accent: 'Latin American',
    previewUrl: '/assets/sounds/voice-preview-female-3.mp3',
    tags: ['warm', 'friendly', 'expressive']
  },
  {
    id: 'v8',
    name: 'Antoine',
    gender: 'male',
    language: 'French',
    previewUrl: '/assets/sounds/voice-preview-male-4.mp3',
    tags: ['sophisticated', 'clear', 'articulate']
  },
  {
    id: 'v9',
    name: 'Ruby',
    gender: 'female',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-female-4.mp3',
    tags: ['mature', 'authoritative', 'news']
  },
  {
    id: 'v10',
    name: 'Thunder',
    gender: 'male',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-male-5.mp3',
    tags: ['deep', 'powerful', 'dramatic']
  },
  {
    id: 'v11',
    name: 'Jennifer',
    gender: 'female',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-female-5.mp3',
    tags: ['professional', 'clear', 'business']
  },
  {
    id: 'v12',
    name: 'Mason',
    gender: 'male',
    language: 'English',
    accent: 'American',
    previewUrl: '/assets/sounds/voice-preview-male-6.mp3',
    tags: ['young', 'friendly', 'casual']
  }
];
