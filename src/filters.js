export function filterAndSortProducts(itemsList, query, maxPrice, sortType) {
    let filtered = itemsList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase().trim());
        const itemPrice = item.price_approx || 0;
        const matchesPrice = itemPrice <= maxPrice;

        return matchesSearch && matchesPrice;
    });

    if (sortType === "price_asc") {
        filtered.sort((a, b) => (a.price_approx || 0) - (b.price_approx || 0));
    } else if (sortType === "price_desc") {
        filtered.sort((a, b) => (b.price_approx || 0) - (a.price_approx || 0));
    }

    return filtered;
}
