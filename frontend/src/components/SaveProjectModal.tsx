import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2, X } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle?: string;
  videoDescription?: string;
  tags?: string[];
  category?: string;
  thumbnailId?: string;
  thumbnailUrl?: string;
  onSaveSuccess?: () => void;
}

export default function SaveProjectModal({
  isOpen,
  onClose,
  videoTitle,
  videoDescription,
  tags,
  category,
  thumbnailId,
  thumbnailUrl,
  onSaveSuccess,
}: SaveProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!projectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    try {
      setSaving(true);
      await api.post("/api/youtube-projects", {
        projectName,
        videoTitle: videoTitle || "Untitled Video",
        videoDescription: videoDescription || "",
        tags: tags || [],
        category: category || "22",
        thumbnailId,
        thumbnailUrl,
      });
      toast.success("Project saved successfully!");
      setProjectName("");
      onClose();
      onSaveSuccess?.();
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast.error(error?.response?.data?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
      <div className="rounded-2xl bg-zinc-900 border border-white/10 p-8 max-w-md w-full mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-200">Save Project</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-400">
          Give your project a name so you can find it later in "My Generations"
        </p>

        <div>
          <label className="text-sm font-medium text-zinc-300 mb-2 block">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., React Tutorial Thumbnail"
            className="w-full px-4 py-2 rounded-lg bg-white/6 border border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50"
            disabled={saving}
          />
        </div>

        <div className="space-y-2 text-sm">
          {videoTitle && (
            <p className="text-zinc-400">
              <strong>Title:</strong> {videoTitle.substring(0, 50)}...
            </p>
          )}
          {tags && tags.length > 0 && (
            <p className="text-zinc-400">
              <strong>Tags:</strong> {tags.length} tags
            </p>
          )}
          {!videoTitle && !tags && (
            <p className="text-zinc-500 italic">No metadata generated yet - you can add it later</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            disabled={saving}
            className="flex-1 !bg-white/10 !border !border-white/20 !text-white !hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !projectName.trim()}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Project"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
