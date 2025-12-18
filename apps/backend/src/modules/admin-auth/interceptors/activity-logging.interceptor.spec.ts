import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { of, throwError } from "rxjs";
import { ActivityLoggingInterceptor } from "./activity-logging.interceptor";
import { AdminActivityService } from "../admin-activity.service";
import { getCommonTestProviders } from "../../../common/testing/test-helpers";
import { LOG_ACTIVITY_KEY } from "../decorators/log-activity.decorator";

describe("ActivityLoggingInterceptor", () => {
  let interceptor: ActivityLoggingInterceptor;
  let activityService: jest.Mocked<AdminActivityService>;
  let reflector: Reflector;

  beforeEach(async () => {
    const mockActivityService = {
      logActivity: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLoggingInterceptor,
        Reflector,
        {
          provide: AdminActivityService,
          useValue: mockActivityService,
        },
        ...getCommonTestProviders(),
      ],
    }).compile();

    interceptor = module.get<ActivityLoggingInterceptor>(
      ActivityLoggingInterceptor,
    );
    activityService = module.get(AdminActivityService);
    reflector = module.get(Reflector);
    jest.clearAllMocks();
  });

  describe("intercept", () => {
    it("should skip logging if no metadata", () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "admin-1", role: "admin" },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue(undefined);

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler);

      expect(activityService.logActivity).not.toHaveBeenCalled();
    });

    it("should skip logging if user not authenticated", () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: null,
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "product.create",
      });

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler);

      expect(activityService.logActivity).not.toHaveBeenCalled();
    });

    it("should skip logging if user is not admin", () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "user-1", role: "customer" },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "product.create",
      });

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler);

      expect(activityService.logActivity).not.toHaveBeenCalled();
    });

    it("should log activity for admin user", (done) => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "admin-1", role: "admin" },
            params: { id: "product-123" },
            body: { title: "Test Product" },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "product.create",
        entityId: "id",
      });

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({ success: true })),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(activityService.logActivity).toHaveBeenCalledWith({
            adminId: "admin-1",
            action: "product.create",
            entityId: "product-123",
            metadata: { title: "Test Product" },
          });
          done();
        },
      });
    });

    it("should filter sensitive fields from metadata", (done) => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "admin-1", role: "admin" },
            body: {
              title: "Test Product",
              password: "secret123",
              passwordHash: "hash123",
              token: "token123",
              secret: "secret123",
            },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "product.create",
      });

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({ success: true })),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(activityService.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: {
                title: "Test Product",
              },
            }),
          );
          done();
        },
      });
    });

    it("should log error activity when request fails", (done) => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "admin-1", role: "admin" },
            params: { id: "product-123" },
            body: { title: "Test Product" },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "product.update",
        entityId: "id",
      });

      const error = new Error("Update failed");
      const mockHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        error: () => {
          expect(activityService.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              adminId: "admin-1",
              action: "product.update",
              entityId: "product-123",
              metadata: expect.objectContaining({
                error: "Update failed",
                errorType: "Error",
              }),
            }),
          );
          done();
        },
      });
    });

    it("should extract entityId from query params", (done) => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { id: "admin-1", role: "admin" },
            query: { reviewId: "review-123" },
          }),
        }),
        getHandler: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, "get").mockReturnValue({
        action: "review.approve",
        entityId: "reviewId",
      });

      const mockHandler = {
        handle: jest.fn().mockReturnValue(of({ success: true })),
      } as unknown as CallHandler;

      interceptor.intercept(mockContext, mockHandler).subscribe({
        next: () => {
          expect(activityService.logActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              entityId: "review-123",
            }),
          );
          done();
        },
      });
    });
  });
});

