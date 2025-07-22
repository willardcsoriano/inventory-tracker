'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

interface Item {
  id: number;
  name: string;
  quantity: number;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from('items')         // no <Item> here
        .select('*');

      if (error) {
        console.error(error);
      } else {
        // data can be null, so default to []
        setItems(data ?? []);
      }
    }

    fetchItems();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inventory</h1>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="p-4 bg-gray-100 rounded">
            {item.name} — {item.quantity}
          </li>
        ))}
      </ul>
    </main>
  );
}
