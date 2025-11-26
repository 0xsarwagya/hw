import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { BUILD_INFO } from "../../build-info";

@Injectable()
export class BuildInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        response.header("x-vcecom-version", BUILD_INFO.version);
        response.header("x-vcecom-build-env", BUILD_INFO.buildEnv);
        response.header("x-vcecom-commit-hash", BUILD_INFO.commitHash);
        response.header("x-vcecom-build-date", BUILD_INFO.buildDate);
      }),
    );
  }
}
