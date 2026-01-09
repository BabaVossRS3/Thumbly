import { Trash2, Copy, Check, Upload, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { YouTubeProject } from "@/types";

interface YouTubeProjectCardProps {
  project: YouTubeProject;
  onDelete: (id: string) => void;
  onPreview?: (project: YouTubeProject) => void;
  onUpload?: (project: YouTubeProject) => void;
}

export default function YouTubeProjectCard({ project, onDelete, onPreview, onUpload }: YouTubeProjectCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-2xl bg-white/6 border border-white/10 overflow-hidden hover:border-white/20 transition-all group cursor-pointer" onClick={() => onPreview?.(project)}>
      {/* Thumbnail */}
      {project.thumbnailUrl && (
        <div className="relative aspect-video bg-black overflow-hidden">
          <img
            src={project.thumbnailUrl}
            alt={project.projectName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Project Name */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 truncate">
            {project.projectName}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Video Title */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400">Title</p>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-zinc-300 line-clamp-2">{project.videoTitle}</p>
            <button
              onClick={() => handleCopy(project.videoTitle, "Title")}
              className="flex-shrink-0 text-zinc-500 hover:text-pink-400 transition"
            >
              {copied === "Title" ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-400">Tags ({project.tags.length})</p>
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded text-xs text-zinc-500">
                +{project.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            {project.uploadedToYouTube ? (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <Upload className="w-3 h-3" />
                Uploaded
              </div>
            ) : (
              <span className="text-xs text-zinc-500">Not uploaded</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.(project);
              }}
              className="text-zinc-500 hover:text-blue-400 transition"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            {!project.uploadedToYouTube && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload?.(project);
                }}
                className="text-zinc-500 hover:text-green-400 transition"
                title="Upload"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project._id);
              }}
              className="text-zinc-500 hover:text-red-400 transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
