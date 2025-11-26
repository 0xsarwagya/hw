import { ExecutionContext } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { IS_PUBLIC_KEY } from "./common/decorators/public.decorator";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  // Apply JWT guard globally, but allow public routes
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // Override JWT guard to skip public routes
  const jwtGuard = app.get(JwtAuthGuard);
  const originalCanActivate = jwtGuard.canActivate.bind(jwtGuard);
  jwtGuard.canActivate = async (context: ExecutionContext) => {
    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return originalCanActivate(context);
  };

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
