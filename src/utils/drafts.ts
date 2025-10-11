import { supabase } from "../supabaseClient";

export async function fetchDrafts() {
  const { data, error } = await supabase.from('drafts').select('*').order('created_at', { ascending: false });
  return { data, error };
}

export async function fetchDraft(id: number) {
  const { data, error } = await supabase.from('drafts').select('*').eq('id', id).single();
  return { data, error };
}

export async function upsertDraft(draft: any) {
  // Clean payload: remove undefined/null properties
  const payload: any = {};
  for (const key of Object.keys(draft || {})) {
    const val = (draft as any)[key];
    if (val === undefined || val === null) continue;
    // Ensure lines is a plain array/object suitable for JSONB
    if (key === 'lines' && Array.isArray(val)) {
      // safe number helper
      const safeNumber = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      payload.lines = val.map((l: any) => ({
        description: l.description ?? null,
        quantity: safeNumber(l.quantity),
        unitPrice: safeNumber(l.unitPrice),
        total: safeNumber(l.total),
        product_id: l.product_id ?? null,
      }));
      continue;
    }
    payload[key] = val;
  }

  if (draft && draft.id) {
    const id = draft.id;
    // remove id from payload to avoid updating the primary key column
    delete payload.id;
    const { data, error } = await supabase.from('drafts').update(payload).eq('id', id).select();
    console.debug('upsertDraft update result', { data, error, payload });
    return { data, error };
  }

  const { data, error } = await supabase.from('drafts').insert([payload]).select();
  console.debug('upsertDraft insert result', { data, error, payload });
  return { data, error };
}

export async function deleteDraft(id: number) {
  return await supabase.from('drafts').delete().eq('id', id);
}
