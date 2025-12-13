// script.js - Superrobust stock-fetch dec 2025 (med fler proxies + caching)
const stocks = ['AAPL', 'NVDA', 'TSLA'];

// Uppdaterad proxy-lista (dec 2025 – allorigins först, oftast bäst)
const proxies = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,  // Bästa valet nu
  (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`,
  (url) => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`
];

// Enkel localStorage-cache (5 minuter)
function getCachedData(symbol) {
  const cached = localStorage.getItem(`stock_${symbol}`);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < 5 * 60 * 1000) return data;
  return null;
}

function setCachedData(symbol, data) {
  localStorage.setItem(`stock_${symbol}`, JSON.stringify({ data, timestamp: Date.now() }));
}

async function fetchStockData(symbol) {
  // Kolla cache först
  const cached = getCachedData(symbol);
  if (cached) {
    console.log(`Använder cache för ${symbol}`);
    return cached;
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&includePrePost=false&interval=1d`;

  for (const buildProxy of proxies) {
    const proxyUrl = buildProxy(yahooUrl);
    try {
      const response = await fetch(proxyUrl, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.chart?.result?.[0]) {
        console.log(`Lyckades med proxy: ${proxyUrl.split('/')[2]}`);
        setCachedData(symbol, data);
        return data;
      }
    } catch (err) {
      console.warn(`Proxy misslyckades (${proxyUrl.split('/')[2]}): ${err.message}`);
    }
  }
  throw new Error('Alla proxies misslyckades');
}

async function renderStocks() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '<p class="loading">Laddar aktier...</p>';

  const stockElements = [];
  let successCount = 0;

  for (const symbol of stocks) {
    try {
      const data = await fetchStockData(symbol);
      const meta = data.chart.result[0].meta;
      const price = meta.regularMarketPrice.toFixed(2);
      const prev = meta.previousClose || meta.regularMarketPreviousClose;
      const change = (meta.regularMarketPrice - prev).toFixed(2);
      const percent = ((change / prev) * 100).toFixed(2);
      const sign = change >= 0 ? '+' : '';
      const color = change >= 0 ? 'positive' : 'negative';

      stockElements.push(`
        <div class="stock-item">
          <span class="symbol">${symbol}</span>
          <span class="price">$${price}</span>
          <span class="change ${color}">${sign}${change} (${sign}${percent}%)</span>
        </div>`);
      successCount++;
    } catch {
      stockElements.push(`
        <div class="stock-item">
          <span class="symbol">${symbol}</span>
          <span class="price">—</span>
          <span class="change">Offline</span>
        </div>`);
    }
  }

  container.innerHTML = stockElements.join('');
  if (successCount === 0) console.warn('Alla aktier offline – prova refresh');
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

// Starta
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  renderStocks();
  setInterval(renderStocks, 5 * 60 * 1000);
});
