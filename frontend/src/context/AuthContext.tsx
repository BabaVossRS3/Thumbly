import { createContext, useContext, useEffect, useState } from "react";
import type { IUser } from "../assets/assets";
import api from "../configs/api";
import { toast } from "sonner";

interface AuthContextProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (credentials: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextProps | null>({
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  user: null,
  setUser: () => {},
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const [user, setUser] = useState<IUser | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    const signup = async ({name , email , password}: {name: string , email: string , password: string}) => {
        try {
            const {data} = await api.post('/api/auth/register' , {name , email , password});
            if(data.user){
                setUser(data.user as IUser);
                setIsLoggedIn(true);
                toast.success('Account created successfully');
            }
        } catch (error: any) {
            console.log(error);
            toast.error(error.response?.data?.message || 'An error occurred during signup');
        }
    }

    const login = async ({email , password}: {email: string , password: string}) => {
         try {
            const {data} = await api.post('/api/auth/login' , {email , password});
            if(data.user){
                setUser(data.user as IUser);
                setIsLoggedIn(true);
                toast.success('Logged in successfully');
            }
        } catch (error: any) {
            console.log(error);
            toast.error(error.response?.data?.message || 'An error occurred during login');
        }
    }

    const logout = async () => {
         try {
            await api.post('/api/auth/logout');
           setUser(null);
           setIsLoggedIn(false);
           localStorage.clear();
           toast.success('Logged out successfully');
        } catch (error: any) {
            console.log(error);
            setUser(null);
            setIsLoggedIn(false);
            localStorage.clear();
            toast.error(error.response?.data?.message || 'An error occurred during logout');
        }
    }

    const fetchUser = async () => {
          try {
            const {data} = await api.get('/api/auth/verify');
            if(data.user){
                setUser(data.user as IUser);
                setIsLoggedIn(true);
            }
            //toast here
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        (async () => {
            await fetchUser();
        })();
    }, []);

    const value: AuthContextProps = {
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
        login,
        signup,
        logout,
    };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};