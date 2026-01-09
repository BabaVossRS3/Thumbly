import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Youtube, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/configs/api";
import { toast } from "sonner";

export default function YouTubeConnect() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/youtube/check-connection");
      setConnected(data.connected);
    } catch (error: any) {
      console.error("Error checking YouTube connection:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();

    const params = new URLSearchParams(window.location.search);
    if (params.get("youtube") === "connected") {
      toast.success("YouTube account connected successfully!");
      setConnected(true);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("youtube") === "error") {
      toast.error("Failed to connect YouTube account");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { data } = await api.get("/api/youtube/auth-url");
      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Error getting auth URL:", error);
      toast.error(error?.response?.data?.message || "Failed to connect YouTube");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setConnecting(true);
      await api.post("/api/youtube/disconnect");
      setConnected(false);
      toast.success("YouTube account disconnected");
    } catch (error: any) {
      console.error("Error disconnecting YouTube:", error);
      toast.error(error?.response?.data?.message || "Failed to disconnect");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 border border-white/10">
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        <span className="text-sm text-zinc-400">Checking connection...</span>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">YouTube Connected</span>
        </div>
        <Button
          onClick={handleDisconnect}
          disabled={connecting}
          variant="outline"
          size="sm"
          className="!text-red-500 !border-red-500/30 !bg-red-500/10 hover:!bg-red-500/20 text-xs"
        >
          {connecting ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Disconnecting...
            </>
          ) : (
            "Disconnect"
          )}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={connecting}
      className="bg-red-600 hover:bg-red-700 text-white"
    >
      {connecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Youtube className="w-4 h-4 mr-2" />
          Connect YouTube
        </>
      )}
    </Button>
  );
}
