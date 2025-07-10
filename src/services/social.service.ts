const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const SocialService = {
  uploadVideoToYouTube: async (
    mediaId: string,
    title: string,
    description: string,
    tags: string[] = [],
    privacy_status: string = "public"
  ): Promise<string> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('platform', 'google');
    formData.append('media_id', mediaId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('tags', tags.join(','));
    formData.append('privacy_status', privacy_status);

    const response = await fetch(`${API_BASE_URL}/social/upload-video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload video to YouTube');
    }
    return response.text(); // trả về link YouTube
  },
  
  uploadVideoToFacebook: async (
    mediaId: string,
    title: string,
    description: string,
    pageId: string
  ): Promise<Response> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('platform', 'facebook');
    formData.append('media_id', mediaId);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('page_id', pageId);

    const response = await fetch(`${API_BASE_URL}/social/upload-video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload video to YouTube');
    }
    return response;
  },
  uploadVideoToTikTok: async (
    mediaId: string,
    title: string,
  ): Promise<Response> => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('platform', 'tiktok');
    formData.append('media_id', mediaId);
    formData.append('title', title);

    const response = await fetch(`${API_BASE_URL}/social/upload-video`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload video to TikTok');
    }
    return response;
  }
};

