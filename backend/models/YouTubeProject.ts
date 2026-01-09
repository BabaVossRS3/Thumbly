import mongoose, { Document } from "mongoose";

export interface IYouTubeProject extends Document {
  userId: string;
  thumbnailId?: string;
  videoMetadataId?: string;
  projectName: string;
  videoTitle: string;
  videoDescription: string;
  tags: string[];
  category: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  uploadedToYouTube: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const YouTubeProjectSchema = new mongoose.Schema<IYouTubeProject>({
  userId: { type: String, ref: "User", required: true },
  thumbnailId: { type: String, ref: "Thumbnail" },
  videoMetadataId: { type: String, ref: "VideoMetadata" },
  projectName: { type: String, required: true, trim: true },
  videoTitle: { type: String, required: true, trim: true },
  videoDescription: { type: String, required: true, trim: true },
  tags: [{ type: String }],
  category: { type: String, default: "22" },
  thumbnailUrl: { type: String },
  youtubeVideoId: { type: String },
  uploadedToYouTube: { type: Boolean, default: false },
},{
  timestamps: true
});

const YouTubeProject = (mongoose.models.YouTubeProject as mongoose.Model<IYouTubeProject>) || mongoose.model<IYouTubeProject>('YouTubeProject', YouTubeProjectSchema);

export default YouTubeProject;
