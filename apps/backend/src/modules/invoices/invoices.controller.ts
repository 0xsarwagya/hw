import * as fs from "node:fs";
import * as path from "node:path";
import { Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { InvoiceResponseDto } from "./dto/invoice-response.dto";
import { InvoicesService } from "./invoices.service";

@ApiTags("invoices")
@Controller("invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post("orders/:orderId/generate")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Generate invoice for an order",
    description:
      "Generates a GST-compliant tax invoice PDF for the specified order. " +
      "Invoice can only be generated for confirmed or delivered orders.",
  })
  async generateInvoice(
    @Param("orderId") orderId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.generateInvoice(orderId);
  }

  @Get(":invoiceId")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Get invoice details",
    description: "Retrieves invoice information by invoice ID",
  })
  async getInvoice(
    @Param("invoiceId") invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(invoiceId);
  }

  @Get("orders/:orderId")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Get invoice by order ID",
    description: "Retrieves invoice information for a specific order",
  })
  async getInvoiceByOrderId(
    @Param("orderId") orderId: string,
  ): Promise<InvoiceResponseDto | null> {
    return this.invoicesService.findByOrderId(orderId);
  }

  @Get(":invoiceId/download")
  @Roles("admin", "customer")
  @ApiOperation({
    summary: "Download invoice PDF",
    description: "Downloads the invoice PDF file",
  })
  async downloadInvoice(
    @Param("invoiceId") invoiceId: string,
    @Res() res: Response,
  ): Promise<void> {
    const pdfPath = await this.invoicesService.getInvoicePdfPath(invoiceId);

    if (!fs.existsSync(pdfPath)) {
      res.status(404).json({ message: "Invoice PDF not found" });
      return;
    }

    const fileName = path.basename(pdfPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  }
}
