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

// generateXML()
//   .then(() => setLastSyncTime(Date.now()))
//   .catch((err) => console.error('Error:', err));
fetchStockPage(0, 5).then((data) => {
  data.forEach((item) => {
    console.log(item.lastUpdate) // UNDEFINED
  })
})