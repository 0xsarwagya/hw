import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsString } from "class-validator";

class RazorpayPaymentEntity {
  @ApiProperty()
  id: string;
  @ApiProperty()
  entity: string;
  @ApiProperty()
  amount: number;
  @ApiProperty()
  currency: string;
  @ApiProperty()
  status: string;
  @ApiProperty()
  order_id: string;
  @ApiProperty({ nullable: true })
  invoice_id: string | null;
  @ApiProperty()
  international: boolean;
  @ApiProperty()
  method: string;
  @ApiProperty()
  amount_refunded: number;
  @ApiProperty({ nullable: true })
  refund_status: string | null;
  @ApiProperty()
  captured: boolean;
  @ApiProperty({ nullable: true })
  description: string | null;
  @ApiProperty({ nullable: true })
  card_id: string | null;
  @ApiProperty({ nullable: true })
  bank: string | null;
  @ApiProperty({ nullable: true })
  wallet: string | null;
  @ApiProperty({ nullable: true })
  vpa: string | null;
  @ApiProperty()
  email: string;
  @ApiProperty()
  contact: string;
  @ApiProperty()
  notes: Record<string, string>;
  @ApiProperty()
  fee: number;
  @ApiProperty()
  tax: number;
  @ApiProperty({ nullable: true })
  error_code: string | null;
  @ApiProperty({ nullable: true })
  error_description: string | null;
  @ApiProperty({ nullable: true })
  error_source: string | null;
  @ApiProperty({ nullable: true })
  error_step: string | null;
  @ApiProperty({ nullable: true })
  error_reason: string | null;
  @ApiProperty()
  created_at: number;
}

class RazorpayOrderEntity {
  @ApiProperty()
  id: string;
  @ApiProperty()
  entity: string;
  @ApiProperty()
  amount: number;
  @ApiProperty()
  amount_paid: number;
  @ApiProperty()
  amount_due: number;
  @ApiProperty()
  currency: string;
  @ApiProperty()
  receipt: string;
  @ApiProperty({ nullable: true })
  offer_id: string | null;
  @ApiProperty()
  status: string;
  @ApiProperty()
  attempts: number;
  @ApiProperty()
  notes: Record<string, string>;
  @ApiProperty()
  created_at: number;
}

class RazorpayWebhookPayload {
  @ApiProperty({ type: RazorpayPaymentEntity, required: false })
  payment?: { entity: RazorpayPaymentEntity };

  @ApiProperty({ type: RazorpayOrderEntity, required: false })
  order?: { entity: RazorpayOrderEntity };
}

export class RazorpayWebhookEventDto {
  @ApiProperty({ example: "event" })
  @IsString()
  entity: string;

  @ApiProperty({ example: "acc_xxxxxxxxxxxxxx" })
  @IsString()
  account_id: string;

  @ApiProperty({ example: "payment.captured" })
  @IsString()
  event: string;

  @ApiProperty({ example: ["payment"] })
  contains: string[];

  @ApiProperty({ type: RazorpayWebhookPayload })
  @IsObject()
  payload: RazorpayWebhookPayload;

  @ApiProperty({ example: 1678886400 })
  created_at: number;
}
