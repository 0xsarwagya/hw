import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import sharp from "sharp";
import {
  CompressionOptionsDto,
  DEFAULT_COMPRESSION_OPTIONS,
} from "../dto/compression-options.dto";

@Injectable()
export class ImageCompressionService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Check if a buffer contains an image
   */
  isImage(buffer: Buffer, mimeType?: string): boolean {
    // Check MIME type first
    if (mimeType) {
      const imageMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/tiff",
      ];
      if (imageMimeTypes.includes(mimeType.toLowerCase())) {
        return true;
      }
    }

    // Check magic numbers (file signatures)
    const signatures = [
      [0xff, 0xd8, 0xff], // JPEG
      [0x89, 0x50, 0x4e, 0x47], // PNG
      [0x47, 0x49, 0x46, 0x38], // GIF
      [0x52, 0x49, 0x46, 0x46], // WebP (RIFF)
      [0x42, 0x4d], // BMP
    ];

    for (const signature of signatures) {
      if (buffer.length < signature.length) continue;
      const matches = signature.every((byte, index) => buffer[index] === byte);
      if (matches) return true;
    }

    return false;
  }

  /**
   * Compress an image buffer
   * @param buffer - Image buffer
   * @param options - Compression options
   * @returns Compressed image buffer
   */
  async compress(
    buffer: Buffer,
    options: CompressionOptionsDto = {},
  ): Promise<Buffer> {
    const opts = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };

    try {
      let pipeline = sharp(buffer);

      // Get image metadata
      const metadata = await pipeline.metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        this.logger.warn(
          "Unable to determine image dimensions, skipping resize",
        );
        return buffer;
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;

      if (width > opts.maxWidth || height > opts.maxHeight) {
        const aspectRatio = width / height;
        if (width > opts.maxWidth) {
          newWidth = opts.maxWidth;
          newHeight = Math.round(newWidth / aspectRatio);
        }
        if (newHeight > opts.maxHeight) {
          newHeight = opts.maxHeight;
          newWidth = Math.round(newHeight * aspectRatio);
        }
      }

      // Resize if needed
      if (newWidth !== width || newHeight !== height) {
        pipeline = pipeline.resize(newWidth, newHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Apply compression based on format
      switch (opts.format) {
        case "webp":
          pipeline = pipeline.webp({ quality: opts.quality });
          break;
        case "jpeg":
          pipeline = pipeline.jpeg({
            quality: opts.quality,
            progressive: true,
          });
          break;
        case "png":
          pipeline = pipeline.png({
            quality: opts.quality,
            compressionLevel: 9,
          });
          break;
        default:
          pipeline = pipeline.webp({ quality: opts.quality });
      }

      const compressedBuffer = await pipeline.toBuffer();
      const originalSize = buffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio =
        ((originalSize - compressedSize) / originalSize) * 100;

      this.logger.info(
        `Image compressed: ${originalSize} bytes -> ${compressedSize} bytes (${compressionRatio.toFixed(1)}% reduction)`,
      );

      return compressedBuffer;
    } catch (error) {
      this.logger.error(
        `Failed to compress image: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Return original buffer if compression fails
      return buffer;
    }
  }

  /**
   * Get optimized MIME type for compressed image
   */
  getOptimizedMimeType(
    format: CompressionOptionsDto["format"] = "webp",
  ): string {
    switch (format) {
      case "webp":
        return "image/webp";
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      default:
        return "image/webp";
    }
  }

  /**
   * Get file extension for format
   */
  getFileExtension(format: CompressionOptionsDto["format"] = "webp"): string {
    switch (format) {
      case "webp":
        return "webp";
      case "jpeg":
        return "jpg";
      case "png":
        return "png";
      default:
        return "webp";
    }
  }
}
