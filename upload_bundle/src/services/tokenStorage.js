import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "hustle-city-auth-token";

export async function getStoredAuthToken() {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  } catch (_error) {
    return null;
  }
}

export async function saveStoredAuthToken(token) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && typeof token === "string") {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      }
      return true;
    }
    if (typeof token !== "string" || !token.trim()) {
      return false;
    }
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    return true;
  } catch (_error) {
    return false;
  }
}

export async function clearStoredAuthToken() {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      return true;
    }
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    return true;
  } catch (_error) {
    return false;
  }
}
