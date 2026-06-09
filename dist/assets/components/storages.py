# Τΰιλ: components/storages.py
_models = [
    "Samsung 990 PRO M.2 NVMe", "Samsung 980 PRO M.2 NVMe", "Kingston NV2 M.2 NVMe", "Kingston FURY Renegade M.2",
    "ADATA XPG GAMMIX S11 Pro", "ADATA Legend 960 MAX", "Crucial P3 Plus M.2", "Samsung 870 EVO SATA 2.5",
    "Kingston A400 SATA 2.5", "Crucial BX500 SATA", "WD Blue HDD 7200rpm", "Seagate BarraCuda HDD"
]
_capacities = ["240GB", "250GB", "480GB", "500GB", "1TB", "2TB", "4TB", "8TB"]

items = [f"{model} {cap}" for model in _models for cap in _capacities if not ("HDD" in model and "GB" in cap)]
