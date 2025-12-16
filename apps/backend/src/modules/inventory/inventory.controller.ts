import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { InventoryMetricsDto } from "./dto/inventory-metrics.dto";
import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("metrics")
  @ApiOperation({
    summary: "Get inventory health metrics",
    description:
      "Returns inventory health metrics including available, reserved, reserved ratio, expired reservations count, and failed reservations count.",
  })
  @ApiResponse({
    status: 200,
    description: "Inventory metrics retrieved successfully",
    type: InventoryMetricsDto,
  })
  async getMetrics(): Promise<InventoryMetricsDto> {
    return this.inventoryService.getMetrics();
  }
}
