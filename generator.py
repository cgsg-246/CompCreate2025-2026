import json
import os
import urllib.parse
import re

from components import cpus, gpus, motherboards, rams, storages, psus, cases, coolers, fans

SKETCHFAB_MAPPING = {
    "rtx 5090": "2f818c18a427480d8968cec07f8d133b",
    "rtx 5080": "2f818c18a427480d8968cec07f8d133b",
    "rtx 5070 ti": "2f818c18a427480d8968cec07f8d133b",
    "rtx 5070": "f3b953474fc44979ad44a69b7bc8e911",
    "rtx 4090": "2f818c18a427480d8968cec07f8d133b",
    "rtx 4080 super": "2f818c18a427480d8968cec07f8d133b",
    "rtx 4070 ti super": "2f818c18a427480d8968cec07f8d133b",
    "rtx 4070 super": "f3b953474fc44979ad44a69b7bc8e911",
    "rtx 4060 ti": "f3b953474fc44979ad44a69b7bc8e911",
    "rtx 4060": "f3b953474fc44979ad44a69b7bc8e911",
    "rx 7900 xtx": "2f818c18a427480d8968cec07f8d133b",
    "rx 7800 xt": "f3b953474fc44979ad44a69b7bc8e911",
    "rx 7600": "f3b953474fc44979ad44a69b7bc8e911",
    "arc a770": "2f818c18a427480d8968cec07f8d133b",
    
    "asus prime z790": "0dc19d1287b74fca94d372a2ddc124bd",
    "asus prime z890": "0dc19d1287b74fca94d372a2ddc124bd",
    "asus prime b760": "0dc19d1287b74fca94d372a2ddc124bd",
    "asus prime x670": "0dc19d1287b74fca94d372a2ddc124bd",
    "gigabyte aorus elite": "0dc19d1287b74fca94d372a2ddc124bd",
    "msi mag tomahawk": "0dc19d1287b74fca94d372a2ddc124bd",
    "asrock steel legend": "0dc19d1287b74fca94d372a2ddc124bd",
    "asus rog strix z790": "0dc19d1287b74fca94d372a2ddc124bd",

    "intel core i9": "2f818c18a427480d8968cec07f8d133b",
    "intel core i7": "f3b953474fc44979ad44a69b7bc8e911",
    "intel core i5": "f3b953474fc44979ad44a69b7bc8e911",
    "intel core i3": "f3b953474fc44979ad44a69b7bc8e911",
    "amd ryzen 9": "2f818c18a427480d8968cec07f8d133b",
    "amd ryzen 7": "f3b953474fc44979ad44a69b7bc8e911",
    "amd ryzen 5": "f3b953474fc44979ad44a69b7bc8e911",

    "kingston fury": "f3b953474fc44979ad44a69b7bc8e911",
    "g.skill trident": "f3b953474fc44979ad44a69b7bc8e911",
    "corsair vengeance": "f3b953474fc44979ad44a69b7bc8e911",
    "adata xpg": "f3b953474fc44979ad44a69b7bc8e911",

    "samsung 990 pro": "f3b953474fc44979ad44a69b7bc8e911",
    "samsung 980 pro": "f3b953474fc44979ad44a69b7bc8e911",
    "kingston nv2": "f3b953474fc44979ad44a69b7bc8e911",
    "crucial p3": "f3b953474fc44979ad44a69b7bc8e911",

    "chieftec proton": "f3b953474fc44979ad44a69b7bc8e911",
    "montech titan": "f3b953474fc44979ad44a69b7bc8e911",
    "super flower leadex": "f3b953474fc44979ad44a69b7bc8e911",
    "deepcool pm": "f3b953474fc44979ad44a69b7bc8e911",
    "be quiet!": "f3b953474fc44979ad44a69b7bc8e911",

    "deepcool cc560": "f3b953474fc44979ad44a69b7bc8e911",
    "deepcool ch560": "f3b953474fc44979ad44a69b7bc8e911",
    "lian li pc-o11": "f3b953474fc44979ad44a69b7bc8e911",
    "nzxt h9": "f3b953474fc44979ad44a69b7bc8e911",
    "phanteks nv5": "f3b953474fc44979ad44a69b7bc8e911",

    "id-cooling frostflow": "f3b953474fc44979ad44a69b7bc8e911",
    "id-cooling se": "f3b953474fc44979ad44a69b7bc8e911",
    "deepcool ak": "f3b953474fc44979ad44a69b7bc8e911",
    "arctic liquid freezer": "f3b953474fc44979ad44a69b7bc8e911",
    "noctua nh-d15": "f3b953474fc44979ad44a69b7bc8e911",

    # ---------- ВЕНТИЛЯТОРЫ ----------
    "arctic p12": "f3b953474fc44979ad44a69b7bc8e911",
    "arctic p14": "f3b953474fc44979ad44a69b7bc8e911",
    "be quiet! pure wings": "f3b953474fc44979ad44a69b7bc8e911",
    "thermalright tl-c12": "f3b953474fc44979ad44a69b7bc8e911",
    "lian li uni fan": "f3b953474fc44979ad44a69b7bc8e911",
}

