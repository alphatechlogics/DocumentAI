import { useRouter } from "expo-router";
import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useRef,
  useEffect,
} from "react";

type User = {
  name: string;
  email: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

type AuthAction =
  | { type: "LOGIN"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "LOADING" }
  | { type: "ERROR"; payload: string };

type AuthContextType = {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
      };
    case "LOGOUT":
      return initialState;
    case "LOADING":
      return { ...state, isLoading: true, error: null };
    case "ERROR":
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const navigationRef = useRef(router);

  useEffect(() => {
    navigationRef.current = router;
  }, [router]);

  const mockAuth = async (userData: { name?: string; email: string }) => {
    return new Promise<{ user: User; token: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            name: userData.name || "Test User",
            email: userData.email,
          },
          token: "mock-jwt-token",
        });
      }, 500);
    });
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: "LOADING" });

      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const { user, token } = await mockAuth({ email });
      dispatch({ type: "LOGIN", payload: { user, token } });

      // Use navigation ref to prevent re-render issues
      navigationRef.current.replace("/(tabs)");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "ERROR", payload: errorMessage });
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      dispatch({ type: "LOADING" });

      if (!name || !email || !password) {
        throw new Error("All fields are required");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { user, token } = await mockAuth({ name, email });
      dispatch({ type: "LOGIN", payload: { user, token } });
      navigationRef.current.replace("/(tabs)");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Signup failed";
      dispatch({ type: "ERROR", payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    navigationRef.current.replace("/auth");
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
