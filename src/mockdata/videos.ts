import { TrendingTopic } from './trendingTopics';
import { Script } from './scripts';
import { Voice } from './voices';
import { Background } from './backgrounds';

export interface Video {
  id: string;
  title: string;
  description: string;
  scriptId: string;
  voiceId: string;
  backgroundId: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  videoUrl: string;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  topics: string[]; // related trending topic IDs
  tags: string[]; // searchable tags
  views: number; // view count
  url: string; // direct access url
  voiceName?: string; // name of the voice used
  backgroundName?: string; // name of the background used
}

export interface VideoWithDetails extends Video {
  script: Script;
  voice: Voice;
  background: Background;
  relatedTopics: TrendingTopic[];
}

export const mockVideos: Video[] = [  {
    id: 'video1',
    title: 'How to Build a Sustainable Wardrobe in 2025',
    description: 'Practical tips for creating an eco-friendly wardrobe that doesn\'t compromise on style.',
    scriptId: '1',
    voiceId: 'v2',
    backgroundId: 'bg1',
    duration: 60,
    thumbnailUrl: '/assets/images/thumbnails/sustainable-fashion.jpg',
    videoUrl: '/assets/videos/sustainable-fashion.mp4',
    status: 'completed',
    createdAt: '2025-05-11T10:30:00Z',
    updatedAt: '2025-05-11T11:15:00Z',
    topics: ['1', '4'],
    tags: ['fashion', 'sustainability', 'ecofriendly', 'wardrobe'],
    views: 1287,
    url: '/assets/videos/sustainable-fashion.mp4',
    voiceName: 'Sophie',
    backgroundName: 'Fashion Studio'
  },  {
    id: 'video2',
    title: 'How AI is Revolutionizing Medical Diagnostics',
    description: 'Discover how artificial intelligence is transforming healthcare and improving diagnostic accuracy.',
    scriptId: '2',
    voiceId: 'v1',
    backgroundId: 'bg6',
    duration: 65,
    thumbnailUrl: '/assets/images/thumbnails/ai-healthcare.jpg',
    videoUrl: '/assets/videos/ai-healthcare.mp4',
    status: 'completed',
    createdAt: '2025-05-10T14:15:00Z',
    updatedAt: '2025-05-10T15:45:00Z',
    topics: ['2'],
    tags: ['AI', 'healthcare', 'diagnostics', 'medicine'],
    views: 856,
    url: '/assets/videos/ai-healthcare.mp4',
    voiceName: 'Michael',
    backgroundName: 'Hospital Setting'
  },  {
    id: 'video3',
    title: '5 Daily Habits for Better Mental Health',
    description: 'Simple practices you can incorporate into your daily routine to improve your mental wellbeing.',
    scriptId: '3',
    voiceId: 'v4',
    backgroundId: 'bg3',
    duration: 55,
    thumbnailUrl: '/assets/images/thumbnails/mental-health.jpg',
    videoUrl: '/assets/videos/mental-health.mp4',
    status: 'completed',
    createdAt: '2025-05-09T09:45:00Z',
    updatedAt: '2025-05-09T11:00:00Z',
    topics: ['8'],
    tags: ['mentalhealth', 'wellness', 'habits', 'selfcare'],
    views: 2145,
    url: '/assets/videos/mental-health.mp4',
    voiceName: 'Emma',
    backgroundName: 'Calm Nature'
  },  {
    id: 'video4',
    title: 'Digital Nomad Essentials for 2025',
    description: 'The must-have tools and tips for anyone pursuing a location-independent lifestyle.',
    scriptId: '1', // Reusing script for demo purposes
    voiceId: 'v3',
    backgroundId: 'bg2',
    duration: 62,
    thumbnailUrl: '/assets/images/thumbnails/digital-nomad.jpg',
    videoUrl: '/assets/videos/digital-nomad.mp4',
    status: 'processing',
    createdAt: '2025-05-08T16:20:00Z',
    updatedAt: '2025-05-08T16:20:00Z',
    topics: ['5'],
    tags: ['digitalnomad', 'remotework', 'travel', 'lifestyle'],
    views: 0,
    url: '/assets/videos/digital-nomad.mp4',
    voiceName: 'David',
    backgroundName: 'Co-working Space'
  }
];
