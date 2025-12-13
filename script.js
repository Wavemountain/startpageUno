// script.js - Fixad NaN i change + robust fallback (dec 2025)
const stocks = ['AAPL', 'NVDA', 'TSLA'];

// Proxies (allorigins först – funkar stabilt just nu)
const proxies = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`
];

// Cache (5 min)
function getCached(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;
  const { data, ts } = JSON.parse(item);
  if (Date.now() - ts < 5 * 60 * 1000) return data;
  return null;
}
function setCached(key, data) {
  localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
}

// Fetch med timeout (10s) + proxy fallback
async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const cached = getCached(url);
  if (cached) return cached;

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy(url), { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) continue;
      const data = await res.json();
      setCached(url, data);
      return data;
    } catch (e) {
      console.warn('Proxy/timeout fail:', e.message);
    }
  }
  clearTimeout(id);
  throw new Error('Alla fetches misslyckades');
}

// Render stocks – FIXAD NaN
async function renderStocks() {
  const container = document.getElementById('stocks-container');
  if (!container) return;
  container.innerHTML = '<p class="loading">Laddar aktier...</p>';

  const elements = [];
  for (const symbol of stocks) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&includePrePost=false&interval=1d`;
      const data = await fetchWithTimeout(url);

      const meta = data.chart.result[0].meta;
      const currentPrice = meta.regularMarketPrice || 0;

      // FIX: Proper fallback för previous close
      let previousClose = meta.previousClose;
      if (!previousClose || previousClose === 0) {
        previousClose = meta.chartPreviousClose; // Detta finns alltid för daily change
      }

      if (!previousClose || previousClose === 0) {
        throw new Error('Ingen previous close data');
      }

      const change = (currentPrice - previousClose).toFixed(2);
      const percent = ((change / previousClose) * 100).toFixed(2);

      const color = parseFloat(change) >= 0 ? 'positive' : 'negative';
      const sign = parseFloat(change) >= 0 ? '+' : '';

      elements.push(`
        <div class="stock-item">
          <span class="symbol">${symbol}</span>
          <span class="price">$${currentPrice.toFixed(2)}</span>
          <span class="change ${color}">${sign}${change} (${sign}${percent}%)</span>
        </div>`);
    } catch (err) {
      console.warn(`Fel för ${symbol}:`, err.message);
      elements.push(`
        <div class="stock-item">
          <span class="symbol">${symbol}</span>
          <span class="price">—</span>
          <span class="change">Offline</span>
        </div>`);
    }
  }
  container.innerHTML = elements.join('');
}

// Klocka (oförändrat)
function updateClock() {
  const now = new Date();
  document.getElementById('clock').innerHTML = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('date').innerHTML = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);

// Sök
document.getElementById('search-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const q = document.getElementById('search-input')?.value.trim();
  if (q) location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
});

// Starta
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  renderStocks();
  setInterval(renderStocks, 5 * 60 * 1000); // Uppdatera var 5:e min
});
