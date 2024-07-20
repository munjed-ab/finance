import os
from dotenv import load_dotenv

import requests
import json
from decimal import Decimal
import asyncio

load_dotenv()
CURRENCIES = [
"USD",
"EUR",
"JPY",
"GBP",
"CHF",
"CAD",
"AUD",
"ZAR",
"SYP",
"NGN",
"EGP",
"QAR",
"IRR",
"DZD",
"BSD",
"AOA",
"ALL"
]
API_URL = f'https://v6.exchangerate-api.com/v6/{os.environ['EXCHANGE_RATE_API_KEY']}/latest/'
JSON_FILE = 'exchange_rates/exchange_rates_'



async def fetch_exchange_rates():
    try:
        for cur in CURRENCIES:
            response = requests.get(API_URL+f"{cur.strip().upper()}")
            response.raise_for_status()
            data = response.json()
            with open(JSON_FILE+f"{cur.strip().upper()}.json", 'w') as file:
                json.dump(data['conversion_rates'], file)
            await asyncio.sleep(5)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching exchange rates: {e}")
        return {}


async def read_exchange_rates(cur):
    try:
        with open(JSON_FILE+f"{cur.strip().upper()}.json", 'r') as file:
            return json.load(file)
    except FileNotFoundError as e:
        print(f"Error reading exchange rates for {cur}: {e}")
        return {}


async def convert_currency(amount, from_currency, to_currency):
    rates = await read_exchange_rates(from_currency)
    if from_currency == to_currency:
        return amount
    try:
        rate = rates[to_currency] / rates[from_currency]
        return amount * Decimal(rate)
    except KeyError:
        print(f"Conversion rate for {from_currency} to {to_currency} not found.")
        return amount
