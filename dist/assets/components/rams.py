# Τΰιλ: components/rams.py
_series = ["Kingston FURY Beast", "Kingston FURY Renegade", "G.Skill TRIDENT Z5 RGB", "G.Skill RIPJAWS V", "Corsair Vengeance LPX", "ADATA XPG Lancer RGB", "ADATA XPG Gammix D20", "Team Group T-Force Delta"]
_specs = [
    "DDR4 8GB 3200MHz", "DDR4 16GB (2x8GB) 3200MHz", "DDR4 32GB (2x16GB) 3200MHz", "DDR4 32GB (2x16GB) 3600MHz", "DDR4 64GB (2x32GB) 3600MHz",
    "DDR5 16GB 4800MHz", "DDR5 32GB (2x16GB) 5600MHz", "DDR5 32GB (2x16GB) 6000MHz", "DDR5 32GB (2x16GB) 6400MHz", "DDR5 48GB (2x24GB) 7200MHz", "DDR5 64GB (2x32GB) 6000MHz", "DDR5 96GB (2x48GB) 8000MHz"
]

items = [f"{ser} {spec}" for ser in _series for spec in _specs if not ("DDR5" in spec and "RIPJAWS" in ser)]
