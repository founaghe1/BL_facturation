import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export type InvoiceLineData = {
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
  product_id?: number;
};

interface InvoiceLineProps {
  line: InvoiceLineData;
  onChange: (field: keyof InvoiceLineData, value: string | number) => void;
  index: number;
}


const InvoiceLine: React.FC<InvoiceLineProps> = ({ line, onChange, index }) => {
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Récupère les produits depuis Supabase au focus
  const fetchProducts = async () => {
    if (productsLoaded) return;
    const { data, error } = await supabase.from('products').select('id, name');
    if (!error && data) {
      setProducts(data.map((p: any) => ({ id: p.id, name: p.name })));
      setProductsLoaded(true);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    const selectedProduct = products.find(p => p.name === selectedName);
    onChange("description", selectedName);
    if (selectedProduct) {
      onChange("product_id", selectedProduct.id);
    }
  };

  return (
    <tr className="transition">
      <td className="hover:bg-pink-50 w-25">
        <input
          type="number"
          min={0}
          className="input py-2 input-bordered input-xs w-full text-center no-spinner focus:outline-0 border-b-fuchsia-200"
          value={line.quantity === 0 ? '' : line.quantity}
          onChange={e => onChange("quantity", Number(e.target.value))}
          placeholder="0"
          title="Quantité"
        />
      </td>
      <td className="hover:bg-pink-50 w-25">
        <select
          className="input py-2 input-bordered input-xs w-full focus:outline-0 focus:ring-0 text-center"
          value={line.description}
          onChange={handleProductChange}
          onFocus={fetchProducts}
          title="Désignation"
        >
          <option value="">Désignation</option>
          {products.map((product) => (
            <option key={product.id} value={product.name}>{product.name}</option>
          ))}
        </select>
      </td>
      <td className="hover:bg-pink-50 w-25">
        <input
          type="number"
          min={0}
          className="input py-2 input-bordered input-xs w-full no-spinner focus:outline-0 focus:ring-0 text-center"
          value={line.unitPrice === 0 ? '' : line.unitPrice}
          onChange={e => onChange("unitPrice", Number(e.target.value))}
          placeholder="0"
          title="Prix Unitaire"
        />
      </td>
      <td className="text-right py-2 font-semibold text-indigo-700 w-25">
        {line.total.toFixed(2)}
      </td>
    </tr>
  );
};

export default InvoiceLine;
