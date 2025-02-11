// import fetch from 'node-fetch';
// import * as fs from 'fs';
// import { getLastSyncTime, setLastSyncTime } from './database.js';
// import { Builder, parseString } from 'xml2js';

// const BASE_URL = 'https://demo.flexibee.eu';
// const SKLAD_URL = `${BASE_URL}/c/demo/skladova-karta.json`;
// const AUTH = 'Basic ' + Buffer.from('winstrom:winstrom').toString('base64');

// const LIMIT = 5;

// async function fetchStockPage(start, limit) {
//   const url = `${SKLAD_URL}?start=${start}&limit=${limit}`;
//   const response = await fetch(url, {
//     headers: {
//       Authorization: AUTH,
//     },
//   });
//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }
//   const data = await response.json();
//   return data.winstrom['skladova-karta'] || [];
// }

// async function fetchStockItem(itemRef) {
//   const url = `${BASE_URL}${itemRef}`;
//   const response = await fetch(url, {
//     headers: {
//       Authorization: AUTH,
//     },
//   });
//   if (!response.ok) {
//     throw new Error(`HTTP error! status: ${response.status}`);
//   }
//   const data = await response.json();
//   return data;
// }

// function generateShopItemObject(item) {
//   const sku = item.cenik.replace(/^code:/, '').trim();
//   const stockValue = item.stavMjSPozadavky;

//   let warehouseName = 'Praha';
//   if (item['sklad@showAs']) {
//     const parts = item['sklad@showAs'].split(':');
//     if (parts.length > 1) {
//       warehouseName = parts[1].trim();
//     } else {
//       warehouseName = item['sklad@showAs'].trim();
//     }
//   }

//   return {
//     SHOPITEM: {
//       ITEM_ID: sku,
//       STOCK: {
//         WAREHOUSES: {
//           WAREHOUSE: {
//             NAME: warehouseName,
//             VALUE: stockValue,
//           },
//         },
//       },
//     },
//   };
// }

// async function generateXML() {
//   const startTime = Date.now();
//   const outputFile = 'shoptet_stock.xml';
//   const isntFirstSync = fs.existsSync(outputFile);
//   const lastSyncTime = new Date(getLastSyncTime());

//   const writeStream = fs.createWriteStream(outputFile, {
//     encoding: 'utf8',
//   });

//   let shopXML = { SHOP: [] };

//   if (isntFirstSync) {
//     const xmlData = fs.readFileSync(outputFile, 'utf8');
//     await new Promise((resolve, reject) => {
//       parseString(xmlData, { trim: true, explicitArray: false }, (err, result) => {
//         if (err) reject(err);
//         else {
//           shopXML = result;
//           resolve();
//         }
//       });
//     });
//   }

//   if (!isntFirstSync) {
//     writeStream.write('<?xml version="1.0" encoding="utf-8"?>\n');
//   }

//   let start = 0;
//   let pageCount = 0;
//   while (pageCount <= 5) {
//     const items = await fetchStockPage(start, LIMIT);
//     if (items.length === 0) {
//       break;
//     }

//     for (const item of items) {
//       if (!isntFirstSync) {
//         const itemObject = generateShopItemObject(item);
//         shopXML.SHOP.push(itemObject);
//       } else {
//         const detailedItem = await fetchStockItem(item['sklad@ref']);
//         const itemLastUpdate = new Date(
//           detailedItem.winstrom.sklad[0].lastUpdate
//         );
//         if (itemLastUpdate.getTime() > lastSyncTime.getTime() && !isFirstSync) {
//           const itemObject = generateShopItemObject(item);
//           shopXML.SHOP.push(itemObject);
//         }
//       }
//     }

//     start += items.length;
//     pageCount++;
//     console.log(`Page ${pageCount} loaded, count of items: ${items.length}`);
//     if (items.length < LIMIT) {
//       break;
//     }
//   }

//   const builder = new Builder({ renderOpts: { pretty: true, indent: '  ' } });
//   const xmlContent = builder.buildObject(shopXML);
//   writeStream.write(xmlContent);

//   writeStream.end();
//   const endTime = (Date.now() - startTime) / 1000;
//   console.log(
//     `XML successfully generated in ${Math.floor(
//       endTime
//     )}s and saved to file: ${outputFile}`
//   );
// }

// generateXML()
//   .then(() => {
//     setLastSyncTime(Date.now());
//   })
//   .catch((err) => console.error('Error:', err));
import * as fs from 'fs';
import { fetchStockPage, fetchStockItem } from './fetchUtils.js';
import { generateShopItemObject, parseXML, buildXML } from './xmlUtils.js';
import { getLastSyncTime, setLastSyncTime } from './database.js';

const LIMIT = 5;

async function generateXML() {
  const startTime = Date.now();
  const outputFile = 'shoptet_stock.xml';
  const isntFirstSync = fs.existsSync(outputFile);
  const lastSyncTime = new Date(getLastSyncTime());

  const writeStream = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  let shopXML = { SHOP: [] };

  if (isntFirstSync) {
    const xmlData = fs.readFileSync(outputFile, 'utf8');
    shopXML = await parseXML(xmlData);
  }

  if (!isntFirstSync) {
    writeStream.write('<?xml version="1.0" encoding="utf-8"?>\n');
  }

  let start = 0;
  let pageCount = 0;
  while (pageCount < 5) {
    const items = await fetchStockPage(start, LIMIT);
    if (items.length === 0) break;

    for (const item of items) {
      if (!isntFirstSync) {
        const itemObject = generateShopItemObject(item);
        shopXML.SHOP.push(itemObject);
      } else {
        const detailedItem = await fetchStockItem(item['sklad@ref']);
        const itemLastUpdate = new Date(
          detailedItem.winstrom.sklad[0].lastUpdate
        );
        if (itemLastUpdate.getTime() > lastSyncTime.getTime() && !isFirstSync) {
          const itemObject = generateShopItemObject(item);
          shopXML.SHOP.push(itemObject);
        }
      }
    }

    start += items.length;
    pageCount++;
    console.log(`Page ${pageCount} loaded, count of items: ${items.length}`);
    if (items.length < LIMIT) break;
  }

  const xmlContent = buildXML(shopXML);
  writeStream.write(xmlContent);
  writeStream.end();
  const endTime = (Date.now() - startTime) / 1000;
  console.log(
    `XML successfully generated in ${Math.floor(
      endTime
    )}s and saved to file: ${outputFile}`
  );
}

generateXML()
  .then(() => setLastSyncTime(Date.now()))
  .catch((err) => console.error('Error:', err));
