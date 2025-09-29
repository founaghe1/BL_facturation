import { supabase } from "../supabaseClient";

export async function updateProductStockAndHistory(lines: { product_id?: number; quantity: number; description: string }[], invoiceDate: string) {
  // Phase 1 : Vérification globale des stocks
  for (const line of lines) {
    if (!line.product_id || !line.quantity) continue;

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, quantity, name')
      .eq('id', line.product_id)
      .single();

    if (productError || !product) {
      alert(`Produit introuvable: ${line.description}`);
      return false; // Annulation si produit non trouvé
    }

    if (product.quantity < line.quantity) {
      alert(`Stock insuffisant pour "${product.name || line.description}". Stock actuel: ${product.quantity}, Demandé: ${line.quantity}`);
      return false; // Annulation immédiate
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

  return true; // Succès de toutes les opérations
}