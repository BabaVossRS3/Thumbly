import { Request, Response } from "express";
import YouTubeProject from "../models/YouTubeProject.js";
import Thumbnail from "../models/Thumbnail.js";

export const createYouTubeProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const {
      projectName,
      videoTitle,
      videoDescription,
      tags,
      category,
      thumbnailId,
      videoMetadataId,
      youtubeVideoId,
    } = req.body;

    if (!projectName || !videoTitle || !videoDescription) {
      return res.status(400).json({
        message: "Project name, video title, and description are required",
      });
    }

    let thumbnailUrl;
    if (thumbnailId) {
      const thumbnail = await Thumbnail.findOne({ _id: thumbnailId, userId });
      if (thumbnail) {
        thumbnailUrl = thumbnail.image_url;
      }
    }

    const project = await YouTubeProject.create({
      userId,
      projectName,
      videoTitle,
      videoDescription,
      tags: tags || [],
      category: category || "22",
      thumbnailId,
      videoMetadataId,
      thumbnailUrl,
      youtubeVideoId,
      uploadedToYouTube: !!youtubeVideoId,
    });

    res.json({ message: "Project created successfully", project });
  } catch (error: any) {
    console.error("Error creating YouTube project:", error);
    res.status(500).json({ message: "An error occurred while creating the project" });
  }
};

export const getMyYouTubeProjects = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;

    const projects = await YouTubeProject.find({ userId })
      .populate("thumbnailId")
      .populate("videoMetadataId")
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error: any) {
    console.error("Error fetching YouTube projects:", error);
    res.status(500).json({ message: "An error occurred while fetching projects" });
  }
};

export const getYouTubeProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const project = await YouTubeProject.findOne({ _id: id, userId })
      .populate("thumbnailId")
      .populate("videoMetadataId");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ project });
  } catch (error: any) {
    console.error("Error fetching YouTube project:", error);
    res.status(500).json({ message: "An error occurred while fetching the project" });
  }
};

export const updateYouTubeProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;
    const { projectName, videoTitle, videoDescription, tags, category, youtubeVideoId } = req.body;

    const updateData: any = {};
    if (projectName !== undefined) updateData.projectName = projectName;
    if (videoTitle !== undefined) updateData.videoTitle = videoTitle;
    if (videoDescription !== undefined) updateData.videoDescription = videoDescription;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (youtubeVideoId !== undefined) {
      updateData.youtubeVideoId = youtubeVideoId;
      updateData.uploadedToYouTube = !!youtubeVideoId;
    }

    const project = await YouTubeProject.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project updated successfully", project });
  } catch (error: any) {
    console.error("Error updating YouTube project:", error);
    res.status(500).json({ message: "An error occurred while updating the project" });
  }
};

export const deleteYouTubeProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.session;
    const { id } = req.params;

    const result = await YouTubeProject.findOneAndDelete({ _id: id, userId });

    if (!result) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting YouTube project:", error);
    res.status(500).json({ message: "An error occurred while deleting the project" });
  }
};
