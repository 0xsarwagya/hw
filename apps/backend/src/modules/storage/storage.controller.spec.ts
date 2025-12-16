import { Test, TestingModule } from "@nestjs/testing";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { ImageCompressionService } from "./services/image-compression.service";

describe("StorageController", () => {
  let controller: StorageController;
  let storageService: jest.Mocked<StorageService>;
  let imageCompressionService: jest.Mocked<ImageCompressionService>;

  const mockStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
    getPresignedUrl: jest.fn(),
    exists: jest.fn(),
    list: jest.fn(),
  };

  const mockImageCompressionService = {
    isImage: jest.fn(),
    compress: jest.fn(),
    getOptimizedMimeType: jest.fn(),
    getFileExtension: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ImageCompressionService,
          useValue: mockImageCompressionService,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    storageService = module.get(StorageService) as jest.Mocked<StorageService>;
    imageCompressionService = module.get(ImageCompressionService) as jest.Mocked<ImageCompressionService>;

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("uploadFile", () => {
    it("should upload a file successfully", async () => {
      const mockFile: Express.Multer.File = {
        fieldname: "file",
        originalname: "test.jpg",
        encoding: "7bit",
        mimetype: "image/jpeg",
        size: 1024,
        buffer: Buffer.from("test image"),
        destination: "",
        filename: "",
        path: "",
        stream: null as any,
      };

      mockImageCompressionService.isImage.mockReturnValue(true);
      mockImageCompressionService.compress.mockResolvedValue(Buffer.from("compressed"));
      mockImageCompressionService.getOptimizedMimeType.mockReturnValue("image/webp");
      mockImageCompressionService.getFileExtension.mockReturnValue("webp");
      storageService.upload.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp");

      const result = await controller.uploadFile(mockFile, { prefix: "products" });

      expect(result).toBeDefined();
      expect(result.key).toContain("products");
      expect(result.url).toBe("http://localhost:9000/vcecom/products/test.webp");
      expect(storageService.upload).toHaveBeenCalled();
    });

    it("should throw error if no file provided", async () => {
      await expect(controller.uploadFile(null as any, {})).rejects.toThrow("No file provided");
    });

    it("should throw error for invalid file type", async () => {
      const mockFile: Express.Multer.File = {
        fieldname: "file",
        originalname: "test.pdf",
        encoding: "7bit",
        mimetype: "application/pdf",
        size: 1024,
        buffer: Buffer.from("test pdf"),
        destination: "",
        filename: "",
        path: "",
        stream: null as any,
      };

      await expect(controller.uploadFile(mockFile, {})).rejects.toThrow("File type");
    });
  });

  describe("uploadBatch", () => {
    it("should upload multiple files successfully", async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: "files",
          originalname: "test1.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          size: 1024,
          buffer: Buffer.from("test image 1"),
          destination: "",
          filename: "",
          path: "",
          stream: null as any,
        },
        {
          fieldname: "files",
          originalname: "test2.jpg",
          encoding: "7bit",
          mimetype: "image/jpeg",
          size: 2048,
          buffer: Buffer.from("test image 2"),
          destination: "",
          filename: "",
          path: "",
          stream: null as any,
        },
      ];

      mockImageCompressionService.isImage.mockReturnValue(true);
      mockImageCompressionService.compress.mockResolvedValue(Buffer.from("compressed"));
      mockImageCompressionService.getOptimizedMimeType.mockReturnValue("image/webp");
      mockImageCompressionService.getFileExtension.mockReturnValue("webp");
      storageService.upload.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp");

      const result = await controller.uploadBatch(mockFiles, { prefix: "products" });

      expect(result).toHaveLength(2);
      expect(storageService.upload).toHaveBeenCalledTimes(2);
    });

    it("should throw error if no files provided", async () => {
      await expect(controller.uploadBatch([], {})).rejects.toThrow("No files provided");
    });
  });

  describe("deleteFile", () => {
    it("should delete a file successfully", async () => {
      storageService.delete.mockResolvedValue(undefined);

      await controller.deleteFile("products/test.webp");

      expect(storageService.delete).toHaveBeenCalledWith("products/test.webp");
    });
  });

  describe("getFile", () => {
    it("should get file metadata successfully", async () => {
      storageService.getUrl.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp");
      storageService.exists.mockResolvedValue(true);

      const result = await controller.getFile("products/test.webp");

      expect(result.key).toBe("products/test.webp");
      expect(result.url).toBe("http://localhost:9000/vcecom/products/test.webp");
    });

    it("should throw error if file does not exist", async () => {
      storageService.getUrl.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp");
      storageService.exists.mockResolvedValue(false);

      await expect(controller.getFile("products/test.webp")).rejects.toThrow("File not found");
    });
  });

  describe("listFiles", () => {
    it("should list files successfully", async () => {
      storageService.list.mockResolvedValue(["products/file1.webp", "products/file2.webp"]);

      const result = await controller.listFiles({ prefix: "products" });

      expect(result.files).toHaveLength(2);
      expect(result.prefix).toBe("products");
      expect(result.total).toBe(2);
    });

    it("should use default prefix if not provided", async () => {
      storageService.list.mockResolvedValue([]);

      const result = await controller.listFiles({});

      expect(result.prefix).toBe("");
    });
  });

  describe("generatePresignedUrl", () => {
    it("should generate presigned URL successfully", async () => {
      storageService.getPresignedUrl.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp?signature=abc123");

      const result = await controller.generatePresignedUrl({
        key: "products/test.webp",
        expiresIn: 3600,
      });

      expect(result.key).toBe("products/test.webp");
      expect(result.url).toContain("signature");
      expect(result.expiresIn).toBe(3600);
    });

    it("should use default expiration if not provided", async () => {
      storageService.getPresignedUrl.mockResolvedValue("http://localhost:9000/vcecom/products/test.webp?signature=abc123");

      const result = await controller.generatePresignedUrl({
        key: "products/test.webp",
      });

      expect(result.expiresIn).toBe(3600);
    });
  });

  describe("batchDelete", () => {
    it("should delete multiple files successfully", async () => {
      storageService.delete.mockResolvedValue(undefined);

      const result = await controller.batchDelete({
        keys: ["products/file1.webp", "products/file2.webp"],
      });

      expect(result.deleted).toBe(2);
      expect(result.failed).toHaveLength(0);
      expect(storageService.delete).toHaveBeenCalledTimes(2);
    });

    it("should track failed deletions", async () => {
      storageService.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Failed"));

      const result = await controller.batchDelete({
        keys: ["products/file1.webp", "products/file2.webp"],
      });

      expect(result.deleted).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toBe("products/file2.webp");
    });
  });
});

