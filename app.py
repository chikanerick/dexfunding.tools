from flask import Flask, render_template, jsonify  # Исправлен импорт
from fundings import get_backpack_funding, get_lighter_funding, get_hyperliquid_funding
import requests

app = Flask(__name__)

def get_logo_from_coingecko(symbol: str):
    url = f"https://api.coingecko.com/api/v3/coins/{symbol}"
    try:
        response = requests.get(url)
        data = response.json()
        logo_url = data['image']['small']  # Получаем маленькую версию логотипа
        return logo_url
    except Exception as e:
        print(f"Ошибка при получении логотипа для {symbol}: {e}")
        return None

def get_common_symbols():
    backpack_data = get_backpack_funding()
    lighter_data = get_lighter_funding()
    hyperliquid_data = get_hyperliquid_funding()

    # Будем хранить данные для символов, которые есть хотя бы на двух биржах
    result = []
    
    # Обрабатываем каждый символ на трех биржах
    all_symbols = set(backpack_data.keys()).union(lighter_data.keys()).union(hyperliquid_data.keys())
    
    for symbol in all_symbols:
        # Получаем фандинг с каждой биржи, если его нет - ставим '-'
        bp = backpack_data.get(symbol, '-')
        lt = lighter_data.get(symbol, '-')
        hl = hyperliquid_data.get(symbol, '-')
        
        # Проверяем, сколько бирж имеют этот символ
        present_birjs = [bp, lt, hl]
        num_present = sum(1 for x in present_birjs if x != '-')
        
        # Если символ присутствует хотя бы на двух биржах
        if num_present >= 2:
            # Считаем максимальное различие фандингов
            funding_rates = [x for x in present_birjs if x != '-']
            max_diff = max(funding_rates) - min(funding_rates) if funding_rates else 0

            # Добавляем информацию в результат
            result.append({
                'symbol': symbol,
                'backpack': bp,
                'lighter': lt,
                'hyperliquid': hl,
                'max_diff': max_diff
            })

    # Сортируем результат по максимальной разнице фандингов
    result.sort(key=lambda x: x['max_diff'], reverse=True)
    
    return result

@app.route('/funding_data')
def get_funding_data():
    # Получаем обновлённые данные
    funding_data = get_common_symbols()

    # Формируем список словарей с нужными данными
    result = []
    for item in funding_data:
        result.append({
            'symbol': item['symbol'],
            'backpack': item['backpack'],
            'lighter': item['lighter'],
            'hyperliquid': item['hyperliquid'],
            'max_diff': item['max_diff']
        })

    # Отправляем данные в формате JSON
    return jsonify(result)

@app.route('/')
def index():
    funding_data = get_common_symbols()
    print(funding_data)  # Для проверки, что данные приходят
    return render_template('index.html', funding_data=funding_data)

if __name__ == "__main__":
    app.run(debug=True)