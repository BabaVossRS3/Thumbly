import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2, X } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";
import type { YouTubeProject } from "@/types";

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
}

interface UploadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: YouTubeProject | null;
  onUploadSuccess?: () => void;
}

export default function UploadProjectModal({
  isOpen,
  onClose,
  project,
  onUploadSuccess,
}: UploadProjectModalProps) {
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleOpenModal = async () => {
    try {
      setLoadingVideos(true);
      const { data } = await api.get("/api/youtube/my-videos");
      setVideos(data.videos || []);
      setSelectedVideoId("");
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load your YouTube videos");
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedVideoId) {
      toast.error("Please select a video");
      return;
    }

    if (!project) return;

    try {
      setUploading(true);

      // First, update the video metadata (title, description, tags)
      await api.post("/api/youtube/update-metadata", {
        videoId: selectedVideoId,
        title: project.videoTitle,
        description: project.videoDescription,
        tags: project.tags,
        category: project.category,
      });

      // Then, upload the thumbnail
      await api.post("/api/youtube/set-thumbnail", {
        videoId: selectedVideoId,
        thumbnailId: project.thumbnailId,
      });

      toast.success("Video updated with metadata and thumbnail!");
      onUploadSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error?.response?.data?.message || "Failed to upload to YouTube");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="rounded-2xl bg-zinc-900 border border-white/10 p-8 max-w-md w-full mx-4 space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-200">Upload to YouTube</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400">
          Select a YouTube video to upload the thumbnail from "{project.projectName}"
        </p>

        {!loadingVideos && videos.length === 0 && (
          <Button
            onClick={handleOpenModal}
            variant="outline"
            className="w-full! bg-transparent! border-white/10! hover:bg-white/10 hover:text-white"
          >
            Load Your Videos
          </Button>
        )}

        {loadingVideos && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        )}

        {videos.length > 0 && (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {videos.map((video) => (
              <button
                key={video.videoId}
                onClick={() => setSelectedVideoId(video.videoId)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition-all text-left ${
                  selectedVideoId === video.videoId
                    ? "border-pink-500 bg-pink-500/10"
                    : "border-white/10 hover:border-white/20 bg-white/6"
                }`}
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">
                    {video.title}
                  </p>
                  <p className="text-xs text-zinc-500">{video.videoId}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={uploading}
            className="flex-1! bg-transparent! border-white/10! hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedVideoId || loadingVideos}
            className="flex-1! bg-gradient-to-r! from-pink-500! to-purple-600! hover:from-pink-600! hover:to-purple-700!"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
