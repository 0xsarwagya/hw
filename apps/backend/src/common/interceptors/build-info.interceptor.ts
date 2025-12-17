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
  private readonly runningSince: string;

  constructor() {
    // Track when the server started
    this.runningSince = new Date().toISOString();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();

    // Set build info headers
    response.setHeader("x-vcecom-version", BUILD_INFO.version);
    response.setHeader("x-vcecom-environment", BUILD_INFO.buildEnv);
    response.setHeader("x-vcecom-commit-hash", BUILD_INFO.commitHash);
    response.setHeader("x-vcecom-build-date", BUILD_INFO.buildDate);
    response.setHeader("x-vcecom-running-since", this.runningSince);

    return next.handle();
  }
}
