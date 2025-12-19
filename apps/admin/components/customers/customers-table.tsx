"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/lib/types/customers";
import { DateTime } from "../orders/date-time";

interface CustomersTableProps {
  customers: Customer[];
}

/**
 * Table component for displaying customers list
 */
export function CustomersTable({ customers }: CustomersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>GSTIN</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CustomerTableRowProps {
  customer: Customer;
}

/**
 * Single row component for customers table
 */
function CustomerTableRow({ customer }: CustomerTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.phone}</TableCell>
      <TableCell>{customer.gstin || "-"}</TableCell>
      <TableCell>
        <DateTime date={customer.createdAt} />
      </TableCell>
    </TableRow>
  );
}
