import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it("should return build info JSON", () => {
      const result = appController.getStatus();
      expect(result).toHaveProperty("ok", true);
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("buildEnv");
      expect(result).toHaveProperty("commitHash");
      expect(result).toHaveProperty("buildDate");
      expect(result).toHaveProperty("runningSince");
    });
  });
});
