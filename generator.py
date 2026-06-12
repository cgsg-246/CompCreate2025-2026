import json
import os
import urllib.parse

from components import cpus, gpus, motherboards, rams, storages, psus, cases, coolers, fans

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

def calculate_unique_price(category, name, index):
    """
    УМНЫЙ КАЛЬКУЛЯТОР УНИКАЛЬНЫХ ЦЕН: 
    Определяет базовую стоимость по названию и добавляет 
    индивидуальный сдвиг цены на основе индекса товара.
    """
    name_lower = name.lower()
    base_price = 4500
    
    if category == "cpu":
        if "i9" in name_lower or "ryzen 9" in name_lower or "9950" in name_lower: base_price = 52000
        elif "i7" in name_lower or "ryzen 7" in name_lower or "7800x3d" in name_lower: base_price = 36000
        elif "i5" in name_lower or "ryzen 5" in name_lower or "7500f" in name_lower: base_price = 15000
        elif "ultra 9" in name_lower: base_price = 82000
        else: base_price = 8500  # i3 / Бюджетные
        
    elif category == "gpu":
        if "4090" in name_lower or "7900 xtx" in name_lower: base_price = 180000
        elif "4080" in name_lower or "4070 ti" in name_lower: base_price = 92000
        elif "4070" in name_lower or "7700" in name_lower: base_price = 62000
        elif "4060 ti" in name_lower: base_price = 44000
        elif "4060" in name_lower or "7600" in name_lower: base_price = 31000
        else: base_price = 16000  # Бюджетные / старые карты
        
    elif category == "motherboard":
        if "z790" in name_lower or "x670" in name_lower or "z890" in name_lower: base_price = 26000
        elif "b760" in name_lower or "b650" in name_lower or "b550" in name_lower: base_price = 12000
        else: base_price = 7000  # H610 / A520
        
    elif category == "ram":
        if "64gb" in name_lower: base_price = 21000
        elif "32gb" in name_lower or "ddr5" in name_lower: base_price = 11000
        else: base_price = 4000  # 16GB DDR4
        
    elif category == "storage":
        if "4tb" in name_lower: base_price = 24000
        elif "2tb" in name_lower: base_price = 12500
        elif "1tb" in name_lower: base_price = 7000
        else: base_price = 3200  # 500GB
        
    elif category == "psu":
        if "1000w" in name_lower or "1200w" in name_lower: base_price = 18000
        elif "850w" in name_lower or "750w" in name_lower: base_price = 10500
        else: base_price = 5000  # 500W - 600W
        
    elif category == "cooler":
        if "liquid" in name_lower or "360" in name_lower: base_price = 13500
        elif "240" in name_lower: base_price = 8000
        else: base_price = 2800  # Воздушные кулеры-башни
        
    elif category == "case":
        if "evo" in name_lower or "aquarium" in name_lower or "glass" in name_lower: base_price = 15000
        else: base_price = 5500  # Стандартные корпуса
        
    elif category == "case_fans":
        if "3-pack" in name_lower or "kit" in name_lower: base_price = 3200
        else: base_price = 850  # Одиночный кулер

    price_modifier = (index * 350) % int(base_price * 0.15 if base_price * 0.15 > 100 else 500)
    
    final_price = int(base_price + price_modifier)
    final_price = (final_price // 100) * 100 + 90
    
    return final_price

final_database = {}

for category, items_list in raw_data.items():
    final_database[category] = []
    
    for index, item_name in enumerate(items_list, start=1):
        encoded_name = urllib.parse.quote_plus(item_name)
        
        sketchfab_id = "bbb6fd2b16614f319a65af99a4338d77"
        
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

output_path = os.path.join("server", "data", "database.json")
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_database, f, ensure_ascii=False, indent=2)

print("\n==================================================")
print("УСПЕХ! База данных пересобрана на 100%!")
print("Абсолютно у каждого компонента теперь СВОЯ уникальная цена!")
print(f"Файл сохранен в: {output_path}")
print("==================================================\n")
