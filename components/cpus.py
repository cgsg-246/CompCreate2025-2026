# Τΰιλ: components/cpus.py
_brands = {
    "Intel Core": [
        "i3-12100", "i5-12400", "i5-12600", "i7-12700", "i9-12900",
        "i3-13100", "i5-13400", "i5-13500", "i5-13600", "i7-13700", "i9-13900",
        "i5-14400", "i5-14500", "i5-14600", "i7-14700", "i9-14900"
    ],
    "Intel Ultra": ["5-245", "7-265", "9-285"],
    "AMD Ryzen 5": ["1600", "2600", "3600", "4500", "5500", "5600", "7500F", "7600", "8400F", "8600G", "9600X"],
    "AMD Ryzen 7": ["2700X", "3700X", "5700X", "5700X3D", "5800X", "5800X3D", "7700", "7700X", "7800X3D", "8700G", "9700X", "9800X3D"],
    "AMD Ryzen 9": ["3900X", "5900X", "5950X", "7900X", "7900X3D", "7950X", "7950X3D", "9900X", "9950X"]
}
_suffixes = ["", "F", "K", "KF", "X"]

items = []
for brand, models in _brands.items():
    for model in models:
        if "AMD" in brand:
            items.append(f"{brand} {model}")
        else:
            for suf in _suffixes:
                if "Ultra" in brand and suf in ["F", "X"]: continue
                items.append(f"{brand} {model}{suf}".strip())
items = list(set(items))
