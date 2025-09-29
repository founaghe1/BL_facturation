import { supabase } from "../supabaseClient";

export async function fetchInvoices() {
  const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
  return { data, error };
}

export async function deleteInvoice(id: number) {
  return await supabase.from('invoices').delete().eq('id', id);
}
