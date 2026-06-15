import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    let message;

    if (!error.response) {
      // No response at all — network down or timeout
      message =
        error.code === "ECONNABORTED"
          ? "Request timed out. Check your internet connection."
          : "Cannot reach the server. Check your internet connection.";
    } else {
      const body = error.response?.data;
      // Vercel and some proxies return an HTML error page instead of JSON
      const isHtml =
        typeof body === "string" && body.trim().startsWith("<");
      message = !isHtml ? body?.message : undefined;

      if (!message) {
        switch (status) {
          case 400:
            message = "Invalid request. Please check your input.";
            break;
          case 401:
            message = "Session expired. Please log in again.";
            break;
          case 403:
            message = "You do not have permission to do this.";
            break;
          case 404:
            message = "Resource not found.";
            break;
          case 429:
            message = "Too many requests. Please slow down and try again.";
            break;
          case 500:
            message = "Server error. Please try again later.";
            break;
          case 502:
          case 503:
          case 504:
            message =
              "Server is temporarily unavailable. Try again in a moment.";
            break;
          default:
            message = "Something went wrong. Please try again.";
        }
      }
    }

    const err = new Error(message);
    err.status = status;
    return Promise.reject(err);
  },
);

export default client;
