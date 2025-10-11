import { supabase } from "../supabaseClient";

type StockCheckResult =
  | { success: true }
  | { success: false; type: 'missing' | 'insufficient'; message: string; details: any[] };

export async function updateProductStockAndHistory(lines: { product_id?: number; quantity: number; description: string }[], invoiceDate: string): Promise<StockCheckResult> {
  // Phase 1 : Vérification globale des stocks
  for (const line of lines) {
    if (!line.product_id || !line.quantity) continue;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, quantity, name')
      .eq('id', line.product_id)
      .single();

    if (productError || !product) {
      return {
        success: false,
        type: 'missing',
        message: `Produit introuvable: ${line.description}`,
        details: [{ description: line.description, product_id: line.product_id }],
      };
    }

    if (product.quantity < line.quantity) {
      return {
        success: false,
        type: 'insufficient',
        message: `Stock insuffisant pour "${product.name || line.description}". Stock actuel: ${product.quantity}, Demandé: ${line.quantity}`,
        details: [{ name: product.name || line.description, available: product.quantity, requested: line.quantity, product_id: product.id }],
      };
    }
  }

  // Phase 2 : Mise à jour effective si tout est valide
  for (const line of lines) {
    if (!line.product_id || !line.quantity) continue;

    const { data: product } = await supabase
      .from('products')
      .select('id, quantity')
      .eq('id', line.product_id)
      .single();

    if (!product) continue; // defensive - should not happen because checked earlier

    await supabase
      .from('products')
      .update({ quantity: product.quantity - line.quantity })
      .eq('id', product.id);

    await supabase
      .from('product_stock_history')
      .insert({
        product_id: product.id,
        type: 'Déstockage',
        quantite: line.quantity,
        date: invoiceDate,
      });
  }

  return { success: true };
}