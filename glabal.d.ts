interface UploadedBy {
  _id?: string;
  name?: string;
}
interface Video {
  _id: string;
  title: { en?: string; th?: string }; // แนะนำให้ใช้ object ถ้า title มีหลายภาษา
  thumbnailUrl: string;
  previewUrl: string;
  url: string;
  duration: number;
  views: number;
  likes: number;
  createdAt: string; // ISO string
  uploadedBy: UploadedBy;
}
interface RandomVideosResponse {
  success: true;
  data: Video[];
  message: string;
}
