import { MenuIcon, XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "@/configs/api";
import { planBanners } from "../assets/assets";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscriptionPlan = async () => {
      if (!isLoggedIn) return;
      try {
        const { data } = await api.get("/api/auth/verify");
        setSubscriptionPlan(data.user?.subscriptionPlan || null);
      } catch (error) {
        console.log("Error fetching subscription plan:", error);
      }
    };

    fetchSubscriptionPlan();
  }, [isLoggedIn]);

  return (
    <>
      <motion.nav
        className="fixed top-0 z-50 flex items-center justify-between w-full py-4 px-6 md:px-16 lg:px-24 xl:px-32 backdrop-blur"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <Link to="/">
        <div className="flex items-center">
          <img
            className="h-16 w-auto "
            src={logo}
            alt="logo"
            width={260}
            height={68}
          />
          <h1 className="text-white text-2xl ">Thumbly</h1>
          </div>
          </Link>

        <div className="hidden md:flex items-center gap-8 transition duration-500">
          <Link to="/" className="hover:text-pink-300 transition">
            Home
          </Link>
          <Link to="/generate" className="hover:text-pink-300 transition">
            Generate
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                to="/my-generation"
                className="hover:text-pink-300 transition"
              >
                My Generations
              </Link>
              <Link
                to="/youtube"
                className="hover:text-pink-300 transition"
              >
                YouTube
              </Link>
            </>
          ) : null}
          <Link to="/pricing" className="hover:text-pink-300 transition">
            Pricing
          </Link>
          <Link to="/#contact" className="hover:text-pink-300 transition">
            Contact Us
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                {subscriptionPlan && (
                  <img 
                    src={planBanners[subscriptionPlan.toLowerCase() as keyof typeof planBanners]} 
                    alt={subscriptionPlan}
                    className="h-8 w-auto"
                    style={{ transform: 'scale(4.5)' }}
                  />
                )}
              </div>
              <div className="relative group">
                <button className="rounded-full size-8 bg-white/20 border-2 border-white/10">
                  {user?.name.charAt(0).toUpperCase()}
                </button>
                <div className="absolute hidden group-hover:block top-6 right-0 pt-4">
                  <button
                    onClick={() => logout()}
                    className="bg-white/20 border-2 border-white/10 px-5 py-1.5 rounded"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="hidden md:block px-6 py-2.5 active:scale-95 transition-all rounded-full"
              style={{backgroundColor: '#e947f6'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d926e8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e947f6'}
            >
              Get Started
            </button>
          )}
          <button onClick={() => setIsOpen(true)} className="md:hidden">
            <MenuIcon size={26} className="active:scale-90 transition" />
          </button>
        </div>
      </motion.nav>

      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-400 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link onClick={() => setIsOpen(false)} to="/">
          Home
        </Link>
        <Link onClick={() => setIsOpen(false)} to="/generate">
          Generate
        </Link>
        {isLoggedIn ? (
          <>
            <Link onClick={() => setIsOpen(false)} to="/my-generation">
              My Generations
            </Link>
            <Link onClick={() => setIsOpen(false)} to="/youtube">
              YouTube
            </Link>
          </>
        ) : null}
        <Link onClick={() => setIsOpen(false)} to="/pricing">
          Pricing
        </Link>
        <Link onClick={() => setIsOpen(false)} to="/#contact">
          Contact Us
        </Link>
        {isLoggedIn ? (
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            Logout
          </button>
        ) : (
          <Link onClick={() => setIsOpen(false)} to="/login">
            Login
          </Link>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="active:ring-3 active:ring-white aspect-square size-10 p-1 items-center justify-center bg-pink-600 hover:bg-pink-700 transition text-white rounded-md flex"
        >
          <XIcon />
        </button>
      </div>
    </>
  );
}
