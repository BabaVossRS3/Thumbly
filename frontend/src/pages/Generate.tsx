import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  colorSchemes,
  type AspectRatio,
  type IThumbnail,
  type ThumbnailStyle,
} from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import { button, nav } from "motion/react-client";
import AspectRatioSelector from "../components/AspectRatioSelector";
import StyleSelector from "../components/StyleSelector";
import ColorSchemeSelector from "../components/ColorSchemeSelector";
import PreviePanel from "../components/PreviePanel";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import api from "@/configs/api";

const Generate = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [title, setTitle] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUsage, setThumbnailUsage] = useState<{ remaining: number; limit: number; used: number } | null>(null);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [colorSchemeId, setColorSchemeId] = useState<string>(
    colorSchemes[0].id
  );
  const [style, setStyle] = useState<ThumbnailStyle>("Bold & Graphic");

  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return toast.error("You must be logged in to generate a thumbnail");
    }
    if (!title.trim()) return toast.error("Title is required");
    setLoading(true);

    const api_payload = {
      title,
      prompt: additionalDetails,
      aspect_ratio: aspectRatio,
      style,
      color_scheme: colorSchemeId,
      text_overlay: true,
    };
    try {
      const { data } = await api.post("/api/thumbnail/generate", api_payload);
      if (data.thumbnail) {
        navigate(`/generate/${data.thumbnail._id}`);
        toast.success(data.message);
        // Refresh usage after generation to show updated credits
        await fetchThumbnailUsage();
      }
    } catch (error: any) {
      console.error("Error generating thumbnail:", error);
      toast.error(error.response?.data?.message || "Failed to generate thumbnail");
    } finally {
      setLoading(false);
    }
  };

  const fetchThumbnailUsage = async () => {
    try {
      const { data } = await api.get("/api/thumbnail/usage/credits");
      setThumbnailUsage(data.usage);
    } catch (error: any) {
      console.log("Error fetching thumbnail usage:", error);
    }
  };

  const fetchThumbnail = async () => {
    try {
      const { data } = await api.get(`/api/user/thumbnail/${id}`);
      setThumbnail(data?.thumbnail as IThumbnail);
      setLoading(!data?.thumbnail?.image_url);
      setAdditionalDetails(data?.thumbnail?.prompt_used);
      setTitle(data?.thumbnail?.title);
      setColorSchemeId(data?.thumbnail?.color_scheme);
      setAspectRatio(data?.thumbnail?.aspect_ratio);
      setStyle(data?.thumbnail?.style);
    } catch (error: any) {
      console.log(error);
      toast.error("An error occurred");
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchThumbnailUsage();
      // Refetch usage every 30 seconds to catch plan changes
      const interval = setInterval(() => {
        fetchThumbnailUsage();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && id) {
      fetchThumbnail();
    }
    if (id && loading && isLoggedIn) {
      const interval = setInterval(() => {
        fetchThumbnail();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [id, loading, isLoggedIn]);

  useEffect(() => {
    if (!id && thumbnail) {
      setThumbnail(null);
    }
  }, [pathname]);

  return (
    <>
      <SoftBackdrop />
      <div className="relative min-h-screen pt-24 pb-20">
        {/* Gradient background elements */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{backgroundColor: 'rgba(233, 71, 245, 0.15)'}}></div>
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{backgroundColor: 'rgba(47, 75, 162, 0.15)'}}></div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="text-white">Create Your </span>
              <span style={{color: '#e947f5'}}>Perfect Thumbnail</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Describe your vision and let AI bring it to life. Customize every detail to match your brand.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_450px] gap-8 items-start">
            {/* Left - Preview */}
            <div className="order-2 lg:order-1">
              <div className="rounded-3xl overflow-hidden border" style={{borderColor: 'rgba(233, 71, 245, 0.3)', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)'}}>
                <div className="p-8">
                  <h2 className="text-lg font-semibold text-white mb-6">Live Preview</h2>
                  <PreviePanel
                    thumbnail={thumbnail}
                    isLoading={loading}
                    aspectRatio={aspectRatio}
                  />
                </div>
              </div>
              {thumbnailUsage && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-slate-400 text-right">
                    Credits used: {thumbnailUsage.used}/{thumbnailUsage.limit}
                  </div>
                  <div className="text-sm text-slate-400 text-right">
                    Remaining: {thumbnailUsage.remaining}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Controls */}
            <div className="order-1 lg:order-2">
              <div className="rounded-3xl overflow-hidden border sticky top-32" style={{borderColor: 'rgba(233, 71, 245, 0.3)', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)'}}>
                <div className="p-8 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create Thumbnail</h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Configure your design preferences
                    </p>
                  </div>

                  <div className="space-y-5">
                    {/* Title input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-white block">
                        Title or Topic
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                        placeholder="e.g. 'Astronaut floating in space'"
                        className="w-full px-4 py-3 rounded-xl border text-white placeholder:text-slate-500 focus:outline-none transition-all"
                        style={{borderColor: 'rgba(233, 71, 245, 0.3)', backgroundColor: 'rgba(233, 71, 245, 0.05)'}}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#e947f5'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(233, 71, 245, 0.3)'}
                      />
                      <div className="flex justify-end">
                        <span className="text-xs text-slate-500">
                          {title.length}/100
                        </span>
                      </div>
                    </div>

                    {/* Aspect Ratio Selector */}
                    <AspectRatioSelector
                      value={aspectRatio}
                      onChange={setAspectRatio}
                    />

                    {/* Style selector */}
                    <StyleSelector
                      value={style}
                      onChange={setStyle}
                      isOpen={styleDropdownOpen}
                      setIsOpen={setStyleDropdownOpen}
                    />

                    {/* Color scheme selector */}
                    <ColorSchemeSelector
                      value={colorSchemeId}
                      onChange={setColorSchemeId}
                    />

                    {/* Additional details */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-white">
                        Additional Prompts{" "}
                        <span className="text-slate-500 text-xs font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        rows={3}
                        placeholder="Add any specific elements, mood, or style preferences..."
                        className="w-full px-4 py-3 rounded-xl border text-white placeholder:text-slate-500 focus:outline-none transition-all resize-none"
                        style={{borderColor: 'rgba(233, 71, 245, 0.3)', backgroundColor: 'rgba(233, 71, 245, 0.05)'}}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#e947f5'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(233, 71, 245, 0.3)'}
                      />
                    </div>
                  </div>

                  {/* Button */}
                  {!id && (
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 text-base"
                      style={{backgroundColor: '#e947f5'}}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Generating...
                        </span>
                      ) : (
                        "Generate Thumbnail"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Generate;
