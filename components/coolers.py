# Τΰιλ: components/coolers.py
_coolers = ["ID-COOLING SE-214-XT", "ID-COOLING SE-224-XTS", "ID-COOLING SE-207-XT", "Deepcool AK400", "Deepcool AG400", "Deepcool AK620", "Thermalright Peerless Assassin 120", "Noctua NH-D15", "ARCTIC Liquid Freezer III 240", "ARCTIC Liquid Freezer III 360", "Deepcool LT720 360mm", "ID-COOLING FROSTFLOW 240"]
_mods = ["", "ARGB", "Digital", "WH White", "Black Out", "RGB V2"]

items = list(set([f"{col} {mod}".strip() for col in _coolers for mod in _mods]))
