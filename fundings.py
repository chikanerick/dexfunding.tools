import requests

def get_backpack_funding():
    response = requests.get(
        "https://api.backpack.exchange/api/v1/markPrices"
    )
    result = response.json()
    
    funding_rates = {}
    for item in result:
        symbol = item['symbol']
    
        if symbol.endswith('_USDC_PERP'):
            clean_symbol = symbol.replace('_USDC_PERP', '')
            funding_rate = float(item['fundingRate']) * 100  
            funding_rates[clean_symbol] = funding_rate

    return funding_rates


def get_lighter_funding():
    url = 'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates'
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers)

    try:
        result = response.json()
    except Exception as e:
        print(f"Ошибка при разборе JSON: {e}")
        print(f"Ответ сервера: {response.text}")
        return {}

    if 'funding_rates' not in result:
        print("Ошибка: поле 'funding_rates' отсутствует в ответе.")
        return {}

    funding_rates = {}
    for funding in result['funding_rates']:
        if funding['exchange'].lower() == "lighter":
            symbol = funding['symbol'].upper()
            rate_percent = (float(funding['rate']) * 100)
            funding_rates[symbol] = rate_percent

    return funding_rates


def get_hyperliquid_funding():
    url = 'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates'
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
    }
    response = requests.get(url, headers=headers)

    try:
        result = response.json()
    except Exception as e:
        print(f"Ошибка при разборе JSON: {e}")
        print(f"Ответ сервера: {response.text}")
        return {}

    if 'funding_rates' not in result:
        print("Ошибка: поле 'funding_rates' отсутствует в ответе.")
        return {}

    funding_rates = {}
    for funding in result['funding_rates']:
        if funding['exchange'].lower() == "hyperliquid":
            symbol = funding['symbol'].upper()
            rate_percent = (float(funding['rate']) * 100) 
            funding_rates[symbol] = rate_percent

    return funding_rates