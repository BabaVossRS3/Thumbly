import {
    ChevronDownIcon,
  CpuIcon,
  ImageIcon,
  PenToolIcon,
  SparkleIcon,
  SquareIcon,
} from "lucide-react";
import { thumbnailStyles, type ThumbnailStyle } from "../assets/assets";

const StyleSelector = ({
  value,
  onChange,
  isOpen,
  setIsOpen,
}: {
  value: ThumbnailStyle;
  onChange: (style: ThumbnailStyle) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const styleDescriptions: Record<ThumbnailStyle, string> = {
    "Bold & Graphic": "High contrast, bold colors, and striking lines",
    Minimalist: "Clean, simple, and modern",
    Photorealistic: "Realistic, lifelike, and detailed",
    Illustrated: "Cartoony, whimsical, and detailed",
    "Tech/Futuristic": "High-tech, futuristic, and modern",
  };
  const styleIcons: Record<ThumbnailStyle, React.ReactNode> = {
    "Bold & Graphic": <SparkleIcon className="h-4 w-4" />,
    Minimalist: <SquareIcon className="h-4 w-4" />,
    Photorealistic: <ImageIcon className="h-4 w-4" />,
    Illustrated: <PenToolIcon className="h-4 w-4" />,
    "Tech/Futuristic": <CpuIcon className="h-4 w-4" />,
  };

  return(
  <div className="space-y-3 dark relative">
    <label className="block text-sm font-medium text-zinc-200">
      Thumbnail Style
    </label>
    <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition bg-white/8 border-white/10 text-zinc-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-medium">
          {styleIcons[value]}
          <span>{value}</span>
        </div>
        <p className="text-xs text-zinc-400">{styleDescriptions[value]}</p>
      </div>
      <ChevronDownIcon className={`h-5 w-5 text-zinc-400 ${isOpen ? 'rotate-180' : ''}`} />
    </button>

    {isOpen && (
        <div className="absolute bottom-0 z-50 mt-1 w-full rounded-md border border-white/12 bg-black/20 backdrop-blur-3xl shadow-lg">
            {thumbnailStyles.map((style) => (
                <button key={style} type="button" onClick={() => {onChange(style); setIsOpen(false)}} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-black/30">
                    <div className="mt-0.5">{styleIcons[style]}</div>
                    <div className="">
                        <p className="font-medium">{style}</p>
                        <p className="text-xs text-zinc-400">{styleDescriptions[style]}</p>
                    </div>
                </button>
            ))}
        </div>
    )}
  </div>
)
};

export default StyleSelector;
