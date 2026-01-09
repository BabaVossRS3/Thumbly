import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

interface Thumbnail {
  _id: string;
  title: string;
  image_url: string;
  aspect_ratio: string;
}

interface ThumbnailSelectorProps {
  onSelect: (thumbnailId: string) => void;
  selectedId?: string;
}

export default function ThumbnailSelector({ onSelect, selectedId }: ThumbnailSelectorProps) {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchThumbnails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/user/thumbnails");
        setThumbnails(data.thumbnails || []);
      } catch (error: any) {
        console.error("Error fetching thumbnails:", error);
        toast.error("Failed to load thumbnails");
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnails();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (thumbnails.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-zinc-400">
          No thumbnails found. <a href="/generate" className="text-pink-500 hover:text-pink-400">Generate one first</a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-zinc-300 block">
        Select a Thumbnail
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {thumbnails.map((thumb) => (
          <button
            key={thumb._id}
            onClick={() => onSelect(thumb._id)}
            className={`relative rounded-lg overflow-hidden border-2 transition-all ${
              selectedId === thumb._id
                ? "border-pink-500 ring-2 ring-pink-500/50"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <img
              src={thumb.image_url}
              alt={thumb.title}
              className="w-full h-24 object-cover"
            />
            {selectedId === thumb._id && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-400" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
              <p className="text-xs text-zinc-200 truncate">{thumb.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
