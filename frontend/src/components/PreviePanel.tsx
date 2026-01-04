import { DownloadIcon, ImageIcon, Loader2Icon } from "lucide-react";
import type { AspectRatio, IThumbnail } from "../assets/assets";

const PreviePanel = ({
  thumbnail,
  isLoading,
  aspectRatio,
}: {
  thumbnail: IThumbnail | null;
  isLoading: boolean;
  aspectRatio: AspectRatio;
}) => {
  const aspecClasses = {
    "16:9": "aspect-video",
    "1:1": "aspect-square",
    "9:16": "aspect-[9/16]",
  } as Record<AspectRatio, string>;

  const onDownload = () => {
    if (!thumbnail?.image_url) return;
    const link = document.createElement('a');
    link.href = thumbnail?.image_url.replace('/upload' , '/upload/fl_attachment')
    document.body.appendChild(link);
    link.click()
    link.remove()
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className={`relative overflow-hidden ${aspecClasses[aspectRatio]}`}>
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/25">
            <Loader2Icon className="h-8 w-8 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">
                Generating thumbnail...
              </p>
              <p className="text-zinc-400 text-xs mt-1 ">
                It may take a few seconds
              </p>
            </div>
          </div>
        )}
        {/* image preview */}
        {!isLoading && thumbnail?.image_url && (
          <div className="group relative h-full w-full">
            <img
              src={thumbnail.image_url}
              alt={thumbnail.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 flex items-end justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onDownload}
                className="mb-6 flex items-center gap-2 rounded-md px-5 py-2.5 text-xs font-medium transition bg-white/30 ring-2 ring-white/40 backdrop-blur hover:scale-105 active:scale-95"
              >
                <DownloadIcon className="size-4" />
                Download Thumbnail
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !thumbnail?.image_url && (
          <div className="absolute inset-0 flex flex-col gap-4 rounded-lg border-2 border-dashed border-white/20 items-center m-2 justify-center bg-black/25">
            <div className="max-sm:hidden flex size-20 items-center justify-center rounded-full bg-white/10">
              <ImageIcon className="size-12 text-white opacity-50" />
            </div>
            <div className="px-4 text-center">
              <p className="text-sm font-medium text-zinc-200">
                Generate Your First Thumbnail
              </p>
              <p className="text-zinc-400 text-xs mt-1 ">
                Fill out the form above to generate your first thumbnail
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviePanel;
