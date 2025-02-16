import * as fs from 'fs';
import { fetchStockPage } from './fetchUtils.js';
import { getLastSyncTime, setLastSyncTime } from './database.js';
import { DOMParser, XMLSerializer } from 'xmldom';
import { generateShopItemObject } from './xmlUtils.js';
import { DateTime } from 'luxon';

const LIMIT = 5;

async function generateXML() {
  const startTime = Date.now();
  const outputFile = 'shoptet_stock.xml';
  const isFirstSync = !fs.existsSync(outputFile);
  const lastSyncTime = isFirstSync ? false : getLastSyncTime();

  if (isFirstSync) {
    fs.appendFileSync(outputFile, '');
  }

  let xmlData = fs.readFileSync(outputFile, 'utf-8');

  if (!xmlData) {
    xmlData = '<SHOP></SHOP>';
  }

  const writeStream = fs.createWriteStream(outputFile, {
    encoding: 'utf8',
  });

  let shopXML = new DOMParser().parseFromString(xmlData, 'text/xml');
  let shopElement = shopXML.getElementsByTagName('SHOP')[0];
  if (!shopElement) {
    shopElement = shopXML.createElement('SHOP');
    shopXML.appendChild(shopElement); 
  }

  let start = 0;
  let pageCount = 0;

  while (pageCount < 5) {
    let items = await fetchStockPage(start, LIMIT, lastSyncTime);
    if (items.length === 0) break;

    for (const item of items) {
      const itemObject = generateShopItemObject(item); 

      let itemNode = new DOMParser().parseFromString(itemObject, 'text/xml');
      shopElement.appendChild(itemNode);
    }

    start += items.length;
    pageCount++;
    console.log(`Page ${pageCount} loaded, count of items: ${items.length}`);
    if (items.length < LIMIT) break;
  }

  const xmlContent = new XMLSerializer().serializeToString(shopXML);
  writeStream.write(xmlContent);
  writeStream.end();

  const endTime = (Date.now() - startTime) / 1000;
  console.log(
    `XML successfully generated in ${Math.floor(
      endTime
    )}s and saved to file: ${outputFile}`
  );
}

// setLastSyncTime(DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ss"))
// setLastSyncTime('2024-01-01T13:01:01');
generateXML()
  .then(() => setLastSyncTime(DateTime.now().toFormat("yyyy-MM-dd'T'HH:mm:ss")))
  .catch((err) => console.error('Error:', err));
