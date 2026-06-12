# Файл: components/motherboards.py
_chipsets = ["Z890", "Z790", "B760", "H610", "X670E", "X670", "B650E", "B650", "A620", "B550", "B450", "X570"]
_brands = ["ASUS PRIME", "ASUS TUF GAMING", "ASUS ROG STRIX", "GIGABYTE AORUS ELITE", "GIGABYTE DS3H", "GIGABYTE GAMING X", "MSI PRO", "MSI MAG TOMAHAWK", "ASRock Steel Legend", "ASRock Pro RS"]
_features = ["DDR4", "DDR5", "WIFI", "DDR4 WIFI", "DDR5 WIFI"]

items = []
for brand in _brands:
    for chip in _chipsets:
        for feat in _features:
            if "Z890" in chip and "DDR4" in feat: continue # Z890 только DDR5
            items.append(f"{brand} {chip}-{feat}".strip())
