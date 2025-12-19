"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CollectionRule } from "@/lib/types/collections";

interface CollectionRuleBuilderProps {
  rules: CollectionRule[];
  onRulesChange: (rules: CollectionRule[]) => void;
}

const FIELD_OPTIONS = [
  { value: "price", label: "Price" },
  { value: "title", label: "Title" },
  { value: "tags", label: "Tags" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" },
  { value: "inventory", label: "Inventory" },
] as const;

const OPERATOR_OPTIONS = {
  price: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "less_than", label: "Less than" },
    { value: "greater_than", label: "Greater than" },
  ],
  title: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "contains", label: "Contains" },
  ],
  tags: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
  ],
  category: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
  ],
  status: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
  ],
  inventory: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not equals" },
    { value: "less_than", label: "Less than" },
    { value: "greater_than", label: "Greater than" },
  ],
} as const;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

export function CollectionRuleBuilder({
  rules,
  onRulesChange,
}: CollectionRuleBuilderProps) {
  const addRule = () => {
    onRulesChange([
      ...rules,
      {
        field: "price",
        operator: "equals",
        value: "",
      },
    ]);
  };

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<CollectionRule>) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], ...updates };
    // Reset value if field changed
    if (updates.field && updates.field !== rules[index].field) {
      updated[index].value = "";
    }
    onRulesChange(updated);
  };

  const getValueInput = (rule: CollectionRule, index: number) => {
    const field = rule.field;

    if (field === "price" || field === "inventory") {
      return (
        <Input
          type="number"
          placeholder="Enter number"
          value={rule.value || ""}
          onChange={(e) =>
            updateRule(index, {
              value: e.target.value ? Number(e.target.value) : "",
            })
          }
        />
      );
    }

    if (field === "status") {
      return (
        <Select
          value={String(rule.value || "")}
          onValueChange={(value) => updateRule(index, { value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For title, tags, category - string input
    return (
      <Input
        type="text"
        placeholder={`Enter ${field}`}
        value={String(rule.value || "")}
        onChange={(e) => updateRule(index, { value: e.target.value })}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Collection Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define rules to automatically include products in this collection
          </p>
        </div>
        <Button type="button" onClick={addRule} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-4">
            No rules defined. Add a rule to automatically include products.
          </p>
          <Button type="button" onClick={addRule} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add First Rule
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={`rule-${rule.field}-${rule.operator}-${index}`}
              className="flex gap-3 items-start p-4 border rounded-lg bg-background"
            >
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <Label
                    htmlFor={`field-select-${index}`}
                    className="text-xs font-medium text-muted-foreground mb-1 block"
                  >
                    Field
                  </Label>
                  <Select
                    value={rule.field}
                    onValueChange={(value) =>
                      updateRule(index, {
                        field: value as CollectionRule["field"],
                        operator: OPERATOR_OPTIONS[
                          value as keyof typeof OPERATOR_OPTIONS
                        ][0].value as CollectionRule["operator"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor={`operator-${index}`}
                    className="text-xs font-medium text-muted-foreground mb-1 block"
                  >
                    Operator
                  </Label>
                  <Select
                    value={rule.operator}
                    onValueChange={(value) =>
                      updateRule(index, {
                        operator: value as CollectionRule["operator"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS[rule.field].map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor={`value-${index}`}
                    className="text-xs font-medium text-muted-foreground mb-1 block"
                  >
                    Value
                  </Label>
                  {getValueInput(rule, index)}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRule(index)}
                className="mt-6"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
