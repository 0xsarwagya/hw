import { Injectable } from "@nestjs/common";

export interface NimbusPostConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

export interface NimbusPostAuthResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

@Injectable()
export class NimbusPostConfigService {
  private baseUrl = "https://api.nimbuspost.com/v1";

  /**
   * Get Nimbus Post API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Authenticate with Nimbus Post API
   * @param config - Nimbus Post configuration
   * @returns Authentication token
   */
  async authenticate(
    config: NimbusPostConfig,
  ): Promise<NimbusPostAuthResponse> {
    const baseUrl = config.baseUrl || this.baseUrl;
    const response = await fetch(`${baseUrl}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        api_secret: config.apiSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Nimbus Post authentication failed: ${error.message || response.statusText}`,
      );
    }

    return response.json();
  }
}
