import json
import os
import urllib.parse

from components import cpus
from components import gpus
from components import motherboards
from components import rams
from components import storages
from components import psus
from components import cases
from components import coolers
from components import fans

raw_data = {
    "cpu": cpus.items,
    "gpu": gpus.items,
    "motherboard": motherboards.items,
    "ram": rams.items,
    "storage": storages.items,
    "psu": psus.items,
    "case": cases.items,
    "cooler": coolers.items,
    "case_fans": fans.items
}

def detect_socket(name):
    name_lower = name.lower()
    if any(x in name_lower for x in ["lga1700", "i3-12", "i5-12", "i5-13", "i5-14", "i7-12", "i7-13", "i7-14", "i9-12", "i9-13", "i9-14", "h610", "b760", "z790"]):
        return "LGA1700"
    if any(x in name_lower for x in ["am4", "3600", "5500", "5600", "5700", "5800", "5900", "a520", "b450", "b550"]):
        return "AM4"
    if any(x in name_lower for x in ["am5", "7500f", "7600", "7700", "7800x3d", "7900", "7950", "8600g", "8700g", "9600x", "9700x", "9800x3d", "9950x", "b650", "x670"]):
        return "AM5"
    if any(x in name_lower for x in ["ultra 5", "ultra 7", "ultra 9", "z890", "lga1851"]):
        return "LGA1851"
    return "Universal"

final_database = {}

for category, items_list in raw_data.items():
    final_database[category] = []
    for index, item_name in enumerate(items_list, start=1):
        encoded_name = urllib.parse.quote_plus(item_name)
        
        product = {
            "id": f"{category}_{index:04d}", 
            "name": item_name,
            "price_approx": "Уточняйте по ссылке",
            "links": {
                "yandex": f"https://yandex.ru{encoded_name}",
                "dns": f"https://dns-shop.ru{encoded_name}",
                "megamarket": f"https://megamarket.ru{encoded_name}"
            }
        }
        if category in ["cpu", "motherboard", "cooler"]:
            product["socket"] = detect_socket(item_name)
            
        final_database[category].append(product)

output_path = os.path.join("..", "database.json")

os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_database, f, ensure_ascii=False, indent=2)

print("database.json!")