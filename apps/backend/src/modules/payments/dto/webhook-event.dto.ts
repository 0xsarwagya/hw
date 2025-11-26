import { ApiProperty } from "@nestjs/swagger";

export class RazorpayWebhookEventDto {
  @ApiProperty({
    description: "Event entity type",
    example: "event",
  })
  entity: string;

  @ApiProperty({
    description: "Event account ID",
    example: "acc_MNOPQRSTUVWXYZ",
  })
  account_id: string;

  @ApiProperty({
    description: "Event name",
    example: "payment.captured",
  })
  event: string;

  @ApiProperty({
    description: "Event contains",
    example: ["payment", "order"],
  })
  contains: string[];

  @ApiProperty({
    description: "Event payload",
  })
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string | null;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status: string | null;
        captured: boolean;
        description: string | null;
        card_id: string | null;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        notes: Record<string, string>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        error_source: string | null;
        error_step: string | null;
        error_reason: string | null;
        acquirer_data: Record<string, unknown>;
        created_at: number;
      };
    };
    order?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        amount_paid: number;
        amount_due: number;
        currency: string;
        receipt: string | null;
        offer_id: string | null;
        status: string;
        attempts: number;
        notes: Record<string, string>;
        created_at: number;
      };
    };
  };

  @ApiProperty({
    description: "Event created timestamp",
    example: 1234567890,
  })
  created_at: number;
}
