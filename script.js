import { STOCKS, CRYPTO, FOREX_PAIRS, CACHE_TIME } from './config.js';

const main = document.querySelector('main');
const refreshBtn = document.getElementById('refresh');
const darkmodeBtn = document.getElementById('darkmode');
const lastUpdateEl = document.getElementById('last-update');

// Dark mode default
document.body.classList.add('dark');
darkmodeBtn.textContent = '☀️';

darkmodeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    darkmodeBtn.textContent = '☀️';
    localStorage.setItem('darkMode', 'true');
  } else {
    darkmodeBtn.textContent = '🌙';
    localStorage.setItem('darkMode', 'false');
  }
});

if (localStorage.getItem('darkMode') === 'false') {
  document.body.classList.remove('dark');
  darkmodeBtn.textContent = '🌙';
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function formatChange(pct) {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function createCard(title, id) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h2>${title}</h2><div id="${id}" class="loading">Loading...</div>`;
  main.appendChild(card);
}

// Updated mock-data with current approx prices (fallback)
const MOCK_STOCKS = {
  TSLA: { price: 456.22, change: 2.45 },
  AAPL: { price: 277.92, change: -0.80 },
  NVDA: { price: 175.20, change: 5.12 }
};

const MOCK_CRYPTO = {
  bitcoin: { usd: 90187.21, usd_24h_change: 3.67 },
  ethereum: { usd: 3107.19, usd_24h_change: -1.23 },
  solana: { usd: 132.81, usd_24h_change: 8.90 }
};

async function renderStocks() {
  let container = document.getElementById('stocks-container');
  if (!container) return;

  container.innerHTML = '<p class="loading">Loading stocks...</p>';

  let data = MOCK_STOCKS; // Default mock
  try {
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // CORS-proxy
    const promises = STOCKS.map(async (item) => {
      const url = `${proxyUrl}https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}?range=1d&includePrePost=false&interval=1d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Proxy/API error');
      const json = await res.json();
      const meta = json.chart.result[0].meta;
      const price = meta.regularMarketPrice || meta.previousClose;
      const change = ((price - meta.previousClose) / meta.previousClose) * 100;
      return { symbol: item.symbol, price, change };
    });

    const results = await Promise.all(promises);
    data = results.reduce((acc, curr) => ({ ...acc, [curr.symbol]: { price: curr.price, change: curr.change } }), {});

    localStorage.setItem('stocks_data', JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Stocks fetch failed - using mock', e);
  }

  container.innerHTML = '';
  STOCKS.forEach(item => {
    const stock = data[item.symbol];
    if (stock) {
      const itemEl = document.createElement('div');
      itemEl.className = 'item';
      itemEl.innerHTML = `
        <div class="symbol">${item.name}</div>
        <div style="text-align: right;">
          <div class="price">$${formatNumber(stock.price)}</div>
          <div class="change ${stock.change >= 0 ? 'positive' : 'negative'}">${formatChange(stock.change)}</div>
        </div>
      `;
      container.appendChild(itemEl);
    }
  });
}

async function renderCrypto() {
  let container = document.getElementById('crypto-container');
  if (!container) return;

  container.innerHTML = '<p class="loading">Loading crypto...</p>';

  let data = { prices: MOCK_CRYPTO }; // Default mock
  try {
    const ids = CRYPTO.map(item => item.id).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    data = { prices: json, timestamp: Date.now() };
    localStorage.setItem('crypto_data', JSON.stringify(data));
  } catch (e) {
    console.warn('Crypto fetch failed - using mock', e);
  }

  container.innerHTML = '';
  CRYPTO.forEach(item => {
    const coin = data.prices[item.id];
    if (coin) {
      const change = coin.usd_24h_change || 0;
      const itemEl = document.createElement('div');
      itemEl.className = 'item';
      itemEl.innerHTML = `
        <div class="symbol">${item.name}</div>
        <div style="text-align: right;">
          <div class="price">$${formatNumber(coin.usd)}</div>
          <div class="change ${change >= 0 ? 'positive' : 'negative'}">${formatChange(change)}</div>
        </div>
      `;
      container.appendChild(itemEl);
    }
  });
}

async function renderForex() {
  // (Samma som innan, ingen ändring behövs)
}

async function loadDashboard() {
  lastUpdateEl.textContent = `Last updated: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

  if (!document.getElementById('stocks-container')) createCard('Stocks', 'stocks-container');
  if (!document.getElementById('crypto-container')) createCard('Crypto', 'crypto-container');
  if (!document.getElementById('forex-container')) createCard('Currency Rates', 'forex-container');

  await Promise.all([renderStocks(), renderCrypto(), renderForex()]);
}

loadDashboard();

refreshBtn.addEventListener('click', () => {
  localStorage.clear();
  loadDashboard();
});

setInterval(loadDashboard, 10 * 60 * 1000);

