const urlParams = new URLSearchParams(window.location.search);
const coinId = urlParams.get('id');
const coinSymbol = urlParams.get('symbol');

const formatCurrency = (value) => {
    const num = Number(value);
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: num < 1 ? 4 : 2,
        maximumFractionDigits: num < 1 ? 4 : 2
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

const formatCompactNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 2
    }).format(Number(value));
};

const formatPercentage = (value) => {
    const num = Number(value);
    return num ? num.toFixed(2) + '%' : '0.00%';
};

document.addEventListener('DOMContentLoaded', () => {
    if (!coinId) {
        window.location.href = 'index.html';
        return;
    }
    fetchCoinDetails();
});

async function fetchCoinDetails() {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const contentEl = document.getElementById('coin-content');

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`);
        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        if (!data) throw new Error('Coin not found');

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

        populateData(data);
        if (coinSymbol) {
            fetchChartData(coinSymbol);
        } else {
            fetchChartData(data.symbol);
        }
    } catch (e) {
        console.error(e);
        loadingEl.classList.add('hidden');
        errorEl.classList.remove('hidden');
    }
}

function populateData(data) {
    const imageSrc = data.image ? data.image.large || data.image.small : '';
    const fallbackImage = `https://ui-avatars.com/api/?name=${data.symbol}&background=181a20&color=EAECEF&rounded=true`;
    
    document.getElementById('coin-image').src = imageSrc || fallbackImage;
    document.getElementById('coin-image').onerror = function() {
        this.src = fallbackImage;
    };
    
    document.getElementById('coin-name').textContent = data.name;
    document.getElementById('about-coin-name').textContent = data.name;
    document.getElementById('coin-symbol').textContent = data.symbol ? data.symbol.toUpperCase() : '';
    
    document.getElementById('coin-price').textContent = formatCurrency(data.market_data.current_price.usd);
    
    const change = Number(data.market_data.price_change_percentage_24h);
    const changeEl = document.getElementById('coin-change');
    changeEl.textContent = (change > 0 ? '+' : '') + formatPercentage(change);
    changeEl.className = 'change-badge ' + (change >= 0 ? 'change-up' : 'change-down');

    document.getElementById('market-cap').textContent = formatCompactCurrency(data.market_data.market_cap.usd);
    document.getElementById('total-volume').textContent = formatCompactCurrency(data.market_data.total_volume.usd);
    document.getElementById('circulating-supply').textContent = formatCompactNumber(data.market_data.circulating_supply) + ' ' + (data.symbol ? data.symbol.toUpperCase() : '');
    document.getElementById('ath').textContent = formatCurrency(data.market_data.ath.usd);
    
    const descText = data.description && data.description.en ? data.description.en.split('. ')[0] + '.' : `${data.name} is a cryptocurrency token. Stay updated with the latest market trends by checking the price charts.`;
    document.getElementById('coin-desc').innerHTML = descText;
}

async function fetchChartData(symbol) {
    try {
        // Fetch 30 days data from binance
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1d&limit=30`);
        if (!response.ok) {
            console.log("Symbol not available on Binance for charting");
            return;
        }
        const data = await response.json();
        
        const labels = data.map(item => {
            const date = new Date(item[0]);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        const prices = data.map(item => Number(item[4])); // Close price
        
        renderChart(labels, prices);
    } catch(e) {
        console.error("Chart data failed", e);
    }
}

function renderChart(labels, prices) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price (USD)',
                data: prices,
                borderColor: '#FCD535',
                backgroundColor: 'rgba(252, 213, 53, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4});
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#848E9C',
                        maxTicksLimit: 7
                    }
                },
                y: {
                    grid: {
                        color: '#2b3139',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#848E9C',
                        callback: function(value) {
                            if(value >= 1000) {
                                return '$' + value / 1000 + 'k';
                            }
                            return '$' + value;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}
