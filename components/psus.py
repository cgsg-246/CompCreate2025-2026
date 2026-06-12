# Τΰιλ: components/psus.py
_brands = ["Deepcool PF", "Deepcool PM", "Deepcool PX", "be quiet! System Power 10", "be quiet! Straight Power 12", "Chieftec Proton", "Montech Century", "Montech Titan Gold", "Super Flower Leadex III", "Corsair RM", "Cougar VTE"]
_wattages = ["400W", "500W", "550W", "600W", "650W", "700W", "750W", "850W", "1000W", "1200W", "1300W"]
_certs = ["Bronze", "Gold", "Gold Modular", "Platinum ATX 3.0", ""]

items = list(set([f"{brand} {watt} {_certs[i % len(_certs)]}".strip() for brand in _brands for i, watt in enumerate(_wattages)]))
