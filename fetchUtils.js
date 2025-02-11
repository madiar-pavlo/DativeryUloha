import fetch from 'node-fetch';

const BASE_URL = 'https://demo.flexibee.eu';
const SKLAD_URL = `${BASE_URL}/c/demo/skladova-karta.json`;
const AUTH = 'Basic ' + Buffer.from('winstrom:winstrom').toString('base64');

export async function fetchStockPage(start, limit) {
  const url = `${SKLAD_URL}?start=${start}&limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      Authorization: AUTH,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.winstrom['skladova-karta'] || [];
}

export async function fetchStockItem(itemRef) {
  const url = `${BASE_URL}${itemRef}`;
  const response = await fetch(url, {
    headers: {
      Authorization: AUTH,
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}
