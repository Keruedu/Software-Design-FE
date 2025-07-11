const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export type TopVideo = {
  platform: string;
  title: string;
  count: number;
};

export const AnalystService = {
  AnalystStatistic: async (
    platform: string,
    startDate: string,
    endDate: string,
    typeStatistic: string,
    maxResult:number = 10
  ): Promise<TopVideo[]> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('platform', platform);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('type_sta', typeStatistic);
    formData.append('max_results', maxResult.toString());

    const response = await fetch(`${API_BASE_URL}/social/top-video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) {
    //   const error = await response.json();
    //   throw new Error(error.detail || 'Failed to upload video to YouTube');
    console.error('Failed to fetch top videos:', response.statusText);
    }
    const data = await response.json();
    return data as TopVideo[];
  }}