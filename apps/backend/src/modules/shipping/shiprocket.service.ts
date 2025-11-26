import { Injectable, OnModuleInit } from "@nestjs/common";
import { ShiprocketConfigService } from "./shiprocket-config.service";

export interface ShiprocketAuthToken {
  token: string;
  expiresAt?: number;
}

@Injectable()
export class ShiprocketService implements OnModuleInit {
  private authToken: ShiprocketAuthToken | null = null;
  private email: string | null = null;
  private password: string | null = null;
  private baseUrl: string;

  constructor(
    private readonly shiprocketConfigService: ShiprocketConfigService,
  ) {
    this.baseUrl = this.shiprocketConfigService.getBaseUrl();
  }

  /**
   * Initialize Shiprocket on module initialization
   * Reads configuration from environment variables
   */
  onModuleInit() {
    // Note: We don't authenticate here to avoid blocking module initialization
    // Authentication will happen on first use or via manual initialization
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (email && password) {
      // Store credentials but don't authenticate yet
      this.email = email;
      this.password = password;
    }
  }

  /**
   * Initialize Shiprocket with credentials
   * @param email - Shiprocket API email
   * @param password - Shiprocket API password
   */
  async initialize(email: string, password: string): Promise<void> {
    this.email = email;
    this.password = password;

    // Authenticate and get token
    await this.authenticate();
  }

  /**
   * Authenticate with Shiprocket API
   * @returns Authentication token
   */
  async authenticate(): Promise<string> {
    if (!this.email || !this.password) {
      throw new Error(
        "Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables.",
      );
    }

    const response = await this.shiprocketConfigService.authenticate({
      email: this.email,
      password: this.password,
      baseUrl: this.baseUrl,
    });

    // Store token with expiration (default 24 hours if not provided)
    const expiresIn = response.expires_in || 86400; // 24 hours in seconds
    this.authToken = {
      token: response.token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return response.token;
  }

  /**
   * Get current authentication token
   * Automatically refreshes if expired
   * @returns Authentication token
   */
  async getAuthToken(): Promise<string> {
    if (!this.authToken) {
      await this.authenticate();
      if (!this.authToken) {
        throw new Error("Failed to authenticate with Shiprocket");
      }
      return this.authToken.token;
    }

    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (
      this.authToken.expiresAt &&
      Date.now() >= this.authToken.expiresAt - bufferTime
    ) {
      await this.authenticate();
    }

    return this.authToken.token;
  }

  /**
   * Check if Shiprocket is initialized
   * @returns true if Shiprocket is initialized
   */
  isInitialized(): boolean {
    return this.email !== null && this.password !== null;
  }

  /**
   * Test API connection
   * @returns Connection test result
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    authenticated: boolean;
  }> {
    if (!this.isInitialized()) {
      return {
        success: false,
        message: "Shiprocket is not initialized",
        authenticated: false,
      };
    }

    try {
      const token = await this.getAuthToken();
      return {
        success: true,
        message: "Shiprocket API connection successful",
        authenticated: !!token,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to Shiprocket API",
        authenticated: false,
      };
    }
  }

  /**
   * Make authenticated API request to Shiprocket
   * @param endpoint - API endpoint (without base URL)
   * @param options - Fetch options
   * @returns API response
   */
  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getAuthToken();
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Shiprocket API request failed: ${error.message || response.statusText}`,
      );
    }

    return response.json();
  }
}
