// script.js - Stocks + Crypto + Valutakurser (robust dec 2025)
const stocks = ['AAPL', 'NVDA', 'TSLA'];
const cryptos = ['bitcoin', 'ethereum', 'solana']; // CoinGecko IDs (anpassa om du använder andra)
const currencies = ['EUR', 'SEK', 'GBP', 'JPY', 'CNY']; // Valutor mot USD

// Proxies för säkerhet (allorigins först – funkar bäst för CoinGecko/Yahoo)
const proxies = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`,
  (url) => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`
];

// Cache-funktioner (5 min)
function getCached(key) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const { data, ts } = JSON.parse(cached);
  if (Date.now() - ts < 5 * 60 * 1000) return data;
  return null;
}
function setCached(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
}

// Generisk fetch med proxy-fallback
async function fetchWithProxy(url) {
  const cached = getCached(url);
  if (cached) return cached;

  for (const buildProxy of proxies) {
    const proxyUrl = buildProxy(url);
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      setCached(url, data);
      console.log(`Lyckades med proxy för ${url.split('/').pop()}`);
      return data;
    } catch (e) {
      console.warn(`Proxy fail: ${proxyUrl.split('/')[2]}`);
    }
  }
  throw new Error('Alla proxies fail');
}

// Stocks (Yahoo – behåll din logik)
async function fetchStockData(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&includePrePost=false&interval=1d`;
  const data = await fetchWithProxy(url);
  if (data.chart?.result?.[0]) return data;
  throw new Error('Invalid stock data');
}

// Crypto (CoinGecko – gratis, ingen key)
async function fetchCryptoData() {
  const ids = cryptos.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  return await fetchWithProxy(url);
}

// Valutakurser (exchangerate.host – gratis, ingen key, CORS-vänlig)
async function fetchForexData() {
  const base = 'USD';
  const symbols = currencies.join(',');
  const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols}`;
  return await fetchWithProxy(url);
}

// Render-funktioner
async function renderStocks() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '<p class="loading">Laddar aktier...</p>';
  const elements = [];
  for (const symbol of stocks) {
    try {
      const data = await fetchStockData(symbol);
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice.toFixed(2);
      const prev = meta.previousClose || meta.regularMarketPreviousClose;
      const change = (meta.regularMarketPrice - prev).toFixed(2);
      const percent = ((change / prev) * 100).toFixed(2);
      const color = change >= 0 ? 'positive' : 'negative';
      const sign = change >= 0 ? '+' : '';
      elements.push(`<div class="stock-item"><span class="symbol">${symbol}</span><span class="price">$${price}</span><span class="change ${color}">${sign}${change} (${sign}${percent}%)</span></div>`);
    } catch {
      elements.push(`<div class="stock-item"><span class="symbol">${symbol}</span><span class="price">—</span><span class="change">Offline</span></div>`);
    }
  }
  container.innerHTML = elements.join('');
}

async function renderCrypto() {
  const container = document.getElementById('crypto-container'); // Lägg till denna div i HTML
  if (!container) return;
  container.innerHTML = '<p class="loading">Laddar crypto...</p>';
  try {
    const data = await fetchCryptoData();
    const elements = [];
    for (const id of cryptos) {
      const coin = data[id];
      const price = coin.usd.toFixed(2);
      const change = coin.usd_24h_change.toFixed(2);
      const color = change >= 0 ? 'positive' : 'negative';
      const sign = change >= 0 ? '+' : '';
      const name = id.toUpperCase();
      elements.push(`<div class="stock-item"><span class="symbol">${name}</span><span class="price">$${price}</span><span class="change ${color}">${sign}${change}%</span></div>`);
    }
    container.innerHTML = elements.join('');
  } catch {
    container.innerHTML = '<p class="change">Offline</p>';
  }
}

async function renderForex() {
  const container = document.getElementById('forex-container'); // Lägg till denna div i HTML
  if (!container) return;
  container.innerHTML = '<p class="loading">Laddar valutakurser...</p>';
  try {
    const data = await fetchForexData();
    if (!data.success) throw new Error('API error');
    const rates = data.rates;
    const elements = [];
    for (const curr of currencies) {
      const rate = rates[curr].toFixed(4);
      elements.push(`<div class="stock-item"><span class="symbol">USD/${curr}</span><span class="price">${rate}</span></div>`);
    }
    container.innerHTML = elements.join('');
  } catch (e) {
    console.error('Forex fail:', e);
    container.innerHTML = '<p class="change">Offline</p>';
  }
}

// Klocka & sök (oförändrat)
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('clock').innerHTML = time;
  document.getElementById('date').innerHTML = date;
}
setInterval(updateClock, 1000);

document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  if (query) window.location = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
});

// Starta allt
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  renderStocks();
  renderCrypto();
  renderForex();
  setInterval(() => {
    renderStocks();
    renderCrypto();
    renderForex();
  }, 5 * 60 * 1000); // Uppdatera var 5:e min
});
