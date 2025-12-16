import { Injectable, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(GstinVerificationService.name);

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
    // First validate format and checksum
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

    // TODO: Integrate with actual GST verification API
    // Example integration structure:
    // try {
    //   const response = await this.httpService.get(`https://api.gst.gov.in/taxpayer/search`, {
    //     params: { gstin },
    //     headers: { Authorization: `Bearer ${process.env.GST_API_TOKEN}` }
    //   });
    //   return this.mapApiResponseToResult(response.data);
    // } catch (error) {
    //   this.logger.error(`GSTIN verification failed for ${gstin}:`, error);
    //   return { isValid: false, error: "Verification service unavailable" };
    // }

    // Placeholder: Return basic validation result
    // In production, this should call actual GST verification API
    this.logger.warn(
      `GSTIN verification API not integrated. Using format validation only for ${gstin}`,
    );

    return {
      isValid: true,
      isActive: null, // Would be populated from API
      legalName: null, // Would be populated from API
      tradeName: null, // Would be populated from API
      registrationDate: null, // Would be populated from API
      status: null, // Would be populated from API
      businessType: null, // Would be populated from API
      address: null, // Would be populated from API
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
