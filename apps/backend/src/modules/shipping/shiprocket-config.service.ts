import { Injectable } from "@nestjs/common";

export interface ShiprocketConfig {
  email: string;
  password: string;
  baseUrl?: string;
}

export interface ShiprocketAuthResponse {
  token: string;
  expires_in?: number;
}

@Injectable()
export class ShiprocketConfigService {
  private baseUrl = "https://apiv2.shiprocket.in/v1/external";

  /**
   * Get Shiprocket API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Authenticate with Shiprocket API
   * @param config - Shiprocket configuration
   * @returns Authentication token
   */
  async authenticate(
    config: ShiprocketConfig,
  ): Promise<ShiprocketAuthResponse> {
    const baseUrl = config.baseUrl || this.baseUrl;
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: config.email,
        password: config.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Shiprocket authentication failed: ${error.message || response.statusText}`,
      );
    }

    return response.json();
  }
}
