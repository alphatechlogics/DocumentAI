import { SECURITY_SERVICE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

type User = {
  name: string;
  email: string;
  role?: string;
  roleId?: string;
  userId?: string;
  userName?: string;
  appId: string;
  appName?: string;
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
  | { type: "ERROR"; payload: string }
  | {
      type: "RESTORE_AUTH";
      payload: { user: User | null; token: string | null };
    };

type AuthContextType = {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
  login: (email: string, password: string, appId: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    appId: string,
    appName: string,
    roleId?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
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
      return {
        ...initialState,
        isLoading: false,
      };
    case "LOADING":
      return { ...state, isLoading: true, error: null };
    case "ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "RESTORE_AUTH":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    default:
      return state;
  }
};

const storeAuthData = async (user: User, token: string) => {
  try {
    await AsyncStorage.multiSet([
      ["user", JSON.stringify(user)],
      ["token", token],
      ["userId", user.userId || ""],
      ["userName", user.name || ""],
      ["appId", user.appId || ""],
      ["appName", user.appName || ""],
      ["roleId", user.roleId || ""],
      ["role", user.role || ""],
    ]);
  } catch (error) {
    console.error("Error storing auth data:", error);
  }
};

const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      "user",
      "token",
      "userId",
      "userName",
      "appId",
      "appName",
      "roleId",
      "role",
    ]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

const loadAuthData = async () => {
  try {
    const [userString, token] = await AsyncStorage.multiGet(["user", "token"]);
    const user = userString[1] ? JSON.parse(userString[1]) : null;
    return { user, token: token[1] };
  } catch (error) {
    console.error("Error loading auth data:", error);
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const navigationRef = useRef(router);

  useEffect(() => {
    navigationRef.current = router;
  }, [router]);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { user, token } = await loadAuthData();
        if (user && token) {
          dispatch({ type: "RESTORE_AUTH", payload: { user, token } });
          navigationRef.current.replace("/home");
        } else {
          dispatch({
            type: "RESTORE_AUTH",
            payload: { user: null, token: null },
          });
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        dispatch({
          type: "RESTORE_AUTH",
          payload: { user: null, token: null },
        });
      }
    };

    checkAuthState();
  }, []);

  const login = async (email: string, password: string, appId: string) => {
    try {
      dispatch({ type: "LOADING" });

      if (!email || !password || !appId) {
        throw new Error("Email, password and appId are required");
      }

      const response = await fetch(`${SECURITY_SERVICE_URL}api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, appId }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      const userData = data.user || data;
      const user = {
        name: userData.fullName || userData.name || "User",
        email: userData.email,
        role: userData.role,
        roleId: userData.roleId,
        userId: userData.userId,
        appId: userData.appId,
        appName: userData.appName,
      };

      await storeAuthData(user, data.token || data.accessToken);

      dispatch({
        type: "LOGIN",
        payload: {
          user,
          token: data.token || data.accessToken,
        },
      });

      navigationRef.current.replace("/home");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch({ type: "ERROR", payload: errorMessage });
      console.error("Login error:", error);
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    appId: string,
    appName: string,
    roleId: string = "58962cb7-9c11-4a7b-93f6-dfdfa20eae64" // Default roleId for patients
  ) => {
    try {
      dispatch({ type: "LOADING" });

      if (!name || !email || !password || !appId || !appName) {
        throw new Error("All fields are required");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const response = await fetch(`${SECURITY_SERVICE_URL}api/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: "patient",
          roleId,
          fullName: name,
          appId,
          appName,
        }),
      });

      const responseText = await response.text();
      const data = responseText ? JSON.parse(responseText) : {};

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      const userData = data.user || data;
      const user = {
        name: userData.fullName || name,
        email: userData.email,
        role: userData.role || "patient",
        roleId: userData.roleId || roleId,
        userId: userData.userId,
        appId: userData.appId,
        appName: userData.appName,
      };

      await storeAuthData(user, data.token || data.accessToken);

      dispatch({
        type: "LOGIN",
        payload: {
          user,
          token: data.token || data.accessToken,
        },
      });

      navigationRef.current.replace("/login");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Signup failed";
      dispatch({ type: "ERROR", payload: errorMessage });
      console.error("Signup error:", error);
    }
  };

  const logout = async () => {
    await clearAuthData();
    dispatch({ type: "LOGOUT" });
    navigationRef.current.replace("/(auth)/login");
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
