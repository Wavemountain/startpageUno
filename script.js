// script.js - Robust stock-fetch med fallback på gratis CORS-proxies (dec 2025)

// Stocks du vill visa – lägg till/ta bort symboler här
const stocks = ['AAPL', 'NVDA', 'TSLA'];

// Gratis public CORS-proxies utan key/registrering (uppdaterat dec 2025)
const proxies = [
  (url) => `https://api.codetabs.com/v1/proxy?quest=${url}`,           // Mest stabil – först
  (url) => `https://crossorigin.me/${url}`,                            // Klassiker som fortfarande funkar
  (url) => `https://api.cors.lol/?url=${encodeURIComponent(url)}`      // Bra backup
];

// Hämta stock-data med proxy-fallback
async function fetchStockData(symbol) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&includePrePost=false&interval=1d`;

  for (const buildProxyUrl of proxies) {
    const proxyUrl = buildProxyUrl(yahooUrl);
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Validera Yahoo-strukturen
      if (data.chart && data.chart.result && data.chart.result[0]) {
        return data;
      } else {
        throw new Error('Ogiltig data från Yahoo');
      }
    } catch (err) {
      console.warn(`Proxy misslyckades (${proxyUrl}):`, err.message);
      // Prova nästa proxy
    }
  }

  // Alla proxies failade
  throw new Error('Alla proxies misslyckades');
}

// Rendera stocks i DOM
async function renderStocks() {
  const container = document.getElementById('stocks-container'); // Byt till ditt element-ID om annat
  if (!container) {
    console.error('stocks-container saknas i HTML');
    return;
  }

  container.innerHTML = '<p>Laddar aktier...</p>';

  const stockElements = [];
  let hasSuccess = false;

  for (const symbol of stocks) {
    try {
      const data = await fetchStockData(symbol);

      const result = data.chart.result[0];
      const meta = result.meta;
      const previousClose = meta.previousClose || meta.regularMarketPreviousClose || 0;
      const currentPrice = meta.regularMarketPrice || previousClose;
      const change = currentPrice - previousClose;
      const changePercent = previousClose ? ((change / previousClose) * 100).toFixed(2) : 0;

      const changeClass = change >= 0 ? 'positive' : 'negative';
      const changeSign = change >= 0 ? '+' : '';

      stockElements.push(`
        <div class="stock-item">
          <span class="symbol">${symbol}</span>
          <span class="price">$${currentPrice.toFixed(2)}</span>
          <span class="change ${changeClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent}%)</span>
        </div>
      `);

      hasSuccess = true;
    } catch (err) {
      console.error(`Fetch misslyckades för ${symbol} – använder mock`);
      stockElements.push(`
        <div class="stock-item mock">
          <span class="symbol">${symbol}</span>
          <span class="price">—</span>
          <span class="change">Offline/mock</span>
        </div>
      `);
    }
  }

  if (!hasSuccess) {
    console.error('Alla stocks misslyckades – allt är mock');
  }

  container.innerHTML = stockElements.join('');
}

// Huvudfunktion – lägg in dina andra features här
async function loadDashboard() {
  // Exempel på andra features du kanske har:
  // updateClock();
  // setupSearchField();
  // initWeather();

  await renderStocks();

  // Andra async-laddningar...
}

// Starta när DOM är redo
document.addEventListener('DOMContentLoaded', loadDashboard);

// Auto-refresh var 5:e minut (valfritt – bra för uppdaterade priser)
setInterval(renderStocks, 5 * 60 * 1000);
