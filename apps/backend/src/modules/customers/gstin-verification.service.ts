import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { validateGstin } from "../../common/utils/gstin.utils";

export interface GstinVerificationResult {
  isValid: boolean;
  isActive: boolean | null;
  legalName: string | null;
  tradeName: string | null;
  registrationDate: string | null;
  status: string | null;
  businessType: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
  } | null;
  error?: string;
}

@Injectable()
export class GstinVerificationService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Verify GSTIN using external API
   * This is a placeholder implementation that can be extended with actual API integration
   *
   * Potential APIs to integrate:
   * - GST Suvidha Provider (GSP) APIs
   * - GST Portal APIs (requires authentication)
   * - Third-party GST verification services
   *
   * @param gstin - GSTIN to verify
   * @returns Verification result
   */
  async verifyGstin(gstin: string): Promise<GstinVerificationResult> {
    // Validate format and checksum before attempting API call
    // This prevents unnecessary API calls for obviously invalid GSTINs
    if (!validateGstin(gstin)) {
      return {
        isValid: false,
        isActive: null,
        legalName: null,
        tradeName: null,
        registrationDate: null,
        status: null,
        businessType: null,
        address: null,
        error: "Invalid GSTIN format or checksum",
      };
    }

    // NOTE: Currently only validates format and checksum
    // TODO: Integrate with actual GST verification API (GST Suvidha Provider or GST Portal APIs)
    // This requires API credentials and proper error handling for rate limits
    this.logger.warn(
      `GSTIN verification API not integrated. Using format validation only for ${gstin}`,
    );

    // Return format-valid result (API integration pending)
    return {
      isValid: true,
      isActive: null,
      legalName: null,
      tradeName: null,
      registrationDate: null,
      status: null,
      businessType: null,
      address: null,
    };
  }

  /**
   * Batch verify multiple GSTINs
   * @param gstins - Array of GSTINs to verify
   * @returns Map of GSTIN to verification result
   */
  async verifyGstinsBatch(
    gstins: string[],
  ): Promise<Map<string, GstinVerificationResult>> {
    const results = new Map<string, GstinVerificationResult>();

    // Process in parallel (with rate limiting in production)
    const verificationPromises = gstins.map(async (gstin) => {
      const result = await this.verifyGstin(gstin);
      results.set(gstin, result);
    });

    await Promise.all(verificationPromises);

    return results;
  }
}
