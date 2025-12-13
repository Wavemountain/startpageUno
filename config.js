// No API keys needed!

export const STOCKS = [
  { symbol: 'TSLA', name: 'Tesla (TSLA)' },
  { symbol: 'AAPL', name: 'Apple (AAPL)' },
  { symbol: 'NVDA', name: 'Nvidia (NVDA)' }
];

export const CRYPTO = [
  { id: 'bitcoin', name: 'Bitcoin (BTC)' },
  { id: 'ethereum', name: 'Ethereum (ETH)' },
  { id: 'solana', name: 'Solana (SOL)' }
];

export const FOREX_PAIRS = [
  { from: 'USD', to: 'SEK', label: 'USD/SEK' },
  { from: 'EUR', to: 'SEK', label: 'EUR/SEK' },
  { from: 'GBP', to: 'SEK', label: 'GBP/SEK' },
  { from: 'JPY', to: 'SEK', label: 'JPY/SEK' },
  { from: 'EUR', to: 'USD', label: 'EUR/USD' }
];

export const CACHE_TIME = 5 * 60 * 1000; // 5 min cache
