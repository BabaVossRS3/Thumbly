import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  User,
  Search,
  Plus,
  Trash2,
  Check,
  X,
  Crown,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Subscription {
  id: string;
  planType: "basic" | "pro" | "enterprise";
  startDate: string;
  endDate: string | null;
  status: "active" | "canceled" | "past_due" | "unpaid" | "paused";
  creditsUsed: number;
  creditsLimit: number;
  thumbnailLimit: number;
}

interface UserSubscription {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription: Subscription;
}

export default function Subscriptions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSubscription | null>(
    null
  );
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>("basic");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatSubscriptionData = (subscriptions: any[]): UserSubscription[] => {
    return subscriptions.map((sub: any) => ({
      id: sub.userId,
      name: sub.name,
      email: sub.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.name}`,
      subscription: {
        id: sub.id,
        planType: sub.planType,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.status,
        creditsUsed: sub.creditsUsed,
        creditsLimit: sub.creditsLimit,
        thumbnailLimit: sub.thumbnailLimit,
      },
    }));
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setError(null);
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/api/subscription/admin/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch subscriptions: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
          throw new Error("Invalid response format: missing subscriptions array");
        }
        
        const formattedData = formatSubscriptionData(data.subscriptions);
        setUserSubscriptions(formattedData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch subscriptions";
        console.error("Error fetching subscriptions:", error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const filteredUsers = userSubscriptions.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSubscriptionColor = (planType: string) => {
    switch (planType) {
      case "pro":
        return "from-yellow-500 to-orange-500";
      case "enterprise":
        return "from-blue-500 to-purple-500";
      case "basic":
        return "from-green-500 to-emerald-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            <Check className="w-3 h-3" />
            Active
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
            <X className="w-3 h-3" />
            Canceled
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Past Due
          </span>
        );
      case "unpaid":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <X className="w-3 h-3" />
            Unpaid
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Paused
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  const handleGrantSubscription = (user: UserSubscription) => {
    setSelectedUser(user);
    setShowGrantModal(true);
  };

  const handleTerminateSubscription = (user: UserSubscription) => {
    setSelectedUser(user);
    setShowTerminateModal(true);
  };

  const confirmGrant = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/subscription/admin/grant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
          planType: selectedPlan,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to grant subscription: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Subscription granted:", data);
      
      // Refresh subscriptions list
      const refreshResponse = await fetch(`${API_BASE_URL}/api/subscription/admin/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });
      
      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh subscriptions list");
      }
      
      const refreshData = await refreshResponse.json();
      
      if (!refreshData.subscriptions || !Array.isArray(refreshData.subscriptions)) {
        throw new Error("Invalid response format");
      }
      
      const formattedData = formatSubscriptionData(refreshData.subscriptions);
      setUserSubscriptions(formattedData);
      setSuccessMessage(`Successfully granted ${selectedPlan} plan to ${selectedUser.name}`);
      setShowGrantModal(false);
      setSelectedUser(null);
      setSelectedPlan("basic");
      
      // Clear any existing timeout before setting a new one
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to grant subscription";
      console.error("Error granting subscription:", error);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmTerminate = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/subscription/admin/terminate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to terminate subscription: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Subscription terminated:", data);
      
      // Refresh subscriptions list
      const refreshResponse = await fetch(`${API_BASE_URL}/api/subscription/admin/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
      });
      
      if (!refreshResponse.ok) {
        throw new Error("Failed to refresh subscriptions list");
      }
      
      const refreshData = await refreshResponse.json();
      
      if (!refreshData.subscriptions || !Array.isArray(refreshData.subscriptions)) {
        throw new Error("Invalid response format");
      }
      
      const formattedData = formatSubscriptionData(refreshData.subscriptions);
      setUserSubscriptions(formattedData);
      setSuccessMessage(`Successfully terminated subscription for ${selectedUser.name}`);
      setShowTerminateModal(false);
      setSelectedUser(null);
      
      // Clear any existing timeout before setting a new one
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to terminate subscription";
      console.error("Error terminating subscription:", error);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
        <p className="text-white/60">
          Manage user subscriptions and access levels
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white/60">Loading subscriptions...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col"
            >
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden shrink-0 mb-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-white truncate w-full">
                  {user.name}
                </h3>
                <p className="text-xs text-white/60 truncate w-full mt-1">
                  {user.email}
                </p>
              </div>

              <div className="mb-4 flex flex-col items-center gap-2">
                <div
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${getSubscriptionColor(user.subscription.planType)} text-white font-semibold text-sm`}
                >
                  <Crown className="w-4 h-4" />
                  {user.subscription.planType.charAt(0).toUpperCase() +
                    user.subscription.planType.slice(1)}
                </div>

                {getStatusBadge(user.subscription.status)}
              </div>

              <div className="border-t border-white/10 pt-3 mb-4 flex-1">
                <div className="space-y-3 text-xs text-white/60">
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Started {formatDate(user.subscription.startDate)}</span>
                  </div>
                  {user.subscription.endDate && (
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {user.subscription.status === "active"
                          ? "Expires"
                          : "Expired"}{" "}
                        {formatDate(user.subscription.endDate)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70">Credits</span>
                      <span className="text-white font-semibold">
                        {user.subscription.creditsUsed}/{user.subscription.creditsLimit}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                        style={{
                          width: user.subscription.creditsLimit > 0 ? `${(user.subscription.creditsUsed / user.subscription.creditsLimit) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-row gap-2 justify-center">
                <Button
                  size="sm"
                  onClick={() => handleGrantSubscription(user)}
                  className="border border-white/30 bg-transparent text-white/80 hover:bg-white/5 hover:border-white/50 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                  Grant
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleTerminateSubscription(user)}
                  className="border border-white/30 bg-transparent text-white/80 hover:bg-white/5 hover:border-white/50 hover:text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Terminate
                </Button>
              </div>
            </div>
          ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white/5 border border-white/10 rounded-lg">
              <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">
                No users found matching your search
              </p>
            </div>
          )}
          </div>

          <div className="mt-8 text-sm text-white/60">
            Showing {filteredUsers.length} of {userSubscriptions.length} users
          </div>
        </>
      )}

      {showGrantModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 max-w-md w-full backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">
              Grant Subscription
            </h2>
            <p className="text-white/60 mb-6">
              Select a plan to grant to{" "}
              <span className="font-semibold text-white">{selectedUser.name}</span>
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
                <input
                  type="radio"
                  name="subscription"
                  value="basic"
                  checked={selectedPlan === "basic"}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-white">Basic (50 thumbnails/month)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
                <input
                  type="radio"
                  name="subscription"
                  value="pro"
                  checked={selectedPlan === "pro"}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-white">Pro (Unlimited)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
                <input
                  type="radio"
                  name="subscription"
                  value="enterprise"
                  checked={selectedPlan === "enterprise"}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-white">Enterprise (Unlimited)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowGrantModal(false);
                  setError(null);
                }}
                disabled={isProcessing}
                className="flex-1 !bg-white/10 !border !border-white/20 !text-white !hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmGrant}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? "Granting..." : "Grant Access"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTerminateModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 max-w-md w-full backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white mb-4">
              Terminate Subscription
            </h2>
            <p className="text-white/60 mb-6">
              Are you sure you want to terminate the subscription for{" "}
              <span className="font-semibold text-white">{selectedUser.name}</span>
              ? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowTerminateModal(false);
                  setError(null);
                }}
                disabled={isProcessing}
                className="flex-1 !bg-white/10 !border !border-white/20 !text-white !hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmTerminate}
                disabled={isProcessing}
                className="flex-1 disabled:opacity-50"
              >
                {isProcessing ? "Terminating..." : "Terminate"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
