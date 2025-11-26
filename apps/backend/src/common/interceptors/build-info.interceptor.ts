import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { BUILD_INFO } from "../../build-info";

@Injectable()
export class BuildInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    // Set build info headers
    response.setHeader("x-vcecom-version", BUILD_INFO.version);
    response.setHeader("x-vcecom-build-env", BUILD_INFO.buildEnv);
    response.setHeader("x-vcecom-commit-hash", BUILD_INFO.commitHash);
    response.setHeader("x-vcecom-build-date", BUILD_INFO.buildDate);

    return next.handle();
  }
}
