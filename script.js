// script.js - Robust och långsiktig stock-lösning utan konto eller registrering
const stocks = ['AAPL', 'NVDA', 'TSLA'];

const proxies = [
  (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`,
  (url) => `https://crossorigin.me/${url}`,
  (url) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`
];

async function fetchStockData(symbol) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&includePrePost=false&interval=1d`;
  
  for (const buildProxy of proxies) {
    const proxyUrl = buildProxy(yahooUrl);
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(response.status);
      const data = await response.json();
      if (data.chart?.result?.[0]) return data;
    } catch (err) {
      console.warn(`Proxy failed: ${proxyUrl.split('/')[2]}`);
    }
  }
  throw new Error('All proxies failed');
}

async function renderStocks() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '<p class="loading">Laddar aktier...</p>';

  const stockElements = [];
  let success = false;

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
      success = true;
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
  if (!success) console.warn('Alla aktier använder offline-läge');
}

// Klocka (din gamla kod, oförändrad)
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('clock').innerHTML = time;
  document.getElementById('date').innerHTML = date;
}
setInterval(updateClock, 1000);

// Sökfält (din gamla kod, oförändrad)
document.getElementById('search-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  if (query) window.location = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
});

// Starta allt
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  renderStocks();
  setInterval(renderStocks, 5 * 60 * 1000); // Uppdatera var 5:e minut
});
