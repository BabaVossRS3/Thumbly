import mongoose, { Document } from "mongoose";

export interface IYouTubeToken extends Document {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  createdAt: Date;
  updatedAt: Date;
}

const YouTubeTokenSchema = new mongoose.Schema<IYouTubeToken>({
  userId: { type: String, ref: "User", required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  expiryDate: { type: Number, required: true },
},{
  timestamps: true
});

const YouTubeToken = (mongoose.models.YouTubeToken as mongoose.Model<IYouTubeToken>) || mongoose.model<IYouTubeToken>('YouTubeToken', YouTubeTokenSchema);

export default YouTubeToken;
