"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BulkAdjustmentItem } from "@/lib/types/inventory";

interface BulkAdjustEditorProps {
  items: BulkAdjustmentItem[];
  onItemsChange: (items: BulkAdjustmentItem[]) => void;
  variantsIndex?: { variantId: string; sku: string; productTitle: string }[];
}

/**
 * Inline table editor for bulk adjustments before submission
 */
export function BulkAdjustEditor({
  items,
  onItemsChange,
  variantsIndex = [],
}: BulkAdjustEditorProps) {
  const addRow = () => {
    onItemsChange([
      ...items,
      {
        sku: "",
        type: "increase",
        quantity: 1,
        reason: "manual",
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof BulkAdjustmentItem,
    value: unknown,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const getSkuSuggestions = (query: string) => {
    if (!query) return variantsIndex.slice(0, 10);
    return variantsIndex
      .filter((v) => v.sku.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Adjustments</h3>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" />
          Add Row
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No adjustments added. Click "Add Row" to start.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={`${item.sku}-${index}`}>
                  <TableCell>
                    <Input
                      value={item.sku}
                      onChange={(e) => updateItem(index, "sku", e.target.value)}
                      placeholder="Enter SKU"
                      list={`sku-list-${index}`}
                    />
                    <datalist id={`sku-list-${index}`}>
                      {getSkuSuggestions(item.sku).map((variant) => (
                        <option key={variant.variantId} value={variant.sku} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.type}
                      onValueChange={(value) =>
                        updateItem(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Increase</SelectItem>
                        <SelectItem value="decrease">Decrease</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          parseInt(e.target.value, 10) || 0,
                        )
                      }
                      min={1}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.reason}
                      onValueChange={(value) =>
                        updateItem(index, "reason", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="correction">Correction</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                        <SelectItem value="giveaway">Giveaway</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.note || ""}
                      onChange={(e) =>
                        updateItem(index, "note", e.target.value)
                      }
                      placeholder="Optional note"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
