const apiUrl = 'https://api.coinlore.net/api/tickers/';

let allCoins = [];

const formatCurrency = (value) => {
    const num = Number(value);
    if (num < 1) {
        return '$' + num.toFixed(4);
    }
    return '$' + num.toFixed(2);
};

const formatCompactCurrency = (value) => {
    const num = Number(value);
    if (num >= 1000000000) {
        return '$' + (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return '$' + (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return '$' + (num / 1000).toFixed(2) + 'K';
    }
    return '$' + num.toFixed(2);
};

const formatPercentage = (value) => {
    const num = Number(value);
    return num ? num.toFixed(2) + '%' : '0.00%';
};

// Main execution logic
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchMarketData();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const themeBtn = document.getElementById('theme-toggle');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTable();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            renderTable();
        });
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
}

async function fetchMarketData() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok. Status: ' + response.status);
        }
        const responseData = await response.json();
        
        // Coinlore wraps the array in a "data" property
        allCoins = responseData.data || responseData;
        
        loadingEl.classList.add('hidden');
        
        renderTable();

    } catch (error) {
        console.error("Failed to fetch market data:", error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

function renderTable() {
    const tableBody = document.getElementById('crypto-table-body');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    let filteredCoins = allCoins;

    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredCoins = allCoins.filter(coin => 
            coin.name.toLowerCase().includes(searchTerm) || 
            coin.symbol.toLowerCase().includes(searchTerm)
        );
    }

    if (sortSelect) {
        const sortMode = sortSelect.value;
        filteredCoins.sort((a, b) => {
            if (sortMode === 'market_cap_desc') {
                return Number(b.market_cap_usd) - Number(a.market_cap_usd);
            } else if (sortMode === 'price_desc') {
                return Number(b.price_usd) - Number(a.price_usd);
            } else if (sortMode === 'price_asc') {
                return Number(a.price_usd) - Number(b.price_usd);
            } else if (sortMode === 'name_asc') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
    }
    
    const htmlRows = filteredCoins.map(coin => {
        const change = Number(coin.percent_change_24h);
        const changeClass = change >= 0 ? 'change-up' : 'change-down';
        const changePrefix = change > 0 ? '+' : '';
        const fallbackImg = `https://ui-avatars.com/api/?name=${coin.symbol}&background=181a20&color=EAECEF&rounded=true`;

        return `
            <tr>
                <td class="col-name">
                    <div class="coin-info">
                        <img src="${fallbackImg}" alt="${coin.name}" class="coin-icon">
                        <div class="coin-name-group">
                            <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                            <span class="coin-full-name">${coin.name}</span>
                        </div>
                    </div>
                </td>
                <td class="col-price price">${formatCurrency(coin.price_usd)}</td>
                <td class="col-change ${changeClass}">${changePrefix}${formatPercentage(change)}</td>
                <td class="col-volume hide-mobile volume">${formatCompactCurrency(coin.volume24)}</td>
                <td class="col-marketcap hide-mobile hide-tablet market-cap">${formatCompactCurrency(coin.market_cap_usd)}</td>
            </tr>
        `;
    });

    // Update innerHTML
    tableBody.innerHTML = htmlRows.join('');
}
