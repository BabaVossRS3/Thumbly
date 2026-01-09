import { useState } from "react";
import SoftBackdrop from "../components/SoftBackdrop";
import YouTubeConnect from "../components/YouTubeConnect";
import MetadataGenerator from "../components/MetadataGenerator";
import ThumbnailSelector from "../components/ThumbnailSelector";
import YouTubeVideoSelector from "../components/YouTubeVideoSelector";
import SaveProjectModal from "../components/SaveProjectModal";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Zap, Sparkles, Share2, Save } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

interface GeneratedMetadata {
  videoTitle: string;
  videoDescription: string;
  tags: string[];
  category: string;
}

export default function YouTubeIntegration() {
  const [videoId, setVideoId] = useState("");
  const [thumbnailId, setThumbnailId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [generatedMetadata, setGeneratedMetadata] = useState<GeneratedMetadata | null>(null);

  const handleUploadThumbnail = async () => {
    if (!videoId.trim() || !thumbnailId.trim()) {
      toast.error("Please select both a video and thumbnail");
      return;
    }

    try {
      setUploading(true);
      
      // Only update metadata if it was generated
      if (generatedMetadata) {
        await api.post("/api/youtube/update-metadata", {
          videoId,
          title: generatedMetadata.videoTitle,
          description: generatedMetadata.videoDescription,
          tags: generatedMetadata.tags,
          category: generatedMetadata.category,
        });
      }

      // Upload the thumbnail
      await api.post("/api/youtube/set-thumbnail", {
        videoId,
        thumbnailId,
      });

      toast.success("Thumbnail uploaded to YouTube successfully!");
      setVideoId("");
      setThumbnailId("");
    } catch (error: any) {
      console.error("Error uploading:", error);
      toast.error(error?.response?.data?.message || "Failed to upload to YouTube");
    } finally {
      setUploading(false);
    }
  };


  return (
    <>
      <SoftBackdrop />
      <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32 pb-20">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-200">
            YouTube Automation
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Automate your YouTube workflow with AI-powered metadata generation and project management
          </p>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Column 1: Connect YouTube */}
          <div className="rounded-2xl bg-white/6 border border-white/10 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                <Share2 className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200">Step 1: Connect</h2>
            </div>
            
            <p className="text-sm text-zinc-400 mb-6 flex-grow">
              Authorize Thumby to access your YouTube account. This allows us to upload thumbnails and manage your videos securely.
            </p>

            <div className="space-y-3">
              <div className="text-xs space-y-2 text-zinc-500 bg-black/20 p-3 rounded-lg">
                <p>✓ Secure OAuth 2.0 authentication</p>
                <p>✓ Your data stays private</p>
                <p>✓ Revoke access anytime</p>
              </div>
              <YouTubeConnect />
            </div>
          </div>

          {/* Column 2: Generate Metadata */}
          <div className="rounded-2xl bg-white/6 border border-white/10 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200">Step 2: Generate</h2>
            </div>

            <p className="text-sm text-zinc-400 mb-6 flex-grow">
              Enter your video topic and let AI generate SEO-optimized titles, descriptions, tags, and category suggestions.
            </p>

            <div className="space-y-3">
              <div className="text-xs space-y-2 text-zinc-500 bg-black/20 p-3 rounded-lg">
                <p>✓ SEO-optimized titles (100 chars)</p>
                <p>✓ Detailed descriptions (300-500 words)</p>
                <p>✓ 15-20 relevant tags</p>
                <p>✓ Smart category selection</p>
              </div>
              <MetadataGenerator 
                onMetadataGenerated={(metadata) => setGeneratedMetadata(metadata)}
                onMetadataUpdated={(metadata) => setGeneratedMetadata(metadata)}
              />
            </div>
          </div>

          {/* Column 3: Upload Thumbnail */}
          <div className="rounded-2xl bg-white/6 border border-white/10 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
                <Upload className="w-5 h-5 text-pink-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200">Step 3: Upload</h2>
            </div>

            <p className="text-sm text-zinc-400 mb-6 flex-grow">
              Upload your AI-generated thumbnail directly to your YouTube video or save the project for later.
            </p>

            <div className="space-y-4 flex-grow flex flex-col">
              <YouTubeVideoSelector 
                onSelect={setVideoId}
                selectedId={videoId}
              />

              <ThumbnailSelector 
                onSelect={setThumbnailId}
                selectedId={thumbnailId}
              />

              <div className="flex gap-3 mt-auto">
                <Button
                  onClick={() => setSaveModalOpen(true)}
                  disabled={!thumbnailId}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={handleUploadThumbnail}
                  disabled={uploading || !videoId || !thumbnailId}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h3 className="text-2xl font-semibold text-zinc-200">
              Complete Workflow
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-pink-400">1. Generate Thumbnail</div>
              <p className="text-xs text-zinc-400">
                Use the Generate page to create AI thumbnails with your chosen style and colors
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-purple-400">2. Connect YouTube</div>
              <p className="text-xs text-zinc-400">
                Click "Connect YouTube" in Step 1 to authorize the app to manage your videos
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-blue-400">3. Generate Metadata</div>
              <p className="text-xs text-zinc-400">
                Enter your video topic in Step 2 to get AI-generated titles, descriptions, and tags
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-green-400">4. Upload or Save</div>
              <p className="text-xs text-zinc-400">
                Upload thumbnail directly to YouTube or save project for later use in My Generations
              </p>
            </div>
          </div>
        </div>

        {/* Save Project Modal */}
        {generatedMetadata && (
          <SaveProjectModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            videoTitle={generatedMetadata.videoTitle}
            videoDescription={generatedMetadata.videoDescription}
            tags={generatedMetadata.tags}
            category={generatedMetadata.category}
            thumbnailId={thumbnailId}
            thumbnailUrl={undefined}
            onSaveSuccess={() => {
              // Keep metadata after save so user can still upload
              // Only reset video and thumbnail selections
              setVideoId("");
              setThumbnailId("");
              setSaveModalOpen(false);
            }}
          />
        )}
      </div>
    </>
  );
}
