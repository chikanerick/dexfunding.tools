let displayMode = localStorage.getItem('displayMode') || '8h';

function updateFundingData() {
    $.ajax({
        url: '/funding_data',
        type: 'GET',
        success: function(data) {
            const tableBody = $('table tbody');
            tableBody.empty();

            data.forEach(item => {
                const row = $('<tr></tr>');

                const backpack = item.backpack;
                const lighter = item.lighter;
                const hyperliquid = item.hyperliquid;
                const maxDiff = item.max_diff;

                function createLink(value, url) {
                    if (typeof value === 'number') {
                        const cls = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
                        const displayValue = displayMode === '1h' ? (value / 8).toFixed(4) : value.toFixed(4);
                        return `<a href="${url}" target="_blank" class="spread-link ${cls}" data-spread8h="${value}">${displayValue}%</a>`;
                    } else {
                        return `<span class="spread-link neutral">—</span>`;
                    }
                }

                const backpackLink = createLink(backpack, "https://backpack.exchange/refer/46cb10ac-37db-42fe-b3cc-66866d2fa424");
                const lighterLink = createLink(lighter, "https://app.lighter.xyz/trade/ETH");
                const hyperliquidLink = createLink(hyperliquid, "http://app.hyperliquid.xyz/join/SWIPER");

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

            filterTable(); // фильтрация после обновления
        },
        error: function(xhr, status, error) {
            console.log('Ошибка при обновлении данных:', error);
        }
    });
}

function updateDisplayedSpreads() {
    $('.spread-link').each(function() {
        const spread8h = parseFloat($(this).data('spread8h'));
        if (!isNaN(spread8h)) {
            const newValue = displayMode === '1h' ? (spread8h / 8) : spread8h;
            $(this).text(newValue.toFixed(4) + '%');
        }
    });

    $('td.max-diff').each(function() {
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

    $('table tbody tr').each(function() {
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

$(document).ready(function() {
    updateFundingData();
    setInterval(updateFundingData, 30000);

    $('#searchInput, #spreadInput').on('input', function() {
        filterTable();
    });

    $('#decreaseSpread').click(function() {
        let value = parseFloat($('#spreadInput').val()) || 0;
        value = Math.max(0, value - 0.01);
        $('#spreadInput').val(value.toFixed(2));
        filterTable();
    });

    $('#increaseSpread').click(function() {
        let value = parseFloat($('#spreadInput').val()) || 0;
        value += 0.01;
        $('#spreadInput').val(value.toFixed(2));
        filterTable();
    });

    $('#mode8h').click(function() {
        displayMode = '8h';
        localStorage.setItem('displayMode', displayMode);
        updateModeButtons();
        updateDisplayedSpreads();
        filterTable();
    });

    $('#mode1h').click(function() {
        displayMode = '1h';
        localStorage.setItem('displayMode', displayMode);
        updateModeButtons();
        updateDisplayedSpreads();
        filterTable();
    });

    updateModeButtons();
});
