import { Builder, parseString } from 'xml2js';

export function generateShopItemObject(item) {
  const sku = item.cenik.replace(/^code:/, '').trim();
  const stockValue = item.stavMjSPozadavky;
  
  let warehouseName = 'Praha';
  if (item['sklad@showAs']) {
    const parts = item['sklad@showAs'].split(':');
    warehouseName = parts.length > 1 ? parts[1].trim() : item['sklad@showAs'].trim();
  }

  return {
    SHOPITEM: {
      ITEM_ID: sku,
      STOCK: {
        WAREHOUSES: {
          WAREHOUSE: {
            NAME: warehouseName,
            VALUE: stockValue,
          },
        },
      },
    },
  };
}

export function parseXML(xmlData) {
  return new Promise((resolve, reject) => {
    parseString(xmlData, { trim: true, explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export function buildXML(shopXML) {
  const builder = new Builder({ renderOpts: { pretty: true, indent: '  ' } });
  return builder.buildObject(shopXML);
}
