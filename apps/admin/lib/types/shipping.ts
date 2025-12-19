/**
 * Shipping-related TypeScript types
 * Mapped from backend DTOs
 */

export type ShipmentStatus =
  | "pending"
  | "label_generated"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned"
  | "cancelled";

export interface ShipmentTracking {
  id: string;
  provider: string;
  trackingNumber: string | null;
  status: ShipmentStatus;
  labelUrl: string | null;
  awbNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  shippingProvider: string | null;
  shipments: ShipmentTracking[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiprocketStatus {
  initialized: boolean;
  message: string;
}

export interface GenerateLabelRequest {
  orderId: string;
  courierId: number;
  pickupPincode?: string;
  weight?: number;
}

export interface GenerateLabelResponse {
  shipmentId: number;
  awbNumber: string;
  trackingNumber: string;
  labelUrl: string;
  status: string;
  message: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string | null;
  description: string | null;
}

export interface TrackShipmentResponse {
  awbNumber: string;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDeliveryDate: string | null;
  events: TrackingEvent[];
  message: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  provider: string;
  trackingNumber: string | null;
  awbNumber: string | null;
  status: ShipmentStatus;
  labelUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
