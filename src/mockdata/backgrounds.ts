export interface Background {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  tags: string[];
  premium: boolean;
}

export const mockBackgrounds: Background[] = [
  {
    id: 'bg1',
    title: 'Minimalist Workspace',
    category: 'Workspace',
    imageUrl: '/assets/images/backgrounds/minimalist-workspace.jpg',
    tags: ['workspace', 'minimalist', 'clean', 'professional'],
    premium: false
  },
  {
    id: 'bg2',
    title: 'Urban Cityscape',
    category: 'City',
    imageUrl: '/assets/images/backgrounds/urban-cityscape.jpg',
    tags: ['city', 'urban', 'modern', 'architecture'],
    premium: false
  },
  {
    id: 'bg3',
    title: 'Mountain Vista',
    category: 'Nature',
    imageUrl: '/assets/images/backgrounds/mountain-vista.jpg',
    tags: ['nature', 'mountains', 'scenery', 'outdoors'],
    premium: false
  },
  {
    id: 'bg4',
    title: 'Ocean Waves',
    category: 'Nature',
    imageUrl: '/assets/images/backgrounds/ocean-waves.jpg',
    tags: ['nature', 'ocean', 'water', 'calming'],
    premium: false
  },
  {
    id: 'bg5',
    title: 'Abstract Gradient Blue',
    category: 'Abstract',
    imageUrl: '/assets/images/backgrounds/abstract-gradient-blue.jpg',
    tags: ['abstract', 'gradient', 'blue', 'modern'],
    premium: false
  },
  {
    id: 'bg6',
    title: 'Tech Interface',
    category: 'Technology',
    imageUrl: '/assets/images/backgrounds/tech-interface.jpg',
    tags: ['technology', 'digital', 'futuristic', 'interface'],
    premium: true
  },
  {
    id: 'bg7',
    title: 'Bokeh Lights',
    category: 'Abstract',
    imageUrl: '/assets/images/backgrounds/bokeh-lights.jpg',
    tags: ['abstract', 'lights', 'bokeh', 'blur'],
    premium: false
  },
  {
    id: 'bg8',
    title: 'Sunset Beach',
    category: 'Nature',
    imageUrl: '/assets/images/backgrounds/sunset-beach.jpg',
    tags: ['nature', 'beach', 'sunset', 'ocean'],
    premium: true
  }
];
