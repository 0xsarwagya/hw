import { Controller, Get } from "@nestjs/common";
import { BUILD_INFO } from "./build-info";
import { Public } from "./common/decorators/public.decorator";

@Controller()
export class AppController {
  private readonly runningSince = new Date().toISOString();

  @Public()
  @Get()
  getStatus() {
    return {
      ...BUILD_INFO,
      runningSince: this.runningSince,
    };
  }
}
