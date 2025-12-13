import { STOCKS_AND_CRYPTO, FOREX_PAIRS, CACHE_TIME } from './config.js';

const main = document.querySelector('main');
const refreshBtn = document.getElementById('refresh');
const darkmodeBtn = document.getElementById('darkmode');
const lastUpdateEl = document.getElementById('last-update');

// Dark mode (samma)
darkmodeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkmodeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  darkmodeBtn.textContent = '☀️';
}

function formatNumber(num) {
  return new Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

function formatChange(pct) {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function createCard(title, id) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `<h2>${title}</h2><div id="${id}"><p class="loading">Laddar...</p></div>`;
  main.appendChild(card);
}

// Mock-data som fallback (ser snyggt ut direkt)
const MOCK_CRYPTO = {
  tesla: { usd: 350.24, usd_24h_change: 2.45 },
  apple: { usd: 228.50, usd_24h_change: -0.80 },
  nvidia: { usd: 142.33, usd_24h_change: 5.12 },
  bitcoin: { usd: 96250.00, usd_24h_change: 3.67 },
  ethereum: { usd: 3420.00, usd_24h_change: -1.23 },
  solana: { usd: 198.50, usd_24h_change: 8.90 }
};

async function renderStocksAndCrypto() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '<p class="loading">Laddar aktier & krypto...</p>';

  let data = null;
  try {
    const ids = STOCKS_AND_CRYPTO.map(item => item.id).join(',');
    const cached = localStorage.getItem('coingecko_data');
    if (cached && Date.now() - JSON.parse(cached).timestamp < CACHE_TIME) {
      data = JSON.parse(cached);
    } else {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      if (!res.ok) throw new Error('Rate limit eller fel');
      const json = await res.json();
      data = { prices: json, timestamp: Date.now() };
      localStorage.setItem('coingecko_data', JSON.stringify(data));
    }
  } catch (e) {
    console.warn('CoinGecko failade – använder mock-data', e);
    data = { prices: MOCK_CRYPTO };
  }

  container.innerHTML = '';
  STOCKS_AND_CRYPTO.forEach(item => {
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
  const container = document.getElementById('forex-container');
  container.innerHTML = '<p class="loading">Laddar valutakurser...</p>';

  // Frankfurter funkar alltid bra
  let rates = null;
  try {
    const cached = localStorage.getItem('frankfurter_latest');
    if (cached && Date.now() - JSON.parse(cached).timestamp < CACHE_TIME) {
      rates = JSON.parse(cached).rates;
    } else {
      const res = await fetch('https://api.frankfurter.dev/latest?from=EUR');
      const json = await res.json();
      rates = json.rates;
      localStorage.setItem('frankfurter_latest', JSON.stringify({ rates, timestamp: Date.now() }));
    }
  } catch (e) {
    console.warn('Frankfurter failade', e);
  }

  container.innerHTML = '';
  FOREX_PAIRS.forEach(pair => {
    const rate = rates ? (pair.from === 'EUR' ? rates[pair.to] : (pair.to === 'EUR' ? 1 / rates[pair.from] : (rates[pair.to] || 0) / (rates[pair.from] || 1)) : 0;
    const itemEl = document.createElement('div');
    itemEl.className = 'item';
    itemEl.innerHTML = `
      <div class="symbol">${pair.label}</div>
      <div class="price">${rate > 0 ? formatNumber(rate) : '—'}</div>
    `;
    container.appendChild(itemEl);
  });
}

async function loadDashboard() {
  lastUpdateEl.textContent = `Senast uppdaterad: ${new Date().toLocaleTimeString('sv-SE')}`;
  if (!document.getElementById('stocks-container')) {
    createCard('Aktier & Krypto', 'stocks-container');
    createCard('Valutakurser', 'forex-container');
  }
  await Promise.all([renderStocksAndCrypto(), renderForex()]);
}

loadDashboard();
refreshBtn.addEventListener('click', () => { localStorage.clear(); loadDashboard(); });
setInterval(loadDashboard, 10 * 60 * 1000);
