# Τΰιλ: components/gpus.py
_chips = [
    "NVIDIA GeForce RTX 5090", "NVIDIA GeForce RTX 5080", "NVIDIA GeForce RTX 5070 Ti", "NVIDIA GeForce RTX 5070",
    "NVIDIA GeForce RTX 4090", "NVIDIA GeForce RTX 4080 Super", "NVIDIA GeForce RTX 4070 Ti Super", "NVIDIA GeForce RTX 4070 Super", 
    "NVIDIA GeForce RTX 4060 Ti 16GB", "NVIDIA GeForce RTX 4060 Ti 8GB", "NVIDIA GeForce RTX 4060",
    "NVIDIA GeForce RTX 3060 12GB", "NVIDIA GeForce RTX 3050 6GB", "NVIDIA GeForce GTX 1660 Super",
    "AMD Radeon RX 7900 XTX", "AMD Radeon RX 7900 GRE", "AMD Radeon RX 7800 XT", "AMD Radeon RX 7700 XT", "AMD Radeon RX 7600 XT", 
    "AMD Radeon RX 6600", "Intel Arc A770", "Intel Arc A750"
]
_vendors = ["ASUS Dual", "ASUS ROG Strix", "MSI Ventus 2X", "MSI Gaming X Slim", "GIGABYTE EAGLE OC", "GIGABYTE AORUS", "Palit Dual", "Palit JetStream", "Sapphire NITRO+", "PowerColor Hellhound"]

items = [f"{chip} {vendor}" for chip in _chips for vendor in _vendors if not ("Intel" in chip and "Sapphire" in vendor)]
