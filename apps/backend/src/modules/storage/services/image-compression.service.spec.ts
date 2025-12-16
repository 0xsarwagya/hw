import { Test, TestingModule } from "@nestjs/testing";
import { ImageCompressionService } from "./image-compression.service";
import sharp from "sharp";

// Mock sharp
jest.mock("sharp", () => {
  const mockSharp = jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("compressed")),
  }));

  return jest.fn(() => mockSharp());
});

describe("ImageCompressionService", () => {
  let service: ImageCompressionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageCompressionService],
    }).compile();

    service = module.get<ImageCompressionService>(ImageCompressionService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isImage", () => {
    it("should identify JPEG images by MIME type", () => {
      const buffer = Buffer.from("fake jpeg");
      expect(service.isImage(buffer, "image/jpeg")).toBe(true);
      expect(service.isImage(buffer, "image/jpg")).toBe(true);
    });

    it("should identify PNG images by MIME type", () => {
      const buffer = Buffer.from("fake png");
      expect(service.isImage(buffer, "image/png")).toBe(true);
    });

    it("should identify WebP images by MIME type", () => {
      const buffer = Buffer.from("fake webp");
      expect(service.isImage(buffer, "image/webp")).toBe(true);
    });

    it("should identify images by magic numbers", () => {
      // JPEG signature: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(service.isImage(jpegBuffer)).toBe(true);

      // PNG signature: 89 50 4E 47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      expect(service.isImage(pngBuffer)).toBe(true);
    });

    it("should return false for non-image buffers", () => {
      const textBuffer = Buffer.from("not an image");
      expect(service.isImage(textBuffer)).toBe(false);
      expect(service.isImage(textBuffer, "text/plain")).toBe(false);
    });
  });

  describe("compress", () => {
    it("should compress image with default options", async () => {
      const buffer = Buffer.from("fake image");
      const result = await service.compress(buffer);

      expect(sharp).toHaveBeenCalledWith(buffer);
      expect(result).toBeInstanceOf(Buffer);
    });

    it("should compress image with custom quality", async () => {
      const buffer = Buffer.from("fake image");
      await service.compress(buffer, { quality: 80 });

      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should compress image with custom maxWidth", async () => {
      const buffer = Buffer.from("fake image");
      await service.compress(buffer, { maxWidth: 1920 });

      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should compress image to WebP format", async () => {
      const buffer = Buffer.from("fake image");
      await service.compress(buffer, { format: "webp" });

      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should compress image to JPEG format", async () => {
      const buffer = Buffer.from("fake image");
      await service.compress(buffer, { format: "jpeg" });

      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should compress image to PNG format", async () => {
      const buffer = Buffer.from("fake image");
      await service.compress(buffer, { format: "png" });

      expect(sharp).toHaveBeenCalledWith(buffer);
    });

    it("should return original buffer if compression fails", async () => {
      const buffer = Buffer.from("fake image");
      const mockSharpInstance = {
        metadata: jest.fn().mockRejectedValue(new Error("Invalid image")),
        resize: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error("Compression failed")),
      };
      (sharp as jest.Mock).mockReturnValue(mockSharpInstance);

      const result = await service.compress(buffer);
      expect(result).toBe(buffer);
    });
  });

  describe("getOptimizedMimeType", () => {
    it("should return WebP MIME type for webp format", () => {
      expect(service.getOptimizedMimeType("webp")).toBe("image/webp");
    });

    it("should return JPEG MIME type for jpeg format", () => {
      expect(service.getOptimizedMimeType("jpeg")).toBe("image/jpeg");
    });

    it("should return PNG MIME type for png format", () => {
      expect(service.getOptimizedMimeType("png")).toBe("image/png");
    });

    it("should default to WebP MIME type", () => {
      expect(service.getOptimizedMimeType()).toBe("image/webp");
    });
  });

  describe("getFileExtension", () => {
    it("should return webp extension for webp format", () => {
      expect(service.getFileExtension("webp")).toBe("webp");
    });

    it("should return jpg extension for jpeg format", () => {
      expect(service.getFileExtension("jpeg")).toBe("jpg");
    });

    it("should return png extension for png format", () => {
      expect(service.getFileExtension("png")).toBe("png");
    });

    it("should default to webp extension", () => {
      expect(service.getFileExtension()).toBe("webp");
    });
  });
});

