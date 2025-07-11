// Interface for backend response format
export interface VideoPerformanceData {
  platform: string;
  title: string;
  count: number;
}

export interface VideoStats {
  id: string;
  title: string;
  facebook: {
    views: number;
    likes: number;
    comments: number;
  };
  youtube: {
    views: number;
    likes: number;
    comments: number;
  };
  tiktok: {
    views: number;
    likes: number;
    comments: number;
  };
  createdAt: string;
}

// Mock data theo từng metric
const mockVideoData = {
  views: {
    facebook: [
      { platform: "facebook", title: "Video Trending #1", count: 150000 },
      { platform: "facebook", title: "Viral Dance Video", count: 120000 },
      { platform: "facebook", title: "Comedy Sketch", count: 95000 },
      { platform: "facebook", title: "Tech Review", count: 80000 },
      { platform: "facebook", title: "Music Cover", count: 70000 },
      { platform: "facebook", title: "Food Challenge", count: 65000 },
      { platform: "facebook", title: "Travel Vlog", count: 55000 },
      { platform: "facebook", title: "Gaming Highlights", count: 48000 },
      { platform: "facebook", title: "DIY Tutorial", count: 42000 },
      { platform: "facebook", title: "Fitness Workout", count: 38000 },
      { platform: "facebook", title: "Pet Funny Moments", count: 35000 },
      { platform: "facebook", title: "Recipe Tutorial", count: 32000 },
      { platform: "facebook", title: "Movie Review", count: 28000 },
      { platform: "facebook", title: "Fashion Haul", count: 25000 },
      { platform: "facebook", title: "Car Review", count: 22000 },
    ],
    youtube: [
      { platform: "youtube", title: "Tech Review", count: 420000 },
      { platform: "youtube", title: "Gaming Highlights", count: 350000 },
      { platform: "youtube", title: "Comedy Sketch", count: 320000 },
      { platform: "youtube", title: "Travel Vlog", count: 280000 },
      { platform: "youtube", title: "Video Trending #1", count: 250000 },
      { platform: "youtube", title: "DIY Tutorial", count: 220000 },
      { platform: "youtube", title: "Fitness Workout", count: 190000 },
      { platform: "youtube", title: "Viral Dance Video", count: 180000 },
      { platform: "youtube", title: "Music Cover", count: 180000 },
      { platform: "youtube", title: "Food Challenge", count: 160000 },
      { platform: "youtube", title: "Movie Review", count: 155000 },
      { platform: "youtube", title: "Fashion Haul", count: 140000 },
      { platform: "youtube", title: "Pet Funny Moments", count: 130000 },
      { platform: "youtube", title: "Recipe Tutorial", count: 125000 },
      { platform: "youtube", title: "Car Review", count: 110000 },
    ],
    tiktok: [
      { platform: "tiktok", title: "Viral Dance Video", count: 750000 },
      { platform: "tiktok", title: "Video Trending #1", count: 500000 },
      { platform: "tiktok", title: "Music Cover", count: 380000 },
      { platform: "tiktok", title: "Food Challenge", count: 320000 },
      { platform: "tiktok", title: "Comedy Sketch", count: 280000 },
      { platform: "tiktok", title: "Fitness Workout", count: 240000 },
      { platform: "tiktok", title: "Travel Vlog", count: 200000 },
      { platform: "tiktok", title: "Gaming Highlights", count: 180000 },
      { platform: "tiktok", title: "DIY Tutorial", count: 160000 },
      { platform: "tiktok", title: "Tech Review", count: 150000 },
      { platform: "tiktok", title: "Pet Funny Moments", count: 145000 },
      { platform: "tiktok", title: "Fashion Haul", count: 135000 },
      { platform: "tiktok", title: "Recipe Tutorial", count: 120000 },
      { platform: "tiktok", title: "Movie Review", count: 115000 },
      { platform: "tiktok", title: "Car Review", count: 95000 },
    ]
  },
  likes: {
    facebook: [
      { platform: "facebook", title: "Viral Dance Video", count: 15000 },
      { platform: "facebook", title: "Music Cover", count: 12500 },
      { platform: "facebook", title: "Video Trending #1", count: 12000 },
      { platform: "facebook", title: "Comedy Sketch", count: 9800 },
      { platform: "facebook", title: "Food Challenge", count: 8500 },
      { platform: "facebook", title: "Tech Review", count: 7200 },
      { platform: "facebook", title: "Travel Vlog", count: 6500 },
      { platform: "facebook", title: "Gaming Highlights", count: 5800 },
      { platform: "facebook", title: "DIY Tutorial", count: 4200 },
      { platform: "facebook", title: "Fitness Workout", count: 3900 },
      { platform: "facebook", title: "Pet Funny Moments", count: 3500 },
      { platform: "facebook", title: "Recipe Tutorial", count: 3200 },
      { platform: "facebook", title: "Movie Review", count: 2800 },
      { platform: "facebook", title: "Fashion Haul", count: 2500 },
      { platform: "facebook", title: "Car Review", count: 2200 },
    ],
    youtube: [
      { platform: "youtube", title: "Tech Review", count: 28000 },
      { platform: "youtube", title: "Gaming Highlights", count: 25000 },
      { platform: "youtube", title: "Comedy Sketch", count: 22000 },
      { platform: "youtube", title: "Travel Vlog", count: 19000 },
      { platform: "youtube", title: "Video Trending #1", count: 18000 },
      { platform: "youtube", title: "DIY Tutorial", count: 16000 },
      { platform: "youtube", title: "Music Cover", count: 15000 },
      { platform: "youtube", title: "Viral Dance Video", count: 14000 },
      { platform: "youtube", title: "Fitness Workout", count: 13000 },
      { platform: "youtube", title: "Food Challenge", count: 12000 },
      { platform: "youtube", title: "Movie Review", count: 11500 },
      { platform: "youtube", title: "Fashion Haul", count: 10400 },
      { platform: "youtube", title: "Pet Funny Moments", count: 9300 },
      { platform: "youtube", title: "Recipe Tutorial", count: 8250 },
      { platform: "youtube", title: "Car Review", count: 7100 },
    ],
    tiktok: [
      { platform: "tiktok", title: "Viral Dance Video", count: 55000 },
      { platform: "tiktok", title: "Video Trending #1", count: 35000 },
      { platform: "tiktok", title: "Music Cover", count: 25000 },
      { platform: "tiktok", title: "Food Challenge", count: 22000 },
      { platform: "tiktok", title: "Comedy Sketch", count: 18000 },
      { platform: "tiktok", title: "Fitness Workout", count: 17000 },
      { platform: "tiktok", title: "Travel Vlog", count: 15000 },
      { platform: "tiktok", title: "Gaming Highlights", count: 12000 },
      { platform: "tiktok", title: "Tech Review", count: 12000 },
      { platform: "tiktok", title: "DIY Tutorial", count: 11000 },
      { platform: "tiktok", title: "Pet Funny Moments", count: 10500 },
      { platform: "tiktok", title: "Fashion Haul", count: 9350 },
      { platform: "tiktok", title: "Recipe Tutorial", count: 8200 },
      { platform: "tiktok", title: "Movie Review", count: 7150 },
      { platform: "tiktok", title: "Car Review", count: 6950 },
    ]
  },
  comments: {
    facebook: [
      { platform: "facebook", title: "Comedy Sketch", count: 1200 },
      { platform: "facebook", title: "Video Trending #1", count: 800 },
      { platform: "facebook", title: "Viral Dance Video", count: 650 },
      { platform: "facebook", title: "Tech Review", count: 580 },
      { platform: "facebook", title: "Food Challenge", count: 450 },
      { platform: "facebook", title: "Music Cover", count: 390 },
      { platform: "facebook", title: "Travel Vlog", count: 280 },
      { platform: "facebook", title: "Gaming Highlights", count: 260 },
      { platform: "facebook", title: "DIY Tutorial", count: 240 },
      { platform: "facebook", title: "Fitness Workout", count: 220 },
      { platform: "facebook", title: "Pet Funny Moments", count: 195 },
      { platform: "facebook", title: "Recipe Tutorial", count: 182 },
      { platform: "facebook", title: "Movie Review", count: 168 },
      { platform: "facebook", title: "Fashion Haul", count: 155 },
      { platform: "facebook", title: "Car Review", count: 142 },
    ],
    youtube: [
      { platform: "youtube", title: "Tech Review", count: 2200 },
      { platform: "youtube", title: "Gaming Highlights", count: 1900 },
      { platform: "youtube", title: "Comedy Sketch", count: 1800 },
      { platform: "youtube", title: "Video Trending #1", count: 1200 },
      { platform: "youtube", title: "Travel Vlog", count: 1100 },
      { platform: "youtube", title: "Music Cover", count: 980 },
      { platform: "youtube", title: "Viral Dance Video", count: 900 },
      { platform: "youtube", title: "DIY Tutorial", count: 850 },
      { platform: "youtube", title: "Food Challenge", count: 750 },
      { platform: "youtube", title: "Fitness Workout", count: 680 },
      { platform: "youtube", title: "Movie Review", count: 655 },
      { platform: "youtube", title: "Fashion Haul", count: 590 },
      { platform: "youtube", title: "Pet Funny Moments", count: 530 },
      { platform: "youtube", title: "Recipe Tutorial", count: 475 },
      { platform: "youtube", title: "Car Review", count: 410 },
    ],
    tiktok: [
      { platform: "tiktok", title: "Viral Dance Video", count: 3200 },
      { platform: "tiktok", title: "Video Trending #1", count: 2500 },
      { platform: "tiktok", title: "Music Cover", count: 1400 },
      { platform: "tiktok", title: "Food Challenge", count: 1300 },
      { platform: "tiktok", title: "Comedy Sketch", count: 1100 },
      { platform: "tiktok", title: "Fitness Workout", count: 900 },
      { platform: "tiktok", title: "Travel Vlog", count: 800 },
      { platform: "tiktok", title: "Gaming Highlights", count: 700 },
      { platform: "tiktok", title: "Tech Review", count: 650 },
      { platform: "tiktok", title: "DIY Tutorial", count: 550 },
      { platform: "tiktok", title: "Pet Funny Moments", count: 485 },
      { platform: "tiktok", title: "Fashion Haul", count: 425 },
      { platform: "tiktok", title: "Recipe Tutorial", count: 380 },
      { platform: "tiktok", title: "Movie Review", count: 315 },
      { platform: "tiktok", title: "Car Review", count: 295 },
    ]
  }
};

