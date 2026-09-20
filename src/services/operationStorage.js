import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Unlike optional preferences, a failed write must stop the request before it is sent.
export const operationStorage = {
  async get(key) {
    return Platform.OS === "web" ? window.localStorage.getItem(key) : SecureStore.getItemAsync(key);
  },
  async set(key, value) {
    if (Platform.OS === "web") window.localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async remove(key) {
    if (Platform.OS === "web") window.localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};