def get_sketchfab_id(name):
    """
    Возвращает sketchfabId на основе названия детали.
    Сначала пытается найти полное совпадение (регистронезависимо),
    затем частичное (если ключевая фраза входит в название).
    Если ничего не найдено — возвращает заглушку.
    """
    name_lower = name.lower()
    for key, sid in SKETCHFAB_MAPPING.items():
        if key in name_lower:
            return sid
    return "bbb6fd2b16614f319a65af99a4338d77"

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

def calculate_unique_price(category, name, index):
    name_lower = name.lower()
    base_price = 4500
    if category == "cpu":
        if "i9" in name_lower or "ryzen 9" in name_lower or "9950" in name_lower: base_price = 52000
        elif "i7" in name_lower or "ryzen 7" in name_lower or "7800x3d" in name_lower: base_price = 36000
        elif "i5" in name_lower or "ryzen 5" in name_lower or "7500f" in name_lower: base_price = 15000
        elif "ultra 9" in name_lower: base_price = 82000
        else: base_price = 8500
    elif category == "gpu":
        if "4090" in name_lower or "7900 xtx" in name_lower: base_price = 180000
        elif "4080" in name_lower or "4070 ti" in name_lower: base_price = 92000
        elif "4070" in name_lower or "7700" in name_lower: base_price = 62000
        elif "4060 ti" in name_lower: base_price = 44000
        elif "4060" in name_lower or "7600" in name_lower: base_price = 31000
        else: base_price = 16000
    elif category == "motherboard":
        if "z790" in name_lower or "x670" in name_lower or "z890" in name_lower: base_price = 26000
        elif "b760" in name_lower or "b650" in name_lower or "b550" in name_lower: base_price = 12000
        else: base_price = 7000
    elif category == "ram":
        if "64gb" in name_lower: base_price = 21000
        elif "32gb" in name_lower or "ddr5" in name_lower: base_price = 11000
        else: base_price = 4000
    elif category == "storage":
        if "4tb" in name_lower: base_price = 24000
        elif "2tb" in name_lower: base_price = 12500
        elif "1tb" in name_lower: base_price = 7000
        else: base_price = 3200
    elif category == "psu":
        if "1000w" in name_lower or "1200w" in name_lower: base_price = 18000
        elif "850w" in name_lower or "750w" in name_lower: base_price = 10500
        else: base_price = 5000
    elif category == "cooler":
        if "liquid" in name_lower or "360" in name_lower: base_price = 13500
        elif "240" in name_lower: base_price = 8000
        else: base_price = 2800
    elif category == "case":
        if "evo" in name_lower or "aquarium" in name_lower or "glass" in name_lower: base_price = 15000
        else: base_price = 5500
    elif category == "case_fans":
        if "3-pack" in name_lower or "kit" in name_lower: base_price = 3200
        else: base_price = 850

    price_modifier = (index * 350) % int(base_price * 0.15 if base_price * 0.15 > 100 else 500)
    final_price = int(base_price + price_modifier)
    final_price = (final_price // 100) * 100 + 90
    return final_price

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

final_database = {}

for category, items_list in raw_data.items():
    final_database[category] = []
    for index, item_name in enumerate(items_list, start=1):
        encoded_name = urllib.parse.quote_plus(item_name)
        
        sketchfab_id = get_sketchfab_id(item_name)
        
        unique_price = calculate_unique_price(category, item_name, index)
        product = {
            "id": f"{category}_{index:04d}",
            "name": item_name,
            "price_approx": unique_price,
            "sketchfabId": sketchfab_id,
            "links": {
                "yandex": f"https://yandex.ru{encoded_name}",
                "dns": f"https://dns-shop.ru{encoded_name}",
                "megamarket": f"https://megamarket.ru{encoded_name}"
            }
        }
        if category in ["cpu", "motherboard", "cooler"]:
            product["socket"] = detect_socket(item_name)
        final_database[category].append(product)

output_path = os.path.join("dist", "assets", "database.json")
os.makedirs(os.path.dirname(output_path), exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_database, f, ensure_ascii=False, indent=2)

print("\n==================================================")
print("БАЗА ДАННЫХ УСПЕШНО ОБНОВЛЕНА!")
print(f"Файл сохранен в: {output_path}")
print("Проверь, что для нужных деталей подставились реальные sketchfabId.")
print("==================================================")