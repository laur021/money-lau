"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createCategory } from "@/features/accounts/actions";

type ParentCategory = { id: string; name: string; transaction_type: "income" | "expense" };

export function CategoryForm({ parents }: { parents: ParentCategory[] }) {
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const compatibleParents = parents.filter((category) => category.transaction_type === transactionType);

  return (
    <form action={createCategory}>
      <FieldGroup className="grid gap-4 md:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="category-name">Category name</FieldLabel>
          <Input id="category-name" name="name" placeholder="Groceries" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="category-type">Type</FieldLabel>
          <NativeSelect className="w-full" id="category-type" name="transactionType" value={transactionType} onChange={(event) => setTransactionType(event.target.value as "income" | "expense")}>
            <NativeSelectOption value="expense">Expense</NativeSelectOption>
            <NativeSelectOption value="income">Income</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="parent-category">Parent category</FieldLabel>
          <NativeSelect className="w-full" id="parent-category" key={transactionType} name="parentCategoryId" defaultValue="">
            <NativeSelectOption value="">No parent</NativeSelectOption>
            {compatibleParents.map((category) => <NativeSelectOption key={category.id} value={category.id}>{category.name}</NativeSelectOption>)}
          </NativeSelect>
        </Field>
        <Button className="w-fit" type="submit"><Plus data-icon="inline-start" />Add category</Button>
      </FieldGroup>
    </form>
  );
}