// Function để lấy dữ liệu đã lọc - giống như API call thật
export const getFilteredVideoData = (
  platform: 'facebook' | 'youtube' | 'tiktok', 
  metricType: 'views' | 'likes' | 'comments',
  timeFilter: '7days' | '30days' | 'all',
  topCount: 5 | 10 | 15
): VideoPerformanceData[] => {
  // Lấy dữ liệu theo platform và metric type
  const platformData = mockVideoData[metricType][platform];
  
  // BE sẽ filter theo time
  let filteredData = platformData;
  
  if (timeFilter === '7days') {
    // Giả lập lấy 70% dữ liệu
    filteredData = platformData.slice(0, Math.ceil(platformData.length * 0.7));
  } else if (timeFilter === '30days') {
    // Giả lập lấy 85% dữ liệu
    filteredData = platformData.slice(0, Math.ceil(platformData.length * 0.85));
  }
  
  // Trả về top N video
  return filteredData.slice(0, topCount);
};

// Chuyển đổi từ backend format sang format cho biểu đồ
export const convertToChartFormat = (
  backendData: {
    facebook: VideoPerformanceData[];
    youtube: VideoPerformanceData[];
    tiktok: VideoPerformanceData[];
  },
  metricType: 'views' | 'likes' | 'comments'
): VideoStats[] => {
  // Lấy tất cả unique video titles
  const allTitles = new Set<string>();
  Object.values(backendData).forEach(platformData => {
    platformData.forEach(video => allTitles.add(video.title));
  });

  // Chuyển đổi sang VideoStats format
  const videoStats: VideoStats[] = Array.from(allTitles).map((title, index) => {
    const facebookData = backendData.facebook.find(v => v.title === title);
    const youtubeData = backendData.youtube.find(v => v.title === title);
    const tiktokData = backendData.tiktok.find(v => v.title === title);

    return {
      id: (index + 1).toString(),
      title,
      facebook: {
        views: metricType === 'views' ? (facebookData?.count || 0) : 0,
        likes: metricType === 'likes' ? (facebookData?.count || 0) : 0,
        comments: metricType === 'comments' ? (facebookData?.count || 0) : 0,
      },
      youtube: {
        views: metricType === 'views' ? (youtubeData?.count || 0) : 0,
        likes: metricType === 'likes' ? (youtubeData?.count || 0) : 0,
        comments: metricType === 'comments' ? (youtubeData?.count || 0) : 0,
      },
      tiktok: {
        views: metricType === 'views' ? (tiktokData?.count || 0) : 0,
        likes: metricType === 'likes' ? (tiktokData?.count || 0) : 0,
        comments: metricType === 'comments' ? (tiktokData?.count || 0) : 0,
      },
      createdAt: '2025-07-10' 
    };
  });

  return videoStats.sort((a, b) => {
    const aTotal = a.facebook[metricType] + a.youtube[metricType] + a.tiktok[metricType];
    const bTotal = b.facebook[metricType] + b.youtube[metricType] + b.tiktok[metricType];
    return bTotal - aTotal;
  });
};

