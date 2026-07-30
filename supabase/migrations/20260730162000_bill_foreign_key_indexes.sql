create index bill_templates_default_account_idx
  on public.bill_templates (default_account_id);

create index bill_templates_default_category_idx
  on public.bill_templates (default_category_id);

create index bill_items_source_bill_item_idx
  on public.bill_items (source_bill_item_id);
