import { Test, TestingModule } from "@nestjs/testing";
import { getCommonTestProviders } from "../../common/testing/test-helpers";
import { StorageService } from "./storage.service";
import { MinioProvider } from "./providers/minio.provider";
import { SupabaseProvider } from "./providers/supabase.provider";
import { AwsS3Provider } from "./providers/aws-s3.provider";

// Mock providers to avoid real connections in tests
jest.mock("./providers/minio.provider");
jest.mock("./providers/supabase.provider");
jest.mock("./providers/aws-s3.provider");

describe("StorageService", () => {
  let service: StorageService;
  let minioProvider: jest.Mocked<MinioProvider>;
  let supabaseProvider: jest.Mocked<SupabaseProvider>;
  let awsS3Provider: jest.Mocked<AwsS3Provider>;

  const mockMinioProvider = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
    getPresignedUrl: jest.fn(),
    exists: jest.fn(),
    list: jest.fn(),
  };

  const mockSupabaseProvider = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
    getPresignedUrl: jest.fn(),
    exists: jest.fn(),
    list: jest.fn(),
  };

  const mockAwsS3Provider = {
    upload: jest.fn(),
    delete: jest.fn(),
    getUrl: jest.fn(),
    getPresignedUrl: jest.fn(),
    exists: jest.fn(),
    list: jest.fn(),
  };

  beforeEach(async () => {
    // Reset environment
    delete process.env.STORAGE_PROVIDER;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.SUPABASE_URL;

    (MinioProvider as jest.Mock).mockImplementation(() => mockMinioProvider);
    (SupabaseProvider as jest.Mock).mockImplementation(() => mockSupabaseProvider);
    (AwsS3Provider as jest.Mock).mockImplementation(() => mockAwsS3Provider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        MinioProvider,
        SupabaseProvider,
        AwsS3Provider,
        ...getCommonTestProviders(),
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    minioProvider = module.get(MinioProvider) as jest.Mocked<MinioProvider>;
    supabaseProvider = module.get(SupabaseProvider) as jest.Mocked<SupabaseProvider>;
    awsS3Provider = module.get(AwsS3Provider) as jest.Mocked<AwsS3Provider>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("provider selection", () => {
    it("should use MINIO provider when STORAGE_PROVIDER=minio", () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();
      expect(service.getProviderType()).toBe("minio");
    });

    it("should use Supabase provider when STORAGE_PROVIDER=supabase", () => {
      process.env.STORAGE_PROVIDER = "supabase";
      service.onModuleInit();
      expect(service.getProviderType()).toBe("supabase");
    });

    it("should use AWS provider when STORAGE_PROVIDER=aws", () => {
      process.env.STORAGE_PROVIDER = "aws";
      service.onModuleInit();
      expect(service.getProviderType()).toBe("aws");
    });

    it("should detect AWS provider from credentials", () => {
      delete process.env.STORAGE_PROVIDER;
      process.env.AWS_ACCESS_KEY_ID = "test-key";
      process.env.AWS_SECRET_ACCESS_KEY = "test-secret";
      service.onModuleInit();
      expect(service.getProviderType()).toBe("aws");
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
    });

    it("should detect Supabase provider from credentials", () => {
      delete process.env.STORAGE_PROVIDER;
      process.env.SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_STORAGE_KEY = "test-key";
      service.onModuleInit();
      expect(service.getProviderType()).toBe("supabase");
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_STORAGE_KEY;
    });

    it("should default to MINIO when no provider specified", () => {
      delete process.env.STORAGE_PROVIDER;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.SUPABASE_URL;
      service.onModuleInit();
      expect(service.getProviderType()).toBe("minio");
    });
  });

  describe("upload", () => {
    it("should delegate upload to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      const mockUrl = "http://localhost:9000/vcecom/test-key";
      jest.spyOn(minioProvider, "upload").mockResolvedValue(mockUrl);

      const result = await service.upload("test-key", Buffer.from("test"), "image/jpeg");
      expect(result).toBe(mockUrl);
      expect(minioProvider.upload).toHaveBeenCalledWith("test-key", Buffer.from("test"), "image/jpeg");
    });
  });

  describe("delete", () => {
    it("should delegate delete to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      mockMinioProvider.delete.mockResolvedValue(undefined);

      await service.delete("test-key");
      expect(mockMinioProvider.delete).toHaveBeenCalledWith("test-key");
    });
  });

  describe("getUrl", () => {
    it("should delegate getUrl to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      const mockUrl = "http://localhost:9000/vcecom/test-key";
      mockMinioProvider.getUrl.mockResolvedValue(mockUrl);

      const result = await service.getUrl("test-key");
      expect(result).toBe(mockUrl);
      expect(mockMinioProvider.getUrl).toHaveBeenCalledWith("test-key");
    });
  });

  describe("getPresignedUrl", () => {
    it("should delegate getPresignedUrl to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      const mockUrl = "http://localhost:9000/vcecom/test-key?signature=abc123";
      mockMinioProvider.getPresignedUrl.mockResolvedValue(mockUrl);

      const result = await service.getPresignedUrl("test-key", 3600);
      expect(result).toBe(mockUrl);
      expect(mockMinioProvider.getPresignedUrl).toHaveBeenCalledWith("test-key", 3600);
    });
  });

  describe("exists", () => {
    it("should delegate exists to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      mockMinioProvider.exists.mockResolvedValue(true);

      const result = await service.exists("test-key");
      expect(result).toBe(true);
      expect(mockMinioProvider.exists).toHaveBeenCalledWith("test-key");
    });
  });

  describe("list", () => {
    it("should delegate list to selected provider", async () => {
      process.env.STORAGE_PROVIDER = "minio";
      service.onModuleInit();

      const mockFiles = ["file1.jpg", "file2.jpg"];
      mockMinioProvider.list.mockResolvedValue(mockFiles);

      const result = await service.list("prefix", 100);
      expect(result).toEqual(mockFiles);
      expect(mockMinioProvider.list).toHaveBeenCalledWith("prefix", 100);
    });
  });
});

