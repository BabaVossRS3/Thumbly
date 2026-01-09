import { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

interface GeneratedMetadata {
  videoTitle: string;
  videoDescription: string;
  tags: string[];
  category: string;
}

interface MetadataGeneratorProps {
  thumbnailId?: string;
  onMetadataGenerated?: (metadata: GeneratedMetadata) => void;
  onMetadataUpdated?: (metadata: GeneratedMetadata) => void;
}

export default function MetadataGenerator({ thumbnailId, onMetadataGenerated, onMetadataUpdated }: MetadataGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [videoTopic, setVideoTopic] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [metadata, setMetadata] = useState<GeneratedMetadata | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    if (!videoTopic.trim()) {
      toast.error("Please enter a video topic");
      return;
    }

    try {
      setGenerating(true);
      const { data } = await api.post("/api/youtube/generate-metadata", {
        videoTopic,
        thumbnailId,
        additionalContext,
      });
      setMetadata(data.metadata);
      setEditedTitle(data.metadata.videoTitle);
      setEditedDescription(data.metadata.videoDescription);
      setEditedTags(data.metadata.tags);
      setIsEditing(false);
      toast.success("Metadata generated successfully!");
      onMetadataGenerated?.({
        videoTitle: data.metadata.videoTitle,
        videoDescription: data.metadata.videoDescription,
        tags: data.metadata.tags,
        category: data.metadata.category,
      });
    } catch (error: any) {
      console.error("Error generating metadata:", error);
      toast.error(error?.response?.data?.message || "Failed to generate metadata");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveChanges = () => {
    if (!editedTitle.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    if (!editedDescription.trim()) {
      toast.error("Description cannot be empty");
      return;
    }

    if (editedTags.length === 0) {
      toast.error("Please add at least one tag");
      return;
    }

    if (metadata) {
      setMetadata({
        ...metadata,
        videoTitle: editedTitle,
        videoDescription: editedDescription,
        tags: editedTags,
      });
      const updatedMetadata: GeneratedMetadata = {
        videoTitle: editedTitle,
        videoDescription: editedDescription,
        tags: editedTags,
        category: metadata.category,
      };
      onMetadataUpdated?.(updatedMetadata);
      setIsEditing(false);
      toast.success("Metadata updated successfully!");
    }
  };

  const handleCancelEdit = () => {
    if (metadata) {
      setEditedTitle(metadata.videoTitle);
      setEditedDescription(metadata.videoDescription);
      setEditedTags(metadata.tags);
    }
    setIsEditing(false);
  };

  const handleAddTag = (newTag: string) => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter(tag => tag !== tagToRemove));
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    toast.success(`${field} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-zinc-200 mb-2 block">
            Video Topic *
          </label>
          <input
            type="text"
            value={videoTopic}
            onChange={(e) => setVideoTopic(e.target.value)}
            placeholder="e.g., How to build a React app from scratch"
            className="w-full px-4 py-2 rounded-lg bg-white/6 border border-white/10 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-200 mb-2 block">
            Additional Context (Optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any extra details about your video..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-white/6 border border-white/10 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/50 resize-none"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating AI Metadata...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Metadata
            </>
          )}
        </Button>
      </div>

      {metadata && (
        <div className="space-y-4 p-6 rounded-xl bg-white/6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-200">Generated Metadata</h3>
            <button
              onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
              className="text-xs px-3 py-1 rounded-md bg-pink-500/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 transition"
            >
              {isEditing ? "Cancel" : "Edit"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Title</label>
                {!isEditing && (
                  <button
                    onClick={() => handleCopy(editedTitle, "Title")}
                    className="text-xs text-zinc-400 hover:text-pink-500 flex items-center gap-1"
                  >
                    {copied === "Title" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-pink-500/50"
                />
              ) : (
                <div className="p-3 rounded-lg bg-black/30 text-sm text-zinc-200">
                  {editedTitle}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Description</label>
                {!isEditing && (
                  <button
                    onClick={() => handleCopy(editedDescription, "Description")}
                    className="text-xs text-zinc-400 hover:text-pink-500 flex items-center gap-1"
                  >
                    {copied === "Description" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-pink-500/50 resize-none"
                />
              ) : (
                <div className="p-3 rounded-lg bg-black/30 text-sm text-zinc-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {editedDescription}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-zinc-300">Tags</label>
                {!isEditing && (
                  <button
                    onClick={() => handleCopy(editedTags.join(", "), "Tags")}
                    className="text-xs text-zinc-400 hover:text-pink-500 flex items-center gap-1"
                  >
                    {copied === "Tags" ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-md bg-pink-500/20 border border-pink-500/30 text-xs text-pink-400 flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-pink-300 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add new tag and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddTag(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/50"
                  />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editedTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded-md bg-pink-500/10 border border-pink-500/20 text-xs text-pink-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">Category</label>
              <div className="p-3 rounded-lg bg-black/30 text-sm text-zinc-200">
                Category ID: {metadata.category}
              </div>
            </div>

            {isEditing && (
              <Button
                onClick={handleSaveChanges}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
