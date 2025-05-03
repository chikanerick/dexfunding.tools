let displayMode = localStorage.getItem('displayMode') || '8h';
let previousFundingData = {};


function loadCachedData() {
    const cached = localStorage.getItem('cachedFundingData');
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            renderTable(parsed);
        } catch (e) {
            console.warn('Ошибка парсинга кэша:', e);
        }
    }
}


function renderTable(data) {
    const tableBody = $('table tbody');
    tableBody.empty();

    data.forEach(item => {
        const row = $('<tr></tr>');

        const backpack = item.backpack;
        const lighter = item.lighter;
        const hyperliquid = item.hyperliquid;
        const maxDiff = item.max_diff;

        function createLink(value, url, exchangeName, symbol) {
            const key = `${symbol}_${exchangeName}`;
            const prev = previousFundingData[key];
            let arrowImg = '';
        
            if (typeof value === 'number') {
                if (typeof prev === 'number') {
                    if (value > prev) {
                        arrowImg = '<img src="/static/images/arrow-up.png" class="arrow-icon" alt="↑">';
                    } else if (value < prev) {
                        arrowImg = '<img src="/static/images/arrow-down.png" class="arrow-icon" alt="↓">';
                    }
                }
                previousFundingData[key] = value;
        
                const cls = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
                const displayValue = displayMode === '1h' ? (value / 8).toFixed(4) : value.toFixed(4);
                
                return `<span class="spread-wrapper">
                            <a href="${url}" target="_blank" class="spread-link ${cls}" data-spread8h="${value}">
                                ${displayValue}%
                            </a>
                            ${arrowImg}
                        </span>`;
            } else {
                return `<span class="spread-link neutral">—</span>`;
            }
        }

        const backpackLink = createLink(backpack, "https://backpack.exchange/refer/46cb10ac-37db-42fe-b3cc-66866d2fa424", 'backpack', item.symbol);
        const lighterLink = createLink(lighter, "https://app.lighter.xyz/trade/ETH", 'lighter', item.symbol);
        const hyperliquidLink = createLink(hyperliquid, "http://app.hyperliquid.xyz/join/SWIPER", 'hyperliquid', item.symbol);

        const maxDiff8h = typeof maxDiff === 'number' ? maxDiff : null;
        const maxDiffDisplay = maxDiff8h !== null
            ? (displayMode === '1h' ? (maxDiff8h / 8).toFixed(4) : maxDiff8h.toFixed(4)) + '%'
            : '—';

        row.append(`<td>${item.symbol.toUpperCase()}</td>`);
        row.append(`<td>${backpackLink}</td>`);
        row.append(`<td>${lighterLink}</td>`);
        row.append(`<td>${hyperliquidLink}</td>`);
        row.append(`<td class="max-diff" data-spread8h="${maxDiff8h}">${maxDiffDisplay}</td>`);

        tableBody.append(row);
    });

    filterTable();
}


function updateFundingData() {
    $.ajax({
        url: '/funding_data',
        type: 'GET',
        success: function(data) {
            if (Array.isArray(data) && data.length > 0) {
                localStorage.setItem('cachedFundingData', JSON.stringify(data));
                renderTable(data);
            } else {
                console.warn('Пустой ответ от сервера. Используем кэш.');
                loadCachedData();
            }
        },
        error: function(xhr, status, error) {
            console.warn('Ошибка запроса. Используем кэш:', error);
            loadCachedData();
        }
    });
}

function updateDisplayedSpreads() {
    $('.spread-link').each(function () {
        const spread8h = parseFloat($(this).data('spread8h'));
        if (!isNaN(spread8h)) {
            const newValue = displayMode === '1h' ? (spread8h / 8) : spread8h;
            const text = newValue.toFixed(4) + '%';
            const oldHtml = $(this).html();
            const arrow = oldHtml.includes('📈') ? ' 📈' : oldHtml.includes('📉') ? ' 📉' : '';
            $(this).html(text + arrow);
        }
    });

    $('td.max-diff').each(function () {
        const spread8h = parseFloat($(this).data('spread8h'));
        if (!isNaN(spread8h)) {
            const newValue = displayMode === '1h' ? (spread8h / 8) : spread8h;
            $(this).text(newValue.toFixed(4) + '%');
        }
    });
}

function filterTable() {
    const searchTerm = $('#searchInput').val().toLowerCase();
    const minSpreadInput = $('#spreadInput').val();
    const minSpread = parseFloat(minSpreadInput);

    $('table tbody tr').each(function () {
        const symbol = $(this).find('td:first').text().toLowerCase();
        const $maxDiffCell = $(this).find('td.max-diff');
        const spread8h = parseFloat($maxDiffCell.data('spread8h'));

        const displayedSpread = displayMode === '1h' ? spread8h / 8 : spread8h;

        const matchesSymbol = symbol.includes(searchTerm);
        const matchesSpread = isNaN(minSpread) || displayedSpread >= minSpread;

        if (!isNaN(spread8h)) {
            $maxDiffCell.text(displayedSpread.toFixed(4) + '%');
        }

        if (matchesSymbol && matchesSpread) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

function updateModeButtons() {
    $('#mode8h').toggleClass('active', displayMode === '8h');
    $('#mode1h').toggleClass('active', displayMode === '1h');
}


$(document).ready(function () {
    loadCachedData(); 
    updateFundingData(); 
    setInterval(updateFundingData, 15000); 

    $('#searchInput, #spreadInput').on('input', filterTable);

    $('#decreaseSpread').click(function () {
        let value = parseFloat($('#spreadInput').val()) || 0;
        value = Math.max(0, value - 0.01);
        $('#spreadInput').val(value.toFixed(2));
        filterTable();
    });

    $('#increaseSpread').click(function () {
        let value = parseFloat($('#spreadInput').val()) || 0;
        value += 0.01;
        $('#spreadInput').val(value.toFixed(2));
        filterTable();
    });

    $('#mode8h').click(function () {
        displayMode = '8h';
        localStorage.setItem('displayMode', displayMode);
        updateModeButtons();
        updateDisplayedSpreads();
        filterTable();
    });

    $('#mode1h').click(function () {
        displayMode = '1h';
        localStorage.setItem('displayMode', displayMode);
        updateModeButtons();
        updateDisplayedSpreads();
        filterTable();
    });

    updateModeButtons();
});