# Τΰιλ: components/cases.py
_lines = ["Deepcool CC560", "Deepcool CH560", "Deepcool MATREXX 55", "Montech AIR 100", "Montech AIR 1000", "Montech KING 95", "LIAN LI PC-O11 Dynamic", "LIAN LI Lancool 216", "NZXT H9 Flow", "Phanteks NV5", "Jonsbo D31 MESH", "Zalman i3"]
_types = ["V2", "ARGB", "Mesh", "Digital", "Elite", "Pro"]
_colors = ["Black", "White", "Snow White", "Mint Green"]

items = [f"{line} {typ} ({col})" for line in _lines for typ in _types for col in _colors]
