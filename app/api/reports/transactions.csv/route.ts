import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/calculations/ledger";
export async function GET(){const supabase=await createClient(); const {data}=await supabase.from('transactions').select('transaction_type,amount,currency,status,transaction_date,category_id').order('transaction_date',{ascending:false}); return new Response(toCsv(data??[]),{headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="moneylau-transactions.csv"'}})}
