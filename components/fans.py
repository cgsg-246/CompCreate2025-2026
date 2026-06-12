# ����: components/fans.py
_brands = ["Arctic P12", "Arctic F12", "Arctic P14", "Be Quiet! Pure Wings 2", "Be Quiet! Silent Wings 4", "ID-COOLING TF-12025", "Thermalright TL-C12C", "LIAN LI Uni Fan SL-Infinity"]
_types = ["PWM", "PWM PST", "ARGB", "RGB", "PWM White", "Black"]
_packs = ["120mm", "140mm", "120mm (Комплект 3 шт)", "140mm (Комплект 3 шт)", "Value Pack (5 шт)"]

items = [f"{brand} {typ} {pack}" for brand in _brands for typ in _types for pack in _packs if not ("P14" in brand and "120mm" in pack)]
