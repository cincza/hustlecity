const DEV_LOCALHOST_API_BASE_URL = "http://localhost:4000";

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEV_LOCALHOST_API_BASE_URL).replace(/\/+$/, "");
