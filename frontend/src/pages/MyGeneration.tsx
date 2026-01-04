import { useEffect, useState } from "react";
import SoftBackdrop from "../components/SoftBackdrop";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, DownloadIcon, Loader2, TrashIcon } from "lucide-react";
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

const MyGeneration = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const aspectRatioClassMap: Record<string, string> = {
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "1:1": "aspect-square",
  };
  const [thumbnails, setThumbnails] = useState<IThumbnail[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchThumbnails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/user/thumbnails");
      setThumbnails(data.thumbnails || []);
    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(isLoggedIn){
      fetchThumbnails();
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
      const {data} = await api.delete(`/api/thumbnail/delete/${deletingId}`)
      setThumbnails(thumbnails.filter(t => t._id !== deletingId));
      toast.success("Thumbnail deleted successfully");
    } catch (error:any) {
       console.log(error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <>
      <SoftBackdrop />
      <div className="mt-32 min-h-screen px-6 md:px-16 lg:px-24 xl:px-32">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-200">My Thumbnails</h1>
          <p className="text-zinc-400 text-sm mt-1">
            View and manage your generated thumbnails
          </p>
        </div>

        {/* loading */}
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

        {/* empty state */}
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

        {/* grid  */}
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
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thumbnail</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thumbnail? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyGeneration;
