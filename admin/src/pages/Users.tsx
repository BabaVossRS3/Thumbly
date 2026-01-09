import { useState, useEffect, useRef } from "react";
import { Mail, Calendar, User, Search, Trash2, AlertCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/configs/api";

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatar?: string;
}

const DEBOUNCE_TIMEOUT = 300;
const REQUEST_TIMEOUT = 10000;

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const requestTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("adminToken");
        if (!token) {
          throw new Error("Invalid token");
        }

        const params = new URLSearchParams();
        if (searchQuery) {
          params.append("search", searchQuery);
        }

        const response = await fetch(
          `${API_ENDPOINTS.ADMIN_USERS_GET_ALL}?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: abortController.signal,
          }
        );

        if (abortController.signal.aborted) {
          return;
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          } else {
            throw new Error("Failed to fetch users");
          }
        }

        const data = await response.json();
        setUsers(data.data.users || []);
      } catch (err: any) {
        if (err.name === "AbortError") {
          return;
        }

        if (err.message === "Unauthorized") {
          setError("Invalid token");
        } else {
          setError("An error occurred while fetching users");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, DEBOUNCE_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchQuery]);

  // Cleanup requestTimeoutRef on component unmount
  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDeleteUser = (user: UserData) => {
    setUserToDelete(user);
    setConfirmUserId(user.id);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!confirmUserId) return;

    try {
      setDeletingId(confirmUserId);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        throw new Error("Invalid token");
      }

      const abortController = new AbortController();
      let timedOut = false;

      // Set timeout flag instead of relying on abortController.signal.aborted
      requestTimeoutRef.current = setTimeout(() => {
        timedOut = true;
        abortController.abort();
      }, REQUEST_TIMEOUT);

      try {
        const response = await fetch(
          API_ENDPOINTS.ADMIN_USERS_DELETE(confirmUserId),
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: abortController.signal,
          }
        );

        // Clear timeout after response is received
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
          requestTimeoutRef.current = null;
        }

        // Check timeout flag instead of abortController.signal.aborted
        if (timedOut) {
          throw new Error("Request timed out");
        }

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Unauthorized");
          } else {
            throw new Error("Failed to delete user");
          }
        }

        setUsers(users.filter(user => user.id !== confirmUserId));
      } catch (fetchErr: any) {
        // Clear timeout on fetch error
        if (requestTimeoutRef.current) {
          clearTimeout(requestTimeoutRef.current);
          requestTimeoutRef.current = null;
        }
        throw fetchErr;
      }
    } catch (err: any) {
      if (err.message === "Unauthorized") {
        setError("Invalid token");
      } else if (err.message === "Request timed out") {
        setError("Request timed out");
      } else if (err.name === "AbortError") {
        setError("Request was cancelled");
      } else {
        setError("An error occurred while deleting the user");
      }
    } finally {
      setDeletingId(null);
      setIsConfirmDialogOpen(false);
      setConfirmUserId(null);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setConfirmUserId(null);
    setUserToDelete(null);
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Users</h1>
        <p className="text-white/60">Manage and view all registered users</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex-shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                          {user.name}
                        </h3>
                        <p className="text-sm text-white/60 truncate flex items-center gap-1 mt-1">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      disabled={deletingId === user.id}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete user"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Joined {formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No users found matching your search</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-sm text-white/60">
            Showing {users.length} users
          </div>
        </>
      )}

      {isConfirmDialogOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 max-w-md w-full backdrop-blur-sm">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Delete User</h2>
              <button
                onClick={handleCancelDelete}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-white/60 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{userToDelete.name}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={handleCancelDelete}
                disabled={deletingId === confirmUserId}
                className="flex-1 !bg-white/10 !border !border-white/20 !text-white !hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deletingId === confirmUserId}
                variant="destructive"
                className="flex-1 disabled:opacity-50"
              >
                {deletingId === confirmUserId ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
