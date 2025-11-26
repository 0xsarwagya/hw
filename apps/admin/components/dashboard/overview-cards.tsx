"use client";

import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/lib/api";

type Props = {
  stats: AdminStats | null;
  isLoading: boolean;
};

export function OverviewCards({ stats, isLoading }: Props) {
  const cards = [
    {
      title: "Total Revenue",
      value: stats?.totalRevenue ?? 0,
      description: "All time revenue",
      icon: DollarSign,
      formatter: (value: number) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value),
    },
    {
      title: "Monthly Revenue",
      value: stats?.monthlyRevenue ?? 0,
      description: "Current month",
      icon: DollarSign,
      formatter: (value: number) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value),
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders ?? 0,
      description: `${stats?.pendingOrders ?? 0} pending`,
      icon: ShoppingCart,
      formatter: (value: number) => value.toLocaleString(),
    },
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      description: `${stats?.activeProducts ?? 0} active`,
      icon: Package,
      formatter: (value: number) => value.toLocaleString(),
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? 0,
      description: "Registered users",
      icon: Users,
      formatter: (value: number) => value.toLocaleString(),
    },
    {
      title: "Average Order Value",
      value: stats?.averageOrderValue ?? 0,
      description: "Per order",
      icon: DollarSign,
      formatter: (value: number) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(value),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {card.formatter(card.value)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
