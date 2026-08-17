import { ReactNode, createContext, useContext, useEffect } from "react";
import {
  getGetMeQueryKey,
  useGetMe,
  useLogout,
} from "@workspace/api-client-react";
import { appPath, removeToken } from "@/lib/auth";
import { useLocation } from "wouter";

type AuthContextType = {
  user: ReturnType<typeof useGetMe>["data"];
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  const logoutMutation = useLogout();

  useEffect(() => {
    const isPublicRoute = location === appPath("login") || location === appPath("register");
    if (error && !isPublicRoute) {
      removeToken();
      window.location.href = appPath("login");
    }
  }, [error, location]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        removeToken();
          window.location.href = appPath("login");
      },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        logout: handleLogout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
