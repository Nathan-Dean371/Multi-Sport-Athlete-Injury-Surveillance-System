const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

console.log("[API Client] Initialized with URL:", API_URL);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    identity_type: string;
    pseudonym_id: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface InjuryStats {
  totalPlayers: number;
  totalInjuries: number;
  activeInjuries: number;
  resolvedInjuries: number;
  injuriesByStatus: Record<string, number>;
  injuriesByType?: Record<string, number>;
  injuriesBySeverity?: Record<string, number>;
  recentInjuries?: Array<{
    id: string;
    playerName: string;
    type: string;
    status: string;
    reportedDate: string;
  }>;
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("authToken");
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_URL}${endpoint}`;
    console.log("[API Client] Making request to:", url, {
      method: options.method || "GET",
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log(
        "[API Client] Response status:",
        response.status,
        response.statusText,
      );

      if (!response.ok) {
        let error: any = {};
        try {
          error = await response.json();
        } catch {
          // Response body is not JSON
        }
        throw {
          message:
            error.message || `Request failed with status ${response.status}`,
          statusCode: response.status,
        } as ApiError;
      }

      const data = await response.json();
      console.log("[API Client] Response data:", data);
      return data;
    } catch (error) {
      console.error("[API Client] Request failed:", error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log("[API Client] Attempting login for:", data.email);
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getStats(): Promise<InjuryStats> {
    // TODO: Replace with actual API call to /injuries/stats once endpoint is created
    // For now, returning mock data for demonstration
    return {
      totalPlayers: 47,
      totalInjuries: 23,
      activeInjuries: 8,
      resolvedInjuries: 15,
      injuriesByStatus: {
        Active: 8,
        Resolved: 15,
      },
      injuriesByType: {
        Sprain: 7,
        Fracture: 3,
        "Muscle Strain": 5,
        Concussion: 2,
        Laceration: 6,
      },
      injuriesBySeverity: {
        Minor: 12,
        Moderate: 7,
        Severe: 4,
      },
      recentInjuries: [
        {
          id: "INJ-001",
          playerName: "Liam Murphy",
          type: "Sprain",
          status: "Active",
          reportedDate: "2026-03-02",
        },
        {
          id: "INJ-002",
          playerName: "Emma O'Brien",
          type: "Muscle Strain",
          status: "Active",
          reportedDate: "2026-03-02",
        },
        {
          id: "INJ-003",
          playerName: "Sean Gallagher",
          type: "Fracture",
          status: "Resolved",
          reportedDate: "2026-02-28",
        },
        {
          id: "INJ-004",
          playerName: "Ana Silva",
          type: "Concussion",
          status: "Active",
          reportedDate: "2026-03-01",
        },
        {
          id: "INJ-005",
          playerName: "James Quinn",
          type: "Laceration",
          status: "Resolved",
          reportedDate: "2026-02-25",
        },
      ],
    };
  }

  async logout() {
    this.clearToken();
  }
}

export const apiClient = new ApiClient();
