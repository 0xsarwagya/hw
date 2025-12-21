import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CustomerSupportDashboardResponseDto } from "./dto/dashboard-customer-support.dto";
import { OperationsDashboardResponseDto } from "./dto/dashboard-operations.dto";
import { PerformanceDashboardResponseDto } from "./dto/dashboard-performance.dto";
import { ProductMerchandisingDashboardResponseDto } from "./dto/dashboard-product-merchandising.dto";
import { DashboardService } from "./services/dashboard.service";

@ApiTags("admin")
@Controller("admin/dashboards")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
@Roles("admin")
export class AdminDashboardsController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("performance")
  @ApiOperation({
    summary: "Get Performance Dashboard data",
    description:
      "Returns business/executive dashboard metrics including revenue, AOV, profit, order volume, conversion rate, CAC, ROAS, refund rate, and trends",
  })
  @ApiResponse({
    status: 200,
    description: "Performance dashboard data",
    type: PerformanceDashboardResponseDto,
  })
  async getPerformanceDashboard(): Promise<PerformanceDashboardResponseDto> {
    return this.dashboardService.getPerformanceDashboard();
  }

  @Get("operations")
  @ApiOperation({
    summary: "Get Operations Dashboard data",
    description:
      "Returns fulfillment/logistics dashboard metrics including order status counts, delayed orders, RTO rate, inventory aging, out-of-stock alerts, and shipping metrics",
  })
  @ApiResponse({
    status: 200,
    description: "Operations dashboard data",
    type: OperationsDashboardResponseDto,
  })
  async getOperationsDashboard(): Promise<OperationsDashboardResponseDto> {
    return this.dashboardService.getOperationsDashboard();
  }

  @Get("customer-support")
  @ApiOperation({
    summary: "Get Customer & Support Dashboard data",
    description:
      "Returns customer experience and sentiment metrics including new vs returning customers, repeat purchase rate, CLV, support ticket metrics, return reasons, complaint trends, and review sentiment",
  })
  @ApiResponse({
    status: 200,
    description: "Customer & Support dashboard data",
    type: CustomerSupportDashboardResponseDto,
  })
  async getCustomerSupportDashboard(): Promise<CustomerSupportDashboardResponseDto> {
    return this.dashboardService.getCustomerSupportDashboard();
  }

  @Get("product-merchandising")
  @ApiOperation({
    summary: "Get Product & Merchandising Dashboard data",
    description:
      "Returns product performance metrics including best/worst selling products, category performance, variant performance, revenue per product, price elasticity, inventory turnover, and conversion funnel",
  })
  @ApiResponse({
    status: 200,
    description: "Product & Merchandising dashboard data",
    type: ProductMerchandisingDashboardResponseDto,
  })
  async getProductMerchandisingDashboard(): Promise<ProductMerchandisingDashboardResponseDto> {
    return this.dashboardService.getProductMerchandisingDashboard();
  }
}
