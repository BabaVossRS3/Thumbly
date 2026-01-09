import mongoose, { Document } from "mongoose";

export interface IVideoMetadata extends Document {
  userId: string;
  thumbnailId?: string;
  videoTitle: string;
  videoDescription: string;
  tags: string[];
  category: string;
  youtubeVideoId?: string;
  uploadStatus: 'pending' | 'uploaded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const VideoMetadataSchema = new mongoose.Schema<IVideoMetadata>({
  userId: { type: String, ref: "User", required: true },
  thumbnailId: { type: String, ref: "Thumbnail" },
  videoTitle: { type: String, required: true, trim: true },
  videoDescription: { type: String, required: true, trim: true },
  tags: [{ type: String }],
  category: { type: String, default: "22" },
  youtubeVideoId: { type: String },
  uploadStatus: { 
    type: String, 
    enum: ['pending', 'uploaded', 'failed'],
    default: 'pending'
  },
},{
  timestamps: true
});

const VideoMetadata = (mongoose.models.VideoMetadata as mongoose.Model<IVideoMetadata>) || mongoose.model<IVideoMetadata>('VideoMetadata', VideoMetadataSchema);

export default VideoMetadata;
