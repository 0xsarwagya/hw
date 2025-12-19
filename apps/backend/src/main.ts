// Load .env file FIRST before any other imports
import { resolve } from "node:path";
import { config } from "dotenv";

// Only load from root .env (when compiled, __dirname is apps/backend/dist)
// 3 levels up: dist -> backend -> apps -> ecommerce (root)
const rootEnvPath = resolve(__dirname, "../../../.env");
config({ path: rootEnvPath });

// Also try loading from apps/backend/.env as fallback
const _envResult = config({ path: resolve(__dirname, "../.env") });

// Initialize OpenTelemetry BEFORE any other imports
import { initializeTracing } from "./common/tracing/tracing.config";

let tracingSdk: ReturnType<typeof initializeTracing>;
try {
  tracingSdk = initializeTracing();
} catch (error) {
  console.error("[Tracing Init Error]", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  // Continue without tracing if initialization fails
  tracingSdk = null;
}

// Now import everything else after .env is loaded
import { ExecutionContext } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import {
  CORS_PREFLIGHT_SUCCESS_STATUS,
  SERVER_HEADERS_TIMEOUT_MS,
  SERVER_KEEP_ALIVE_TIMEOUT_MS,
  SERVER_TIMEOUT_MS,
} from "./common/constants";
import { IS_PUBLIC_KEY } from "./common/decorators/public.decorator";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RateLimitGuard } from "./common/guards/rate-limit.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { BuildInfoInterceptor } from "./common/interceptors/build-info.interceptor";
import { RateLimitInterceptor } from "./common/interceptors/rate-limit.interceptor";
import { ContextService } from "./common/logging/context.service";
import { createPinoConfig } from "./common/logging/pino.config";

// Setup unhandled rejection and exception handlers
// These will use Pino logger once the app is bootstrapped
// For now, we use console as fallback since logger isn't available yet
process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("[Unhandled Rejection]", { promise, reason });
    if (reason instanceof Error) {
      console.error("[Unhandled Rejection Stack]", reason.stack);
    }
    process.exit(1);
  },
);

process.on("uncaughtException", (error: Error) => {
  console.error("[Uncaught Exception] Message:", error.message);
  console.error("[Uncaught Exception] Stack:", error.stack);
  process.exit(1);
});

async function bootstrap() {
  // Create a root logger instance for startup logging
  const rootLogger = createPinoConfig();

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
    logger: false, // Disable NestJS default logger, use only Pino
  });

  const reflector = app.get(Reflector);

  // Enable CORS
  // Support both storefront and admin frontends
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const adminUrl = process.env.ADMIN_URL || "http://localhost:3002";
  const allowedOrigins = [...frontendUrl.split(","), ...adminUrl.split(",")];

  // Enable cookie parser
  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: CORS_PREFLIGHT_SUCCESS_STATUS,
  });

  // Enable validation globally
  app.useGlobalPipes(
    new (await import("@nestjs/common")).ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Create custom JWT guard that respects @Public() decorator
  const jwtGuard = new JwtAuthGuard();
  const rolesGuard = new RolesGuard(reflector);

  // Override JWT guard to skip public routes
  const originalCanActivate = jwtGuard.canActivate.bind(jwtGuard);
  jwtGuard.canActivate = async (context: ExecutionContext) => {
    const isPublic = reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) as boolean | undefined;
    if (isPublic) {
      return true;
    }
    return originalCanActivate(context);
  };

  // Get rate limit guard and interceptor
  // Note: These are retrieved from the app container after NestFactory.create()
  // which ensures all modules are initialized
  let rateLimitGuard: RateLimitGuard;
  let rateLimitInterceptor: RateLimitInterceptor;
  try {
    rateLimitGuard = app.get(RateLimitGuard, { strict: false });
    rateLimitInterceptor = app.get(RateLimitInterceptor, { strict: false });
    if (!rateLimitGuard || !rateLimitInterceptor) {
      rootLogger.warn(
        "Rate limiting components not found, continuing without rate limiting",
      );
      // Create no-op implementations
      rateLimitGuard = {
        canActivate: () => Promise.resolve(true),
      } as unknown as RateLimitGuard;
      rateLimitInterceptor = {
        intercept: (context, next) => next.handle(),
      } as unknown as RateLimitInterceptor;
    }
  } catch (error) {
    rootLogger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to initialize rate limiting, continuing without it",
    );
    // Create no-op implementations
    rateLimitGuard = {
      canActivate: () => Promise.resolve(true),
    } as unknown as RateLimitGuard;
    rateLimitInterceptor = {
      intercept: (context, next) => next.handle(),
    } as unknown as RateLimitInterceptor;
  }

  // Apply guards globally
  app.useGlobalGuards(jwtGuard, rolesGuard, rateLimitGuard);

  // Apply interceptors globally
  app.useGlobalInterceptors(new BuildInfoInterceptor(), rateLimitInterceptor);

  // Apply global exception filter
  const contextService = app.get(ContextService);
  app.useGlobalFilters(new GlobalExceptionFilter(contextService));

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle("VCEcom API")
    .setDescription(
      "API documentation for VCEcom - A lightweight ecommerce backend built with NestJS",
    )
    .setVersion("0.0.1")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("auth", "Authentication endpoints")
    .addTag("categories", "Category management endpoints")
    .addTag("products", "Product management endpoints")
    .addTag("product-variants", "Product variant management endpoints")
    .addTag("customers", "Customer management endpoints")
    .addTag("carts", "Shopping cart endpoints")
    .addTag("orders", "Order management endpoints")
    .addTag("payments", "Payment processing endpoints")
    .addTag("shipping", "Shipping integration endpoints")
    .addTag("admin", "Admin dashboard endpoints")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3001;
  const server = await app.listen(port);

  // Set server timeout to prevent hanging requests
  // This ensures requests are closed after the configured timeout period
  server.timeout = SERVER_TIMEOUT_MS;
  server.keepAliveTimeout = SERVER_KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = SERVER_HEADERS_TIMEOUT_MS;

  rootLogger.info({ port }, "Server started successfully");

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    rootLogger.info(
      { signal },
      "Received shutdown signal, starting graceful shutdown",
    );

    try {
      // Close HTTP server first to stop accepting new requests
      server.close(() => {
        rootLogger.info({ signal }, "HTTP server closed");
      });

      // Shutdown tracing
      if (tracingSdk) {
        await tracingSdk.shutdown();
        rootLogger.info({ signal }, "Tracing SDK shut down");
      }

      // Close NestJS application (this triggers OnApplicationShutdown hooks)
      // Database cleanup will happen via DatabaseService.onApplicationShutdown
      await app.close();
      rootLogger.info({ signal }, "Application closed successfully");
    } catch (error) {
      rootLogger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          signal,
        },
        "Error during shutdown",
      );
      process.exit(1);
    }
  };

  // Handle SIGTERM (used by process managers like PM2, Docker, Kubernetes)
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("[Bootstrap Error]", error);
  process.exit(1);
});
