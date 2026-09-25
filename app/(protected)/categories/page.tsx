import {
  CategoryEditDialog,
  CategoryForm,
  type CategoryRecord,
} from "@/components/categories/category-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { moveCategory, setCategoryArchived } from "@/features/accounts/actions";
import { createClient } from "@/lib/supabase/server";
import { ArchiveRestore, ArrowDown, ArrowUp, FolderTree, Plus } from "lucide-react";

function CategoryActions({ category, parents }: { category: CategoryRecord; parents: CategoryRecord[] }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <ActionFeedbackForm action={moveCategory} pendingMessage="Reordering category…" successMessage="Category order updated">
        <input name="id" type="hidden" value={category.id} /><input name="displayOrder" type="hidden" value={category.display_order} /><input name="direction" type="hidden" value="up" />
        <Button aria-label={`Move ${category.name} up`} size="icon-sm" type="submit" variant="ghost"><ArrowUp /></Button>
      </ActionFeedbackForm>
      <ActionFeedbackForm action={moveCategory} pendingMessage="Reordering category…" successMessage="Category order updated">
        <input name="id" type="hidden" value={category.id} /><input name="displayOrder" type="hidden" value={category.display_order} /><input name="direction" type="hidden" value="down" />
        <Button aria-label={`Move ${category.name} down`} size="icon-sm" type="submit" variant="ghost"><ArrowDown /></Button>
      </ActionFeedbackForm>
      <CategoryEditDialog category={category} parents={parents} />
      <ActionFeedbackForm action={setCategoryArchived} successMessage={category.is_archived ? "Category restored" : "Category archived"}>
        <input name="id" type="hidden" value={category.id} /><input name="archived" type="hidden" value={String(!category.is_archived)} />
        <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{category.is_archived ? "Restore" : "Archive"}</Button>
      </ActionFeedbackForm>
    </div>
  );
}

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id,name,transaction_type,parent_category_id,icon,color,is_system,is_archived,display_order"
      )
      .order("transaction_type")
      .order("display_order")
      .order("name"),
    supabase.from("profiles").select("show_archived_categories").single(),
  ]);
  const records = (categories ?? []) as CategoryRecord[];
  const parents = records.filter((category) => !category.parent_category_id);
  const visibleCategories = records.filter(
    (category) => profile?.show_archived_categories || !category.is_archived
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        description="Organize income, expenses, and subcategories for clearer reporting."
        title="Categories"
        actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              Add category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a category</DialogTitle>
              <DialogDescription>
                Create a top-level category or place it under a matching parent.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm parents={parents} />
          </DialogContent>
        </Dialog>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree />
            Your categories
          </CardTitle>
          <CardDescription>
            Archive categories instead of deleting them so historical reports stay intact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleCategories.length ? (
            <>
              <div className="flex flex-col gap-3 md:hidden">
                {visibleCategories.map((category) => {
                  const parent = parents.find((candidate) => candidate.id === category.parent_category_id);
                  return (
                    <article className="rounded-xl border bg-card p-4 shadow-sm" key={category.id}>
                      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{category.name}</h2>{parent ? <p className="text-sm text-muted-foreground">Under {parent.name}</p> : null}</div><Badge variant={category.transaction_type === "income" ? "success" : "destructive"}>{category.transaction_type}</Badge></div>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm"><span>{category.is_system ? "Default" : category.parent_category_id ? "Subcategory" : "Custom"}</span><Badge variant={category.is_archived ? "outline" : "success"}>{category.is_archived ? "Archived" : "Active"}</Badge></div>
                      <div className="mt-3 border-t pt-2"><CategoryActions category={category} parents={parents} /></div>
                    </article>
                  );
                })}
              </div>
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCategories.map((category) => {
                  const parent = parents.find(
                    (candidate) => candidate.id === category.parent_category_id
                  );
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{category.name}</span>
                          {parent ? (
                            <span className="text-xs text-muted-foreground">
                              Under {parent.name}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.transaction_type === "income" ? "success" : "destructive"}>{category.transaction_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {category.is_system
                          ? "Default"
                          : category.parent_category_id
                            ? "Subcategory"
                            : "Custom"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_archived ? "outline" : "success"}>
                          {category.is_archived ? "Archived" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CategoryActions category={category} parents={parents} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderTree />
                </EmptyMedia>
                <EmptyTitle>No categories to show</EmptyTitle>
                <EmptyDescription>
                  Add a category or enable archived categories in Settings.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
