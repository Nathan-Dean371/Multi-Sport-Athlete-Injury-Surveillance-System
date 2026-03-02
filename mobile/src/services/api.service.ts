import axios, { AxiosInstance, AxiosError } from "axios";
import config from "../constants/config";
import { getToken, removeToken, removeUser } from "../utils/storage";
import { isJwtExpired } from "../utils/jwt";
import { emitUnauthorized } from "../utils/auth-events";

class ApiService {
  private client: AxiosInstance;

  constructor() {
    console.log("🌐 API Service initialized with baseURL:", config.apiUrl);
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          if (isJwtExpired(token, 30)) {
            await removeToken();
            await removeUser();
            emitUnauthorized();
          } else {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        console.error("📡 API Error Details:", {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`,
        });

        if (error.response?.status === 401) {
          // Token expired or invalid
          await removeToken();
          await removeUser();
          emitUnauthorized();
          // Redirect to login will be handled by AuthContext
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export default new ApiService();
