import { ArchiveRestore, FolderTree, Plus } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { setCategoryArchived } from "@/features/accounts/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name,transaction_type,parent_category_id,is_archived").order("transaction_type").order("display_order");
  const parents = categories?.filter((category) => !category.parent_category_id) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Classify income and expenses</p>
        <h1 className="text-2xl font-semibold">Categories</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="size-4" />Add a category</CardTitle>
          <CardDescription>Use parent categories to keep related activity together in reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm parents={parents as { id: string; name: string; transaction_type: "income" | "expense" }[]} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderTree className="size-4" />Your categories</CardTitle>
          <CardDescription>Default categories are created for every MoneyLau workspace and can be archived when unused.</CardDescription>
        </CardHeader>
        <CardContent>
          {categories?.length ? (
            <div className="flex flex-col divide-y rounded-lg border">
              {categories.map((category) => (
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={category.id}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="font-medium">{category.parent_category_id ? "Subcategory: " : ""}{category.name}</span><Badge variant="outline">{category.transaction_type}</Badge><Badge variant={category.is_archived ? "outline" : "secondary"}>{category.is_archived ? "Archived" : "Active"}</Badge></div>
                  <form action={setCategoryArchived}>
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="archived" value={String(!category.is_archived)} />
                    <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{category.is_archived ? "Restore" : "Archive"}</Button>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <Empty><EmptyHeader><EmptyMedia variant="icon"><FolderTree /></EmptyMedia><EmptyTitle>No categories yet</EmptyTitle><EmptyDescription>Categories will appear here after your workspace is initialized.</EmptyDescription></EmptyHeader></Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
