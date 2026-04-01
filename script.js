const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';


// Formatting utilities
const formatCurrency = (value) => {
    const num = Number(value);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: num < 1 ? 4 : 2,
        maximumFractionDigits: num < 1 ? 4 : 2,
    }).format(num);
};

const formatCompactCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(Number(value));
};

const formatPercentage = (value) => {
    const num = Number(value);
    return num ? num.toFixed(2) + '%' : '0.00%';
};

// Main execution logic
document.addEventListener('DOMContentLoaded', () => {
    fetchMarketData();
});

async function fetchMarketData() {
    const tableBody = document.getElementById('crypto-table-body');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok. Status: ' + response.status);
        }
        const data = await response.json();
        
        // Hide loading
        loadingEl.classList.add('hidden');
        
        // Render rows
        renderTable(data, tableBody);

    } catch (error) {
        console.error("Failed to fetch market data:", error);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

function renderTable(coins, tableBody) {
    tableBody.innerHTML = ''; // clear table
    
    coins.forEach(coin => {
        const tr = document.createElement('tr');
        tr.onclick = () => {
            window.location.href = `coin.html?id=${coin.id}&symbol=${coin.symbol}`;
        };

        const change = Number(coin.price_change_percentage_24h);
        const changeClass = change >= 0 ? 'change-up' : 'change-down';
        const changePrefix = change > 0 ? '+' : '';
        const imageSrc = coin.image;

        tr.innerHTML = `
            <td class="col-name">
                <div class="coin-info">
                    <img src="${imageSrc}" alt="${coin.name}" class="coin-icon" onerror="this.src='https://ui-avatars.com/api/?name=${coin.symbol}&background=181a20&color=EAECEF&rounded=true'">
                    <div class="coin-name-group">
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                        <span class="coin-full-name">${coin.name}</span>
                    </div>
                </div>
            </td>
            <td class="col-price price">${formatCurrency(coin.current_price)}</td>
            <td class="col-change ${changeClass}">${changePrefix}${formatPercentage(change)}</td>
            <td class="col-volume hide-mobile volume">${formatCompactCurrency(coin.total_volume)}</td>
            <td class="col-marketcap hide-mobile hide-tablet market-cap">${formatCompactCurrency(coin.market_cap)}</td>
        `;
        tableBody.appendChild(tr);
    });
}
