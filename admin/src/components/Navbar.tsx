import { LogOut } from "lucide-react";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur">
      <img
        className="h-16 w-auto scale-650"
        src="/src/assets/logo.png"
        alt="logo"
        width={260}
        height={68}
      />

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-700 active:scale-95 transition-all rounded-full"
      >
        <LogOut size={18} />
        Logout
      </button>
    </nav>
  );
}
