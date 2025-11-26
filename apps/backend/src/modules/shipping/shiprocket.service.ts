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
    // Authenticate if no token exists
    if (!this.authToken) {
      await this.authenticate();
    }

    // Check if token is expired (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    if (
      this.authToken?.expiresAt &&
      Date.now() >= this.authToken.expiresAt - bufferTime
    ) {
      await this.authenticate();
    }

    // Final check - TypeScript should now know authToken is not null
    if (!this.authToken) {
      throw new Error("Failed to obtain authentication token");
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

  /**
   * Calculate shipping rates
   * @param pickupPincode - Pickup PIN code (seller location)
   * @param deliveryPincode - Delivery PIN code (buyer location)
   * @param weight - Weight in kg
   * @param orderValue - Order value in INR
   * @param codAmount - COD amount in INR (optional)
   * @returns Calculated rates for available couriers
   */
  async calculateRates(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    orderValue: number,
    codAmount?: number,
  ): Promise<{
    pickupPincode: string;
    deliveryPincode: string;
    weight: number;
    orderValue: number;
    codAmount: number | null;
    courierRates: Array<{
      courierId: number;
      courierName: string;
      rate: number;
      estimatedDeliveryDays: number | null;
      codCharges: number;
      totalRate: number;
      codAvailable: boolean;
      isRecommended: boolean;
    }>;
    totalCouriers: number;
    message: string;
  }> {
    if (!this.isInitialized()) {
      throw new Error(
        "Shiprocket is not initialized. Please initialize Shiprocket first.",
      );
    }

    // Prepare request payload for Shiprocket API
    const payload: {
      pickup_postcode: string;
      delivery_postcode: string;
      weight: number;
      cod_amount?: number;
      order_amount: number;
    } = {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight,
      order_amount: orderValue,
    };

    // Add COD amount if provided
    if (codAmount !== undefined && codAmount > 0) {
      payload.cod_amount = codAmount;
    }

    // Call Shiprocket rate calculation API
    const response = await this.makeRequest<{
      data: {
        available_courier_companies: Array<{
          id: number;
          courier_name: string;
          rate: number;
          estimated_delivery_days: number | null;
          cod_charges?: number;
          cod_available: boolean;
          is_recommended?: boolean;
        }>;
      };
    }>("/courier/serviceability/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Transform Shiprocket response to our format
    const courierRates =
      response.data?.available_courier_companies?.map((courier) => {
        const codCharges = courier.cod_charges || 0;
        const totalRate = courier.rate + codCharges;

        return {
          courierId: courier.id,
          courierName: courier.courier_name,
          rate: courier.rate,
          estimatedDeliveryDays: courier.estimated_delivery_days,
          codCharges,
          totalRate,
          codAvailable: courier.cod_available || false,
          isRecommended: courier.is_recommended || false,
        };
      }) || [];

    return {
      pickupPincode,
      deliveryPincode,
      weight,
      orderValue,
      codAmount: codAmount || null,
      courierRates,
      totalCouriers: courierRates.length,
      message:
        courierRates.length > 0
          ? "Rates calculated successfully"
          : "No couriers available for this route",
    };
  }
}
