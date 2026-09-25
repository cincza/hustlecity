import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const LANGUAGE_KEY = "hustle-city-language";

export async function getStoredLanguage() {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(LANGUAGE_KEY);
    }
    return await SecureStore.getItemAsync(LANGUAGE_KEY);
  } catch (_error) {
    return null;
  }
}

export async function saveStoredLanguage(language) {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(LANGUAGE_KEY, language);
      return true;
    }
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    return true;
  } catch (_error) {
    return false;
  }
}

