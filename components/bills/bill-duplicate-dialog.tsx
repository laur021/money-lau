"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { duplicateBillItem } from "@/features/bills/actions";
import type { BillItem } from "@/features/bills/types";
import { addMonths } from "@/lib/calculations/bills";

export function BillDuplicateDialog({ item }: { item: BillItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label={`Duplicate ${item.name}`} size="icon-sm" variant="ghost">
          <Copy />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate bill</DialogTitle>
          <DialogDescription>
            The copy starts unpaid and keeps this bill&apos;s category, account, amount, note, and relative coverage month.
          </DialogDescription>
        </DialogHeader>
        <form action={duplicateBillItem} className="flex flex-col gap-5">
          <input name="sourceBillItemId" type="hidden" value={item.id} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`bill-duplicate-name-${item.id}`}>Bill name</FieldLabel>
              <Input defaultValue={item.name} id={`bill-duplicate-name-${item.id}`} name="name" required />
            </Field>
            <Field>
              <FieldLabel htmlFor={`bill-duplicate-month-${item.id}`}>Planner month</FieldLabel>
              <Input
                defaultValue={addMonths(item.plannerMonth.slice(0, 7), 1)}
                id={`bill-duplicate-month-${item.id}`}
                name="plannerMonth"
                required
                type="month"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit">
              <Copy data-icon="inline-start" />
              Duplicate bill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
