import { X, Copy, Check, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { YouTubeProject } from "@/types";

interface YouTubeProjectPreviewProps {
  project: YouTubeProject | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function YouTubeProjectPreview({
  project,
  isOpen,
  onClose,
  onDelete,
}: YouTubeProjectPreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management - focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur p-4 overflow-hidden"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div 
        ref={modalRef}
        className="rounded-2xl bg-zinc-900 border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-zinc-900">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-zinc-200">{project.projectName}</h2>
            <p id="modal-description" className="sr-only">
              Project preview showing video title, description, tags, and category for {project.projectName}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition focus:outline-none focus:ring-2 focus:ring-pink-500 rounded"
            aria-label="Close project preview"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {project.thumbnailUrl && (
            <div className="rounded-lg overflow-hidden bg-black">
              <img
                src={project.thumbnailUrl}
                alt={project.projectName}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Project Info */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Video Title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Video Title</label>
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white/6 border border-white/10">
              <p className="text-sm text-zinc-200 flex-grow">{project.videoTitle}</p>
              <button
                onClick={() => handleCopy(project.videoTitle, "Title")}
                className="flex-shrink-0 text-zinc-500 hover:text-pink-400 transition focus:outline-none focus:ring-2 focus:ring-pink-500 rounded p-1"
                aria-label="Copy title to clipboard"
                title={copied === "Title" ? "Copied!" : "Copy to clipboard"}
              >
                {copied === "Title" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Video Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Video Description</label>
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white/6 border border-white/10">
              <p className="text-sm text-zinc-200 flex-grow max-h-32 overflow-y-auto">
                {project.videoDescription}
              </p>
              <button
                onClick={() => handleCopy(project.videoDescription, "Description")}
                className="flex-shrink-0 text-zinc-500 hover:text-pink-400 transition focus:outline-none focus:ring-2 focus:ring-pink-500 rounded p-1"
                aria-label="Copy description to clipboard"
                title={copied === "Description" ? "Copied!" : "Copy to clipboard"}
              >
                {copied === "Description" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Tags ({project.tags.length})</label>
            <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-white/6 border border-white/10">
              <div className="flex flex-wrap gap-2 flex-grow">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleCopy(project.tags.join(", "), "Tags")}
                className="flex-shrink-0 text-zinc-500 hover:text-pink-400 transition focus:outline-none focus:ring-2 focus:ring-pink-500 rounded p-1"
                aria-label="Copy tags to clipboard"
                title={copied === "Tags" ? "Copied!" : "Copy to clipboard"}
              >
                {copied === "Tags" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Category</label>
            <div className="p-3 rounded-lg bg-white/6 border border-white/10">
              <p className="text-sm text-zinc-200">{project.category}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/6 border border-white/10 text-zinc-200 hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-pink-500"
              aria-label="Close project preview"
            >
              Close
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(project._id);
                  onClose();
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete project"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
