
> @vestcodes/vcecom@0.0.0 test /Users/sarwagya/Desktop/personal/vestcodes/ecommerce
> turbo run test

• Packages in scope: @vcecom/db, @vcecom/typescript-config, @vestcodes/vcecom-admin, @vestcodes/vcecom-backend, @vestcodes/vcecom-docs
• Running test in 5 packages
• Remote caching disabled
@vcecom/db:test: cache hit, replaying logs 4e502c3b90be9050
@vcecom/db:test: 
@vcecom/db:test: 
@vcecom/db:test: > @vcecom/db@0.0.0 test /Users/sarwagya/Desktop/personal/vestcodes/ecommerce/packages/db
@vcecom/db:test: > echo 'Skipping DB tests' && exit 0
@vcecom/db:test: 
@vcecom/db:test: Skipping DB tests
@vcecom/db:build: cache hit, replaying logs 4ff607cfc3f2f5a2
@vcecom/db:build: 
@vcecom/db:build: 
@vcecom/db:build: > @vcecom/db@0.0.0 build /Users/sarwagya/Desktop/personal/vestcodes/ecommerce/packages/db
@vcecom/db:build: > tsc
@vcecom/db:build: 
@vcecom/db:build: 
@vcecom/db:build: > @vcecom/db@0.0.0 postbuild /Users/sarwagya/Desktop/personal/vestcodes/ecommerce/packages/db
@vcecom/db:build: > pnpm db:seed || true
@vcecom/db:build: 
@vcecom/db:build: 
@vcecom/db:build: > @vcecom/db@0.0.0 db:seed /Users/sarwagya/Desktop/personal/vestcodes/ecommerce/packages/db
@vcecom/db:build: > node dist/seed.js
@vcecom/db:build: 
@vcecom/db:build: [dotenv@17.2.3] injecting env (25) from ../../.env [2m-- tip: ⚙️  enable debug logging with { debug: true }[0m
@vcecom/db:build: ✅ Users already exist, skipping seed
@vestcodes/vcecom-backend:test: cache miss, executing 76b692d51095e4b5
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: > @vestcodes/vcecom-backend@0.0.1 test /Users/sarwagya/Desktop/personal/vestcodes/ecommerce/apps/backend
@vestcodes/vcecom-backend:test: > node scripts/generate-build-info.js && jest
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: ✅ Generated build-info.ts
@vestcodes/vcecom-backend:test:    Version: 2025.12.20
@vestcodes/vcecom-backend:test:    Commit: f26418c
@vestcodes/vcecom-backend:test:    Build Date: 2025-12-20T21:14:07.831Z
@vestcodes/vcecom-backend:test: (node:58407) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: (node:58406) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: FAIL src/modules/orders/services/refunds.service.spec.ts
@vestcodes/vcecom-backend:test:   ● RefundsService › findByOrderId › should return refunds for an order
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › findByOrderId › should throw NotFoundException when order does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should create a refund successfully
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is zero
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is negative
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is below minimum
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when reason is empty
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw NotFoundException when order does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when refund amount exceeds limit
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should process refund successfully via Razorpay
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should throw NotFoundException when refund does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should throw BadRequestException when refund is not pending
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: (node:58410) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: FAIL src/modules/orders/__tests__/orders.service.guest-checkout.spec.ts
@vestcodes/vcecom-backend:test:   ● OrdersService - Guest Checkout › create - Guest Checkout › should throw error if required fields are missing for guest checkout
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       186 |     };
@vestcodes/vcecom-backend:test:       187 |
@vestcodes/vcecom-backend:test:     > 188 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       189 |       providers: [
@vestcodes/vcecom-backend:test:       190 |         OrdersService,
@vestcodes/vcecom-backend:test:       191 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/__tests__/orders.service.guest-checkout.spec.ts:188:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService - Guest Checkout › create - Guest Checkout › should throw error if sessionId is missing for guest checkout
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       186 |     };
@vestcodes/vcecom-backend:test:       187 |
@vestcodes/vcecom-backend:test:     > 188 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       189 |       providers: [
@vestcodes/vcecom-backend:test:       190 |         OrdersService,
@vestcodes/vcecom-backend:test:       191 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/__tests__/orders.service.guest-checkout.spec.ts:188:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: (node:58405) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: (node:58408) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: PASS src/modules/orders/services/order-notes.service.spec.ts
@vestcodes/vcecom-backend:test: (node:58409) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/shipping.controller.spec.ts
@vestcodes/vcecom-backend:test: FAIL src/modules/orders/orders.service.spec.ts
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should return existing order if already created (idempotent)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if checkout session not found
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if checkout metadata not found
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if state is not PAYMENT_CONFIRMED
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: (node:58413) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: PASS src/modules/admin/admin.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/interceptors/activity-logging.interceptor.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/admin-auth.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/orders/reconciliation.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/storage/storage.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/products/products.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/storage/storage.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundle-warmup.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundle-eligibility.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundles.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/discount.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/stores/checkout-store.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/orders/services/order-address.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/discounts/discounts.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/carts/carts.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/invoices/invoices.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/discounts/engine/discount-engine.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/discounts/discount-validation.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/pricing/__tests__/bundle-pricing.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/orders/services/order-payment.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/carts/__tests__/carts.service.bundle.spec.ts
@vestcodes/vcecom-backend:test: (node:58412) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: PASS src/modules/payments/payments.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/storage/services/image-compression.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/admin-sessions.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/customers/customers.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/auth/auth.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/admin-mfa.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundle-definition.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundle-sets.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/stores/inventory-store.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/redis-store.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/bundles/__tests__/bundle-set-items.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/nimbus-post.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/stores/idempotency-store.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/admin-activity.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/payments/razorpay-config.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/shipping-rules.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/logging/context-extractor.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/guards/jwt-auth.guard.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/stores/cart-store.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/admin-auth/guards/rate-limit.guard.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/nimbus-post-config.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/redis-store/services/inventory-recovery.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/health/health-logger.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/shiprocket-config.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/logging/context.middleware.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/address-autocomplete/address-autocomplete.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/app.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/customers/gstin-verification.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/services/shipments.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/health/health-tracing.controller.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/data/indian-states.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/gst.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/logging/__tests__/logging-format.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/logging/context.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/guards/roles.guard.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/pagination.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/validators/gstin.validator.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/pincode.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/modules/customers/addresses.service.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/address.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/search.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/filters/global-exception.filter.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/phone.utils.spec.ts
@vestcodes/vcecom-backend:test: PASS src/common/utils/gstin.utils.spec.ts
@vestcodes/vcecom-backend:test: (node:58411) Warning: `--localstorage-file` was provided without a valid path
@vestcodes/vcecom-backend:test: (Use `node --trace-warnings ...` to show where the warning was created)
@vestcodes/vcecom-backend:test: PASS src/modules/shipping/shiprocket.service.spec.ts
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: Summary of all failing tests
@vestcodes/vcecom-backend:test: FAIL modules/orders/services/refunds.service.spec.ts
@vestcodes/vcecom-backend:test:   ● RefundsService › findByOrderId › should return refunds for an order
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › findByOrderId › should throw NotFoundException when order does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should create a refund successfully
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is zero
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is negative
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when amount is below minimum
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when reason is empty
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw NotFoundException when order does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › create › should throw BadRequestException when refund amount exceeds limit
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should process refund successfully via Razorpay
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should throw NotFoundException when refund does not exist
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● RefundsService › processRefund › should throw BadRequestException when refund is not pending
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the RefundsService (PinoLogger, RazorpayConfigService, AppConfigService, OrderTimelineService, ?). Please make sure that the argument NotificationsService at index [4] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       124 |     };
@vestcodes/vcecom-backend:test:       125 |
@vestcodes/vcecom-backend:test:     > 126 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       127 |       providers: [
@vestcodes/vcecom-backend:test:       128 |         RefundsService,
@vestcodes/vcecom-backend:test:       129 |         {
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 4)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/services/refunds.service.spec.ts:126:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: FAIL modules/orders/__tests__/orders.service.guest-checkout.spec.ts
@vestcodes/vcecom-backend:test:   ● OrdersService - Guest Checkout › create - Guest Checkout › should throw error if required fields are missing for guest checkout
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       186 |     };
@vestcodes/vcecom-backend:test:       187 |
@vestcodes/vcecom-backend:test:     > 188 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       189 |       providers: [
@vestcodes/vcecom-backend:test:       190 |         OrdersService,
@vestcodes/vcecom-backend:test:       191 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/__tests__/orders.service.guest-checkout.spec.ts:188:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService - Guest Checkout › create - Guest Checkout › should throw error if sessionId is missing for guest checkout
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       186 |     };
@vestcodes/vcecom-backend:test:       187 |
@vestcodes/vcecom-backend:test:     > 188 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       189 |       providers: [
@vestcodes/vcecom-backend:test:       190 |         OrdersService,
@vestcodes/vcecom-backend:test:       191 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/__tests__/orders.service.guest-checkout.spec.ts:188:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: FAIL modules/orders/orders.service.spec.ts
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should return existing order if already created (idempotent)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if checkout session not found
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if checkout metadata not found
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:   ● OrdersService › finalizeOrderFromPayment › should throw error if state is not PAYMENT_CONFIRMED
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Nest can't resolve dependencies of the OrdersService (PinoLogger, ContextService, CartsService, CustomersService, AddressesService, DiscountsService, InventoryStore, CheckoutStore, DiscountSnapshotValidator, DiscountAuditService, DriftDetectorService, HotReloadWatcher, RulesetBundleService, DiscountProfiler, PricingHotReloadWatcher, PriceListService, CustomerGroupService, PricingSnapshotValidator, PricingAuditService, PricingDriftDetectorService, BundlePricingService, PaymentsService, ?, OrderValidationService, OrderPricingService, OrderStatusService, OrderGstService, OrderTimelineService). Please make sure that the argument NotificationsService at index [22] is available in the RootTestModule context.
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     Potential solutions:
@vestcodes/vcecom-backend:test:     - Is RootTestModule a valid NestJS module?
@vestcodes/vcecom-backend:test:     - If NotificationsService is a provider, is it part of the current RootTestModule?
@vestcodes/vcecom-backend:test:     - If NotificationsService is exported from a separate @Module, is that module imported within RootTestModule?
@vestcodes/vcecom-backend:test:       @Module({
@vestcodes/vcecom-backend:test:         imports: [ /* the Module containing NotificationsService */ ]
@vestcodes/vcecom-backend:test:       })
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:     For more common dependency resolution issues, see: https://docs.nestjs.com/faq/common-errors
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       262 |
@vestcodes/vcecom-backend:test:       263 |   beforeEach(async () => {
@vestcodes/vcecom-backend:test:     > 264 |     const module: TestingModule = await Test.createTestingModule({
@vestcodes/vcecom-backend:test:           |                                   ^
@vestcodes/vcecom-backend:test:       265 |       providers: [
@vestcodes/vcecom-backend:test:       266 |         OrdersService,
@vestcodes/vcecom-backend:test:       267 |         CartsService,
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test:       at TestingInjector.lookupComponentInParentModules (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:286:19)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveComponentWrapper (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-injector.js:19:45)
@vestcodes/vcecom-backend:test:       at resolveParam (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:140:38)
@vestcodes/vcecom-backend:test:           at async Promise.all (index 22)
@vestcodes/vcecom-backend:test:       at TestingInjector.resolveConstructorParams (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:169:27)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadInstance (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:75:13)
@vestcodes/vcecom-backend:test:       at TestingInjector.loadProvider (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/injector.js:103:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:56:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 3)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfProviders (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:55:9)
@vestcodes/vcecom-backend:test:       at ../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:40:13
@vestcodes/vcecom-backend:test:           at async Promise.all (index 1)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstances (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:39:9)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+core@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_refl_imwmiucpnybk4xpovusvj6yaly/node_modules/@nestjs/core/injector/instance-loader.js:22:13)
@vestcodes/vcecom-backend:test:       at TestingInstanceLoader.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-instance-loader.js:9:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.createInstancesOfDependencies (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:118:9)
@vestcodes/vcecom-backend:test:       at TestingModuleBuilder.compile (../../../node_modules/.pnpm/@nestjs+testing@11.1.9_@nestjs+common@11.1.9_class-transformer@0.5.1_class-validator@0.14.3_r_gqwpxnrc7i73gs3orhkqir76xi/node_modules/@nestjs/testing/testing-module.builder.js:74:9)
@vestcodes/vcecom-backend:test:       at Object.<anonymous> (modules/orders/orders.service.spec.ts:264:35)
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: 
@vestcodes/vcecom-backend:test: Test Suites: 3 failed, 3 skipped, 68 passed, 71 of 74 total
@vestcodes/vcecom-backend:test: Tests:       18 failed, 109 skipped, 911 passed, 1038 total
@vestcodes/vcecom-backend:test: Snapshots:   0 total
@vestcodes/vcecom-backend:test: Time:        3.082 s
@vestcodes/vcecom-backend:test: Ran all test suites.
@vestcodes/vcecom-backend:test:  ELIFECYCLE  Test failed. See above for more details.

 Tasks:    2 successful, 3 total
Cached:    2 cached, 3 total
  Time:    3.925s 
Failed:    @vestcodes/vcecom-backend#test

 ELIFECYCLE  Test failed. See above for more details.
