import { useEffect, useState } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
}

interface YouTubeVideoSelectorProps {
  onSelect: (videoId: string) => void;
  selectedId?: string;
}

export default function YouTubeVideoSelector({ onSelect, selectedId }: YouTubeVideoSelectorProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/api/youtube/my-videos");
        setVideos(data.videos || []);
      } catch (error: any) {
        console.error("Error fetching YouTube videos:", error);
        const errorMsg = error?.response?.data?.message || "Failed to load videos";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <p className="text-xs text-red-400">{error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-zinc-400">
          No videos found. Upload a video to YouTube first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-zinc-300 block">
        Select a YouTube Video
      </label>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {videos.map((video) => (
          <button
            key={video.videoId}
            onClick={() => onSelect(video.videoId)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition-all text-left ${
              selectedId === video.videoId
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
            {selectedId === video.videoId && (
              <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
