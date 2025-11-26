import { Injectable } from "@nestjs/common";
import Razorpay from "razorpay";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

@Injectable()
export class RazorpayConfigService {
  private razorpayInstance: Razorpay | null = null;

  /**
   * Initialize Razorpay instance with API keys
   * @param config - Razorpay configuration with keyId and keySecret
   * @returns Razorpay instance
   */
  initialize(config: RazorpayConfig): Razorpay {
    if (!config.keyId || !config.keySecret) {
      throw new Error(
        "Razorpay keyId and keySecret are required for initialization",
      );
    }

    this.razorpayInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });

    return this.razorpayInstance;
  }

  /**
   * Get the initialized Razorpay instance
   * @returns Razorpay instance or null if not initialized
   */
  getInstance(): Razorpay | null {
    return this.razorpayInstance;
  }

  /**
   * Check if Razorpay is initialized
   * @returns true if Razorpay instance exists
   */
  isInitialized(): boolean {
    return this.razorpayInstance !== null;
  }

  /**
   * Reset the Razorpay instance (useful for testing)
   */
  reset(): void {
    this.razorpayInstance = null;
  }
}
