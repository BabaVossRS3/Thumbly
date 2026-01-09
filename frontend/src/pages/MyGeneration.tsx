import { useEffect, useState } from "react";
import SoftBackdrop from "../components/SoftBackdrop";
import YouTubeProjectCard from "../components/YouTubeProjectCard";
import YouTubeProjectPreview from "../components/YouTubeProjectPreview";
import UploadProjectModal from "../components/UploadProjectModal";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, DownloadIcon, Loader2, TrashIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/configs/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { IThumbnail } from "@/assets/assets";
import type { YouTubeProject } from "@/types";

const MyGeneration = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"thumbnails" | "projects">("thumbnails");

  const aspectRatioClassMap: Record<string, string> = {
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "1:1": "aspect-square",
  };
  const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
  const [projects, setProjects] = useState<YouTubeProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"thumbnail" | "project">("thumbnail");
  const [previewProject, setPreviewProject] = useState<YouTubeProject | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadProject, setUploadProject] = useState<YouTubeProject | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [thumbRes, projectRes] = await Promise.all([
        api.get("/api/user/thumbnails"),
        api.get("/api/youtube-projects"),
      ]);
      setThumbnails(thumbRes.data.thumbnails || []);
      setProjects(projectRes.data.projects || []);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(isLoggedIn){
      fetchData();
    }
  }, [isLoggedIn]);

  const handleDownload = (image_url: string) => {
    const link = document.createElement("a");
    link.href = image_url.replace(
      "/upload",
      "/upload/fl_attachment"
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      if (deleteType === "thumbnail") {
        await api.delete(`/api/thumbnail/delete/${deletingId}`);
        setThumbnails(thumbnails.filter(t => t._id !== deletingId));
        toast.success("Thumbnail deleted successfully");
      } else {
        await api.delete(`/api/youtube-projects/${deletingId}`);
        setProjects(projects.filter(p => p._id !== deletingId));
        toast.success("Project deleted successfully");
      }
    } catch (error:any) {
       console.log(error);
      toast.error(error?.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <>
      <SoftBackdrop />
      <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-200">My Generations</h1>
          <p className="text-zinc-400 text-sm mt-1">
            View and manage your thumbnails and YouTube projects
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab("thumbnails")}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              activeTab === "thumbnails"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            Thumbnails
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 px-4 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === "projects"
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            YouTube Projects
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/6 border border-white/10 animate-pulse h-[260px]"
              />
            ))}
          </div>
        )}

        {/* Thumbnails Tab */}
        {activeTab === "thumbnails" && (
          <>
            {/* Empty state */}
            {!loading && thumbnails.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-zinc-200 text-lg font-semibold">
                  No thumbnails generated yet
                </h3>
                <p className="text-zinc-400 text-sm mt-2">
                  Generate some thumbnails to get started
                </p>
              </div>
            )}

            {/* Grid */}
            {!loading && thumbnails.length > 0 && (
              <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-8">
                {thumbnails.map((thumb: IThumbnail) => {
                  const aspectClass =
                    aspectRatioClassMap[thumb.aspect_ratio || "16:9"];

                  return (
                    <div
                      key={thumb._id}
                      onClick={() => navigate(`/generate/${thumb._id}`)}
                      className="mb-8 group relative cursor-pointer rounded-2xl bg-white/6 border border-white/10 transition shadow-xl break-inside-avoid"
                    >
                      {/* image */}
                      <div
                        className={`relative overflow-hidden ${aspectClass} rounded-t-2xl bg-black`}
                      >
                        {thumb.image_url ? (
                          <img
                            src={thumb.image_url}
                            alt={thumb.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                            {thumb.isGenerating ? "Generating..." : "No Image"}
                          </div>
                        )}

                        {thumb.isGenerating && (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* content */}
                      <div className="p-4 space-y-2">
                        <h3 className="text-zinc-200 text-sm font-semibold">
                          {thumb.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-white/8">
                            {thumb.style}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/8">
                            {thumb.aspect_ratio}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/8">
                            {thumb.color_scheme}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {new Date(thumb.createdAt!).toDateString()}
                        </p>
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2 right-2 max-sm:flex sm:hidden group-hover:flex gap-1.5"
                      >
                        <TrashIcon
                          onClick={() => {
                            setDeletingId(thumb._id);
                            setDeleteType("thumbnail");
                            setDeleteDialogOpen(true);
                          }}
                          className="size-6 bg-black/50 p-1 rounded hover:bg-pink-500 cursor-pointer transition-all"
                        />
                        <DownloadIcon
                          onClick={() => handleDownload(thumb.image_url!)}
                          className="size-6 bg-black/50 p-1 rounded hover:bg-pink-500 cursor-pointer transition-all"
                        />
                        <Link
                          target="_blank"
                          to={`/preview?thumbnail_url=${thumb.image_url}&title=${thumb.title}`}
                        >
                          <ArrowUpRight className="size-6 bg-black/50 p-1 rounded hover:bg-pink-500 cursor-pointer transition-all" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <>
            {/* Empty state */}
            {!loading && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <Sparkles className="w-12 h-12 text-zinc-600 mb-4" />
                <h3 className="text-zinc-200 text-lg font-semibold">
                  No YouTube projects yet
                </h3>
                <p className="text-zinc-400 text-sm mt-2">
                  Create a complete YouTube automation project on the YouTube page
                </p>
              </div>
            )}

            {/* Grid */}
            {!loading && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project) => (
                  <YouTubeProjectCard
                    key={project._id}
                    project={project}
                    onDelete={(id) => {
                      setDeletingId(id);
                      setDeleteType("project");
                      setDeleteDialogOpen(true);
                    }}
                    onPreview={(proj) => {
                      setPreviewProject(proj);
                      setPreviewOpen(true);
                    }}
                    onUpload={(proj) => {
                      setUploadProject(proj);
                      setUploadOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="!bg-zinc-900 !border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="!text-zinc-200">
              Delete {deleteType === "thumbnail" ? "Thumbnail" : "Project"}
            </AlertDialogTitle>
            <AlertDialogDescription className="!text-zinc-400">
              Are you sure you want to delete this {deleteType === "thumbnail" ? "thumbnail" : "project"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="!text-zinc-300 !border-white/10 hover:!bg-white/6">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="!bg-red-600 hover:!bg-red-700 !text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <YouTubeProjectPreview
        project={previewProject}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onDelete={(id) => {
          setDeletingId(id);
          setDeleteType("project");
          setDeleteDialogOpen(true);
          setPreviewOpen(false);
        }}
      />

      <UploadProjectModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        project={uploadProject}
        onUploadSuccess={() => {
          fetchData();
        }}
      />
    </>
  );
};

export default MyGeneration;