// export const mockVideoStats: VideoStats[] = [
//   {
//     id: '1',
//     title: 'Video Trending #1',
//     facebook: { views: 150000, likes: 12000, comments: 800 },
//     youtube: { views: 250000, likes: 18000, comments: 1200 },
//     tiktok: { views: 500000, likes: 35000, comments: 2500 },
//     createdAt: '2025-07-10'
//   },
//   {
//     id: '2', 
//     title: 'Viral Dance Video',
//     facebook: { views: 120000, likes: 9500, comments: 650 },
//     youtube: { views: 180000, likes: 14000, comments: 900 },
//     tiktok: { views: 750000, likes: 55000, comments: 3200 },
//     createdAt: '2025-07-09'
//   },
//   {
//     id: '3',
//     title: 'Comedy Sketch',
//     facebook: { views: 95000, likes: 7800, comments: 420 },
//     youtube: { views: 320000, likes: 22000, comments: 1800 },
//     tiktok: { views: 280000, likes: 18000, comments: 1100 },
//     createdAt: '2025-07-08'
//   },
//   {
//     id: '4',
//     title: 'Tech Review',
//     facebook: { views: 80000, likes: 6200, comments: 380 },
//     youtube: { views: 420000, likes: 28000, comments: 2200 },
//     tiktok: { views: 150000, likes: 12000, comments: 650 },
//     createdAt: '2025-07-07'
//   },
//   {
//     id: '5',
//     title: 'Music Cover',
//     facebook: { views: 70000, likes: 5800, comments: 290 },
//     youtube: { views: 180000, likes: 15000, comments: 980 },
//     tiktok: { views: 380000, likes: 25000, comments: 1400 },
//     createdAt: '2025-07-06'
//   },
//   {
//     id: '6',
//     title: 'Food Challenge',
//     facebook: { views: 65000, likes: 5200, comments: 240 },
//     youtube: { views: 160000, likes: 12000, comments: 750 },
//     tiktok: { views: 320000, likes: 22000, comments: 1300 },
//     createdAt: '2025-07-05'
//   },
//   {
//     id: '7',
//     title: 'Travel Vlog',
//     facebook: { views: 55000, likes: 4500, comments: 180 },
//     youtube: { views: 280000, likes: 19000, comments: 1100 },
//     tiktok: { views: 200000, likes: 15000, comments: 800 },
//     createdAt: '2025-06-20'
//   },
//   {
//     id: '8',
//     title: 'Gaming Highlights',
//     facebook: { views: 48000, likes: 3800, comments: 160 },
//     youtube: { views: 350000, likes: 25000, comments: 1900 },
//     tiktok: { views: 180000, likes: 12000, comments: 700 },
//     createdAt: '2025-06-15'
//   },
//   {
//     id: '9',
//     title: 'DIY Tutorial',
//     facebook: { views: 42000, likes: 3200, comments: 140 },
//     youtube: { views: 220000, likes: 16000, comments: 850 },
//     tiktok: { views: 160000, likes: 11000, comments: 550 },
//     createdAt: '2025-06-10'
//   },
//   {
//     id: '10',
//     title: 'Fitness Workout',
//     facebook: { views: 38000, likes: 2900, comments: 120 },
//     youtube: { views: 190000, likes: 13000, comments: 680 },
//     tiktok: { views: 240000, likes: 17000, comments: 900 },
//     createdAt: '2025-06-05'
//   }
// ];