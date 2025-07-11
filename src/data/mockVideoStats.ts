import { VideoStats } from '../components/analytics/ChartComponent';

// Mock data cho top 10 videos
export const mockVideoStats: VideoStats[] = [
  {
    id: '1',
    title: 'Video Trending #1',
    facebook: { views: 150000, likes: 12000, comments: 800 },
    youtube: { views: 250000, likes: 18000, comments: 1200 },
    tiktok: { views: 500000, likes: 35000, comments: 2500 },
    createdAt: '2025-07-10'
  },
  {
    id: '2', 
    title: 'Viral Dance Video',
    facebook: { views: 120000, likes: 9500, comments: 650 },
    youtube: { views: 180000, likes: 14000, comments: 900 },
    tiktok: { views: 750000, likes: 55000, comments: 3200 },
    createdAt: '2025-07-09'
  },
  {
    id: '3',
    title: 'Comedy Sketch',
    facebook: { views: 95000, likes: 7800, comments: 420 },
    youtube: { views: 320000, likes: 22000, comments: 1800 },
    tiktok: { views: 280000, likes: 18000, comments: 1100 },
    createdAt: '2025-07-08'
  },
  {
    id: '4',
    title: 'Tech Review',
    facebook: { views: 80000, likes: 6200, comments: 380 },
    youtube: { views: 420000, likes: 28000, comments: 2200 },
    tiktok: { views: 150000, likes: 12000, comments: 650 },
    createdAt: '2025-07-07'
  },
  {
    id: '5',
    title: 'Music Cover',
    facebook: { views: 70000, likes: 5800, comments: 290 },
    youtube: { views: 180000, likes: 15000, comments: 980 },
    tiktok: { views: 380000, likes: 25000, comments: 1400 },
    createdAt: '2025-07-06'
  },
  {
    id: '6',
    title: 'Food Challenge',
    facebook: { views: 65000, likes: 5200, comments: 240 },
    youtube: { views: 160000, likes: 12000, comments: 750 },
    tiktok: { views: 320000, likes: 22000, comments: 1300 },
    createdAt: '2025-07-05'
  },
  {
    id: '7',
    title: 'Travel Vlog',
    facebook: { views: 55000, likes: 4500, comments: 180 },
    youtube: { views: 280000, likes: 19000, comments: 1100 },
    tiktok: { views: 200000, likes: 15000, comments: 800 },
    createdAt: '2025-06-20'
  },
  {
    id: '8',
    title: 'Gaming Highlights',
    facebook: { views: 48000, likes: 3800, comments: 160 },
    youtube: { views: 350000, likes: 25000, comments: 1900 },
    tiktok: { views: 180000, likes: 12000, comments: 700 },
    createdAt: '2025-06-15'
  },
  {
    id: '9',
    title: 'DIY Tutorial',
    facebook: { views: 42000, likes: 3200, comments: 140 },
    youtube: { views: 220000, likes: 16000, comments: 850 },
    tiktok: { views: 160000, likes: 11000, comments: 550 },
    createdAt: '2025-06-10'
  },
  {
    id: '10',
    title: 'Fitness Workout',
    facebook: { views: 38000, likes: 2900, comments: 120 },
    youtube: { views: 190000, likes: 13000, comments: 680 },
    tiktok: { views: 240000, likes: 17000, comments: 900 },
    createdAt: '2025-06-05'
  }
];
