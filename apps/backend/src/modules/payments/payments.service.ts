import { Injectable, OnModuleInit } from "@nestjs/common";
import Razorpay from "razorpay";
import { RazorpayConfigService } from "./razorpay-config.service";

@Injectable()
export class PaymentsService implements OnModuleInit {
  private razorpay: Razorpay | null = null;

  constructor(private readonly razorpayConfigService: RazorpayConfigService) {}

  /**
   * Initialize Razorpay on module initialization
   * Reads configuration from environment variables
   */
  onModuleInit() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      this.razorpay = this.razorpayConfigService.initialize({
        keyId,
        keySecret,
      });
    }
  }

  /**
   * Get Razorpay instance
   * @returns Razorpay instance
   * @throws Error if Razorpay is not initialized
   */
  getRazorpayInstance(): Razorpay {
    if (!this.razorpay) {
      throw new Error(
        "Razorpay is not initialized. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.",
      );
    }
    return this.razorpay;
  }

  /**
   * Check if Razorpay is initialized
   * @returns true if Razorpay is initialized
   */
  isInitialized(): boolean {
    return this.razorpay !== null;
  }

  /**
   * Initialize Razorpay with custom configuration
   * @param keyId - Razorpay Key ID
   * @param keySecret - Razorpay Key Secret
   */
  initialize(keyId: string, keySecret: string): void {
    this.razorpay = this.razorpayConfigService.initialize({
      keyId,
      keySecret,
    });
  }
}
