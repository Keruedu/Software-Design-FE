export interface GeneratedVideo {
  id: string;
  url: string;
  title: string;
  duration: number;
  createdAt: string;
  thumbnail?: string;
}

export interface MonthlyVideoStats {
  month: number;
  total_videos: number;
  total_views: number;
  total_duration: number;
  video_count: number;
}

export interface VideoStats {
  year: number;
  month?: number;
  total_videos: number;
  total_views: number;
  total_duration: number;
  monthly_breakdown?: { [key: number]: MonthlyVideoStats };
  videos_this_month?: number;
  videos?: any[];
}