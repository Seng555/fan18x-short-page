import axios from 'axios';



/**
 * Fetch random videos from API and return sanitized Video[]
 */
export async function getRandomVideos(readyId: string[]): Promise<Video[]> {
  try {
    const response = await axios.get<RandomVideosResponse>(
      'https://api.fan18x.com/api/video/random',
      {
        params: {
          recentIds: readyId,  // ส่ง _id ของวิดีโอที่เพิ่งแสดง
        }
      }
    );

    const videos = response.data.data;
    //console.log(videos);
    
    // sanitize title and uploadedBy
    const sanitized: Video[] = videos.map(v => ({
      _id: v._id,
      title:v.title,
      thumbnailUrl: v.thumbnailUrl,
      previewUrl: v.previewUrl,
      url: v.url,
      duration: v.duration,
      views: v.views,
      likes: v.likes,
      createdAt: v.createdAt,
      uploadedBy: {
        _id: v.uploadedBy?._id ?? '',
        name: v.uploadedBy?.name ?? 'Unknown',
      },
    }));

    return sanitized;
  } catch (error) {
    console.error('Error fetching random videos:', error);
    return [];
  }
}
