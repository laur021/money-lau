import { ArchiveRestore, ArrowDown, ArrowUp, FolderTree, Plus } from "lucide-react";
import { CategoryEditDialog, CategoryForm, type CategoryRecord } from "@/components/categories/category-form";
import { Badge } from "@/components/ui/badge";
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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { moveCategory, setCategoryArchived } from "@/features/accounts/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,transaction_type,parent_category_id,icon,color,is_system,is_archived,display_order")
      .order("transaction_type")
      .order("display_order")
      .order("name"),
    supabase.from("profiles").select("show_archived_categories").single(),
  ]);
  const records = (categories ?? []) as CategoryRecord[];
  const parents = records.filter((category) => !category.parent_category_id);
  const visibleCategories = records.filter(
    (category) => profile?.show_archived_categories || !category.is_archived,
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Income, expenses, and subcategories</p>
          <h1 className="text-2xl font-semibold">Categories</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus data-icon="inline-start" />Add category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a category</DialogTitle>
              <DialogDescription>Create a top-level category or place it under a matching parent.</DialogDescription>
            </DialogHeader>
            <CategoryForm parents={parents} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderTree />Your categories</CardTitle>
          <CardDescription>Archive categories instead of deleting them so historical reports stay intact.</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleCategories.length ? (
            <Table>
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
                  const parent = parents.find((candidate) => candidate.id === category.parent_category_id);
                  return (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{category.name}</span>
                          {parent ? <span className="text-xs text-muted-foreground">Under {parent.name}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{category.transaction_type}</Badge></TableCell>
                      <TableCell>{category.is_system ? "Default" : category.parent_category_id ? "Subcategory" : "Custom"}</TableCell>
                      <TableCell><Badge variant={category.is_archived ? "outline" : "secondary"}>{category.is_archived ? "Archived" : "Active"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <form action={moveCategory}>
                            <input name="id" type="hidden" value={category.id} />
                            <input name="displayOrder" type="hidden" value={category.display_order} />
                            <input name="direction" type="hidden" value="up" />
                            <Button aria-label={`Move ${category.name} up`} size="icon-sm" type="submit" variant="ghost"><ArrowUp /></Button>
                          </form>
                          <form action={moveCategory}>
                            <input name="id" type="hidden" value={category.id} />
                            <input name="displayOrder" type="hidden" value={category.display_order} />
                            <input name="direction" type="hidden" value="down" />
                            <Button aria-label={`Move ${category.name} down`} size="icon-sm" type="submit" variant="ghost"><ArrowDown /></Button>
                          </form>
                          <CategoryEditDialog category={category} parents={parents} />
                          <form action={setCategoryArchived}>
                            <input name="id" type="hidden" value={category.id} />
                            <input name="archived" type="hidden" value={String(!category.is_archived)} />
                            <Button size="sm" type="submit" variant="outline"><ArchiveRestore data-icon="inline-start" />{category.is_archived ? "Restore" : "Archive"}</Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FolderTree /></EmptyMedia>
                <EmptyTitle>No categories to show</EmptyTitle>
                <EmptyDescription>Add a category or enable archived categories in Settings.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </main>
  );
}