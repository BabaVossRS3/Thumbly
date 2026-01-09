import { Request, Response } from "express";
import { oauth2Client } from "../configs/youtube.js";
import { google } from "googleapis";
import YouTubeToken from "../models/YouTubeToken.js";
import VideoMetadata from "../models/VideoMetadata.js";
import Thumbnail from "../models/Thumbnail.js";
import { generateVideoMetadata } from "../services/AIMetadataService.js";
import axios from "axios";
import fs from "fs";
import path from "path";

export const getAuthUrl = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ];

    // Manually construct the OAuth URL to avoid library issues
    const params = new URLSearchParams();
    params.append('client_id', process.env.YOUTUBE_CLIENT_ID || '');
    params.append('redirect_uri', process.env.YOUTUBE_REDIRECT_URI || '');
    params.append('response_type', 'code');
    params.append('scope', scopes.join(' '));
    params.append('access_type', 'offline');
    params.append('prompt', 'consent');
    params.append('state', userId || '');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ message: "An error occurred while generating auth URL" });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const userId = state as string;

    if (!code) {
      throw new Error("No authorization code provided");
    }

    if (!userId) {
      throw new Error("Invalid state parameter");
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    
    const existingToken = await YouTubeToken.findOne({ userId });
    
    await YouTubeToken.findOneAndUpdate(
      { userId },
      {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || existingToken?.refreshToken,
        expiryDate: tokens.expiry_date!,
      },
      { upsert: true, new: true }
    );

    res.redirect(`${process.env.FRONTEND_URL}/youtube?youtube=connected`);
  } catch (error: any) {
    console.error("Error handling OAuth callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/youtube?youtube=error`);
  }
};

export const checkYouTubeConnection = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    const token = await YouTubeToken.findOne({ userId });

    if (!token) {
      return res.json({ connected: false });
    }

    if (token.expiryDate < Date.now()) {
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      token.accessToken = credentials.access_token!;
      token.expiryDate = credentials.expiry_date!;
      await token.save();
    }

    res.json({ connected: true });
  } catch (error: any) {
    console.error("Error checking YouTube connection:", error);
    res.status(500).json({ message: "An error occurred while checking YouTube connection" });
  }
};

export const disconnectYouTube = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    await YouTubeToken.findOneAndDelete({ userId });

    res.json({ message: "YouTube account disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting YouTube:", error);
    res.status(500).json({ message: "An error occurred while disconnecting YouTube" });
  }
};

export const generateMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { videoTopic, thumbnailId, additionalContext } = req.body;

    if (!videoTopic) {
      return res.status(400).json({ message: "Video topic is required" });
    }

    let thumbnailStyle;
    if (thumbnailId) {
      const thumbnail = await Thumbnail.findOne({ _id: thumbnailId, userId });
      thumbnailStyle = thumbnail?.style;
    }

    const metadata = await generateVideoMetadata(
      videoTopic,
      thumbnailStyle,
      additionalContext
    );

    const videoMetadata = await VideoMetadata.create({
      userId,
      thumbnailId,
      videoTitle: metadata.title,
      videoDescription: metadata.description,
      tags: metadata.tags,
      category: metadata.category,
    });

    res.json({ 
      message: "Metadata generated successfully", 
      metadata: videoMetadata 
    });
  } catch (error: any) {
    console.error("Error generating metadata:", error);
    res.status(500).json({ message: "An error occurred while generating metadata" });
  }
};

export const setThumbnail = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { videoId, thumbnailId } = req.body;

    if (!videoId || !thumbnailId) {
      return res.status(400).json({ 
        message: "Video ID and Thumbnail ID are required" 
      });
    }

    const token = await YouTubeToken.findOne({ userId });
    if (!token) {
      return res.status(401).json({ 
        message: "YouTube account not connected" 
      });
    }

    const thumbnail = await Thumbnail.findOne({ _id: thumbnailId, userId });
    if (!thumbnail || !thumbnail.image_url) {
      return res.status(404).json({ message: "Thumbnail not found" });
    }

    if (token.expiryDate < Date.now()) {
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });
      const { credentials } = await oauth2Client.refreshAccessToken();
      token.accessToken = credentials.access_token!;
      token.expiryDate = credentials.expiry_date!;
      await token.save();
    }

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    // Create a fresh YouTube client with the authenticated credentials
    const youtubeClient = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const imageResponse = await axios.get(thumbnail.image_url, {
      responseType: 'arraybuffer'
    });
    const imageBuffer = Buffer.from(imageResponse.data);

    const tempPath = path.join('images', `temp-${Date.now()}.png`);
    fs.mkdirSync('images', { recursive: true });
    fs.writeFileSync(tempPath, imageBuffer);

    try {
      await youtubeClient.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(tempPath),
        },
      });
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    res.json({ message: "Thumbnail set successfully" });
  } catch (error: any) {
    console.error("Error setting thumbnail:", error);
    res.status(500).json({ message: "An error occurred while setting thumbnail" });
  }
};

