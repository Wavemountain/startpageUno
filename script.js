import { STOCKS_AND_CRYPTO, FOREX_PAIRS, CACHE_TIME } from './config.js';

const main = document.querySelector('main');
const refreshBtn = document.getElementById('refresh');
const darkmodeBtn = document.getElementById('darkmode');
const lastUpdateEl = document.getElementById('last-update');

// Dark mode (samma som innan)
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
  card.innerHTML = `<h2>${title}</h2><div id="${id}" class="loading">Laddar...</div>`;
  main.appendChild(card);
  return card;
}

// Aktier & Krypto via CoinGecko (ingen key!)
async function renderStocksAndCrypto() {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '';

  const ids = STOCKS_AND_CRYPTO.map(item => item.id).join(',');
  const cached = localStorage.getItem('coingecko_data');
  let data = cached ? JSON.parse(cached) : null;

  if (!data || Date.now() - data.timestamp > CACHE_TIME) {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
      const json = await res.json();
      data = { prices: json, timestamp: Date.now() };
      localStorage.setItem('coingecko_data', JSON.stringify(data));
    } catch (e) {
      console.error(e);
      container.innerHTML = '<p>Fel vid hämtning – försök refresh</p>';
      return;
    }
  }

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
          <div class="change ${change >= 0 ? 'positive' : 'negative'}">
            ${formatChange(change)}
          </div>
        </div>
      `;
      container.appendChild(itemEl);
    }
  });
}

// Valutor via Frankfurter (ingen key!)
async function renderForex() {
  const container = document.getElementById('forex-container');
  container.innerHTML = '';

  const cached = localStorage.getItem('frankfurter_latest');
  let rates = cached ? JSON.parse(cached).rates : null;

  if (!rates || Date.now() - JSON.parse(cached).timestamp > CACHE_TIME) {
    try {
      const res = await fetch('https://api.frankfurter.dev/latest?from=EUR');
      const json = await res.json();
      rates = json.rates;
      localStorage.setItem('frankfurter_latest', JSON.stringify({ rates, timestamp: Date.now() }));
    } catch (e) {
      console.error(e);
    }
  }

  if (rates) {
    // Hjälpfunktion för att räkna om (Frankfurter har EUR som base)
    const getRate = (from, to) => {
      if (from === 'EUR') return rates[to] || 0;
      if (to === 'EUR') return 1 / rates[from] || 0;
      return (rates[to] || 0) / (rates[from] || 1);
    };

    FOREX_PAIRS.forEach(pair => {
      const rate = getRate(pair.from, pair.to);
      if (rate > 0) {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.innerHTML = `
          <div class="symbol">${pair.label}</div>
          <div class="price">${formatNumber(rate)}</div>
        `;
        container.appendChild(itemEl);
      }
    });
  }
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

refreshBtn.addEventListener('click', () => {
  localStorage.clear();
  loadDashboard();
});

setInterval(loadDashboard, 10 * 60 * 1000);