"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createCategory, updateCategory } from "@/features/accounts/actions";

export type CategoryRecord = {
  id: string;
  name: string;
  transaction_type: "income" | "expense";
  parent_category_id: string | null;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  is_archived: boolean;
  display_order: number;
};

type ParentCategory = Pick<CategoryRecord, "id" | "name" | "transaction_type">;

export function CategoryForm({
  category,
  parents,
}: {
  category?: CategoryRecord;
  parents: ParentCategory[];
}) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    category?.transaction_type ?? "expense",
  );
  const matchingParents = parents.filter(
    (parent) => parent.transaction_type === transactionType && parent.id !== category?.id,
  );
  const prefix = category ? `category-${category.id}` : "new-category";

  return (
    <form action={category ? updateCategory : createCategory}>
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${prefix}-name`}>Category name</FieldLabel>
          <Input defaultValue={category?.name} id={`${prefix}-name`} name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-type`}>Type</FieldLabel>
          <NativeSelect
            className="w-full"
            id={`${prefix}-type`}
            name="transactionType"
            onChange={(event) => setTransactionType(event.target.value as "income" | "expense")}
            value={transactionType}
          >
            <NativeSelectOption value="expense">Expense</NativeSelectOption>
            <NativeSelectOption value="income">Income</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-parent`}>Parent category</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={category?.parent_category_id ?? ""}
            id={`${prefix}-parent`}
            name="parentCategoryId"
          >
            <NativeSelectOption value="">None</NativeSelectOption>
            {matchingParents.map((parent) => (
              <NativeSelectOption key={parent.id} value={parent.id}>{parent.name}</NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>Only parent categories with the same transaction type are available.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-icon`}>Icon</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={category?.icon ?? "tag"}
            id={`${prefix}-icon`}
            name="icon"
          >
            <NativeSelectOption value="tag">Tag</NativeSelectOption>
            <NativeSelectOption value="utensils">Food</NativeSelectOption>
            <NativeSelectOption value="car">Transport</NativeSelectOption>
            <NativeSelectOption value="house">Housing</NativeSelectOption>
            <NativeSelectOption value="heart-pulse">Health</NativeSelectOption>
            <NativeSelectOption value="briefcase">Income</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${prefix}-color`}>Display color</FieldLabel>
          <NativeSelect
            className="w-full"
            defaultValue={category?.color ?? "blue"}
            id={`${prefix}-color`}
            name="color"
          >
            {['blue', 'cyan', 'green', 'amber', 'rose', 'violet'].map((color) => (
              <NativeSelectOption key={color} value={color}>{color}</NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <input name="displayOrder" type="hidden" value={category?.display_order ?? 0} />
        <Button className="w-fit" type="submit">
          {category ? <Pencil data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {category ? "Save category" : "Add category"}
        </Button>
      </FieldGroup>
    </form>
  );
}

export function CategoryEditDialog({
  category,
  parents,
}: {
  category: CategoryRecord;
  parents: ParentCategory[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil data-icon="inline-start" />Edit</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Historical transactions keep their category when it is archived.</DialogDescription>
        </DialogHeader>
        <CategoryForm category={category} parents={parents} />
      </DialogContent>
    </Dialog>
  );
}
