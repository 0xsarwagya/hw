import { Test, TestingModule } from "@nestjs/testing";
import { AdminModule } from "./admin.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

describe("AdminModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AdminModule],
    }).compile();
  });

  it("should be defined", () => {
    expect(module).toBeDefined();
  });

  it("should provide AdminController", () => {
    const controller = module.get<AdminController>(AdminController);
    expect(controller).toBeDefined();
  });

  it("should provide AdminService", () => {
    const service = module.get<AdminService>(AdminService);
    expect(service).toBeDefined();
  });

  it("should export AdminService", () => {
    const service = module.get<AdminService>(AdminService);
    expect(service).toBeDefined();
  });
});