export const updateVideoMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { videoId, title, description, tags, category } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ 
        message: "Video ID and title are required" 
      });
    }

    const token = await YouTubeToken.findOne({ userId });
    if (!token) {
      return res.status(401).json({ 
        message: "YouTube account not connected" 
      });
    }

    if (token.expiryDate < Date.now()) {
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });
      const { credentials } = await oauth2Client.refreshAccessToken();
      token.accessToken = credentials.access_token!;
      token.expiryDate = credentials.expiry_date!;
      await token.save();
    }

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    // Create a fresh YouTube client with the authenticated credentials
    const youtubeClient = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Fetch current video snippet to preserve existing fields
    const currentVideo = await youtubeClient.videos.list({
      part: ['snippet'],
      id: [videoId],
    });

    if (!currentVideo.data.items || currentVideo.data.items.length === 0) {
      return res.status(404).json({ message: "Video not found" });
    }

    const currentSnippet = currentVideo.data.items[0].snippet;

    // Build update object with all required fields
    const updateSnippet: any = {
      title: title || currentSnippet?.title,
      description: description !== undefined ? description : currentSnippet?.description,
      channelId: currentSnippet?.channelId,
      categoryId: category || currentSnippet?.categoryId,
    };

    // Add tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      updateSnippet.tags = tags;
    } else if (currentSnippet?.tags) {
      updateSnippet.tags = currentSnippet.tags;
    }

    // Update video metadata on YouTube
    await youtubeClient.videos.update({
      part: ['snippet'],
      requestBody: {
        id: videoId,
        snippet: updateSnippet,
      },
    });

    res.json({ message: "Video metadata updated successfully" });
  } catch (error: any) {
    console.error("Error updating video metadata:", error);
    res.status(500).json({ message: "An error occurred while updating video metadata" });
  }
};

export const getVideoMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const metadata = await VideoMetadata.findOne({ _id: id, userId })
      .populate('thumbnailId');

    if (!metadata) {
      return res.status(404).json({ message: "Metadata not found" });
    }

    res.json({ metadata });
  } catch (error: any) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ message: "An error occurred while fetching metadata" });
  }
};

export const getAllVideoMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    const metadata = await VideoMetadata.find({ userId })
      .populate('thumbnailId')
      .sort({ createdAt: -1 });

    res.json({ metadata });
  } catch (error: any) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ message: "An error occurred while fetching metadata" });
  }
};

export const deleteVideoMetadata = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const result = await VideoMetadata.findOneAndDelete({ _id: id, userId });

    if (!result) {
      return res.status(404).json({ message: "Metadata not found" });
    }

    res.json({ message: "Metadata deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting metadata:", error);
    res.status(500).json({ message: "An error occurred while deleting metadata" });
  }
};

export const getMyYouTubeVideos = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    const token = await YouTubeToken.findOne({ userId });
    if (!token) {
      return res.status(401).json({ message: "YouTube account not connected" });
    }

    if (token.expiryDate < Date.now()) {
      oauth2Client.setCredentials({
        refresh_token: token.refreshToken,
      });
      const { credentials } = await oauth2Client.refreshAccessToken();
      token.accessToken = credentials.access_token!;
      token.expiryDate = credentials.expiry_date!;
      await token.save();
    }

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    // Create a fresh YouTube client with the authenticated credentials
    const youtubeClient = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const response = await youtubeClient.search.list({
      part: ['snippet'],
      forMine: true,
      maxResults: 50,
      type: ['video'],
      order: 'date',
    });

    const videos = (response.data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
    }));

    res.json({ videos });
  } catch (error: any) {
    console.error("Error fetching YouTube videos:", error);
    res.status(500).json({ message: "An error occurred while fetching YouTube videos" });
  }
};
