export function generateShopItemObject(item) {
  const sku = item.cenik.replace(/^code:/, '').trim();
  const stockValue = item.stavMjSPozadavky;

  let warehouseName = 'Praha';
  if (item['sklad@showAs']) {
    const parts = item['sklad@showAs'].split(':');
    warehouseName =
      parts.length > 1 ? parts[1].trim() : item['sklad@showAs'].trim();
  }
  return `
  <SHOPITEM>
        <ITEM_ID>${sku}</ITEM_ID>
      <STOCK>
        <WAREHOUSES>
          <WAREHOUSE>
            <NAME>${warehouseName}</NAME>
            <VALUE>${stockValue}</VALUE>
          </WAREHOUSE>
        </WAREHOUSES>
      </STOCK>
  </SHOPITEM>
  \n
  `;
}