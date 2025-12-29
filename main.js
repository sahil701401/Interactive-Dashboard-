let allData = [];
let filteredData = [];
let expansionCount = 0;
let newlyAdded = [];
let sortColumn = null;
let sortAsc = true;

// Pagination
let currentPage = 1;
const pageSize = 10;

// Currency / locale (user selectable)
const LOCALES = {
    'en-IN': { currency: 'INR', label: 'INR (₹)' },
    'en-US': { currency: 'USD', label: 'USD ($)' },
    'en-GB': { currency: 'GBP', label: 'GBP (£)' }
};
let currentLocale = window.localStorage.getItem('dashboardLocale') || 'en-IN';
let currencyFormatter = new Intl.NumberFormat(currentLocale, { style: 'currency', currency: LOCALES[currentLocale].currency, maximumFractionDigits: 0 });

function setLocale(locale) {
    if (!LOCALES[locale]) return;
    currentLocale = locale;
    window.localStorage.setItem('dashboardLocale', locale);
    currencyFormatter = new Intl.NumberFormat(currentLocale, { style: 'currency', currency: LOCALES[currentLocale].currency, maximumFractionDigits: 0 });
    // re-render UI pieces that rely on currency
    updateSummary();
    updateTable();
    updateChart();
}

// No auth required in this prototype

// Simple banner logging (no server health checks in prototype)
function showBanner(message, level = 'warn') {
    // transient banner - for now log and optionally show small toast later
    console.log('BANNER', level, message);
}

function hideBanner() {}

function renderPagination() {
    const total = filteredData.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const container = document.getElementById('paginationControls');
    container.innerHTML = '';
    const prev = document.createElement('button');
    prev.textContent = 'Prev';
    prev.disabled = currentPage <= 1;
    prev.addEventListener('click', () => {
        currentPage = Math.max(1, currentPage - 1);
        updateTable();
    });
    const info = document.createElement('div');
    info.textContent = `Page ${currentPage} / ${pages}`;
    const next = document.createElement('button');
    next.textContent = 'Next';
    next.disabled = currentPage >= pages;
    next.addEventListener('click', () => {
        currentPage = Math.min(pages, currentPage + 1);
        updateTable();
    });
    container.appendChild(prev);
    container.appendChild(info);
    container.appendChild(next);
}

// ensure filters reset page
function resetPage() { currentPage = 1; }

// Fetch data from backend (with fallback sample data)
async function fetchData() {
    const initialData = [
        { Product: 'Smartphone X', Sales: 150000, Category: 'Electronics', Revenue: 75000000, Profit: 15000000 },
        { Product: 'Wireless Earbuds Pro', Sales: 120000, Category: 'Electronics', Revenue: 9600000, Profit: 1920000 },
        { Product: 'Smartwatch S', Sales: 90000, Category: 'Electronics', Revenue: 13500000, Profit: 2700000 },
        { Product: 'Laptop Lite', Sales: 40000, Category: 'Electronics', Revenue: 20000000, Profit: 4000000 },
        { Product: 'Bluetooth Speaker', Sales: 80000, Category: 'Electronics', Revenue: 6400000, Profit: 1280000 },
        { Product: 'Portable Charger', Sales: 110000, Category: 'Electronics', Revenue: 2200000, Profit: 440000 },
        { Product: 'Wireless Mouse', Sales: 90000, Category: 'Electronics', Revenue: 810000, Profit: 162000 },
        { Product: 'USB-C Hub', Sales: 70000, Category: 'Electronics', Revenue: 1050000, Profit: 210000 },
        { Product: 'Noise-Cancel Headset', Sales: 45000, Category: 'Electronics', Revenue: 6750000, Profit: 1350000 },
        { Product: 'Smart Home Camera', Sales: 60000, Category: 'Electronics', Revenue: 9000000, Profit: 1800000 },
        { Product: 'Organic Toothpaste', Sales: 500000, Category: 'Personal Care', Revenue: 2000000, Profit: 400000 },
        { Product: 'Moisturizing Cream', Sales: 200000, Category: 'Personal Care', Revenue: 8000000, Profit: 1600000 },
        { Product: 'Shampoo Plus', Sales: 350000, Category: 'Personal Care', Revenue: 3500000, Profit: 700000 },
        { Product: 'Hand Sanitizer', Sales: 600000, Category: 'Personal Care', Revenue: 1800000, Profit: 360000 },
        { Product: 'Facial Mask Pack', Sales: 250000, Category: 'Personal Care', Revenue: 2500000, Profit: 500000 },
        { Product: 'Sunscreen SPF50', Sales: 120000, Category: 'Personal Care', Revenue: 600000, Profit: 120000 },
        { Product: 'Lip Balm', Sales: 300000, Category: 'Personal Care', Revenue: 300000, Profit: 60000 },
        { Product: 'Body Lotion', Sales: 180000, Category: 'Personal Care', Revenue: 540000, Profit: 108000 },
        { Product: 'Deodorant Stick', Sales: 220000, Category: 'Personal Care', Revenue: 660000, Profit: 132000 },
        { Product: 'Hair Serum', Sales: 90000, Category: 'Personal Care', Revenue: 270000, Profit: 54000 },
        { Product: 'Spiral Notebook', Sales: 350000, Category: 'Stationery', Revenue: 1050000, Profit: 210000 },
        { Product: 'Ballpoint Pens Pack', Sales: 420000, Category: 'Stationery', Revenue: 840000, Profit: 168000 },
        { Product: 'Highlighter Set', Sales: 150000, Category: 'Stationery', Revenue: 450000, Profit: 90000 },
        { Product: 'Desk Planner', Sales: 80000, Category: 'Stationery', Revenue: 400000, Profit: 80000 },
        { Product: 'Sticky Notes Pack', Sales: 300000, Category: 'Stationery', Revenue: 300000, Profit: 60000 },
        { Product: 'Sketchbook A4', Sales: 90000, Category: 'Stationery', Revenue: 270000, Profit: 54000 },
        { Product: 'Mechanical Pencil', Sales: 70000, Category: 'Stationery', Revenue: 210000, Profit: 42000 },
        { Product: 'Eraser Pack', Sales: 120000, Category: 'Stationery', Revenue: 120000, Profit: 24000 },
        { Product: 'Ruler Set', Sales: 50000, Category: 'Stationery', Revenue: 50000, Profit: 10000 },
        { Product: 'Paper Clips Box', Sales: 40000, Category: 'Stationery', Revenue: 40000, Profit: 8000 },
        { Product: 'Pure Cooking Oil', Sales: 420000, Category: 'Grocery', Revenue: 6300000, Profit: 315000 },
        { Product: 'Whole Wheat Bread', Sales: 500000, Category: 'Grocery', Revenue: 1250000, Profit: 31250 },
        { Product: 'Free Range Eggs', Sales: 240000, Category: 'Grocery', Revenue: 720000, Profit: 36000 },
        { Product: 'Fresh Milk 1L', Sales: 600000, Category: 'Grocery', Revenue: 1200000, Profit: 60000 },
        { Product: 'Rice 5kg Bag', Sales: 150000, Category: 'Grocery', Revenue: 450000, Profit: 22500 },
        { Product: 'Pasta 500g', Sales: 200000, Category: 'Grocery', Revenue: 200000, Profit: 10000 },
        { Product: 'Canned Beans', Sales: 80000, Category: 'Grocery', Revenue: 80000, Profit: 4000 },
        { Product: 'Tomato Sauce', Sales: 110000, Category: 'Grocery', Revenue: 110000, Profit: 5500 },
        { Product: 'Cereal Box', Sales: 90000, Category: 'Grocery', Revenue: 270000, Profit: 13500 },
        { Product: 'Olive Oil 500ml', Sales: 70000, Category: 'Grocery', Revenue: 1400000, Profit: 70000 },
        { Product: 'Laundry Detergent', Sales: 280000, Category: 'Household', Revenue: 4200000, Profit: 420000 },
        { Product: 'Multi-surface Cleaner', Sales: 320000, Category: 'Household', Revenue: 1600000, Profit: 160000 },
        { Product: 'Toilet Paper Pack', Sales: 450000, Category: 'Household', Revenue: 2700000, Profit: 270000 },
        { Product: 'Dishwashing Liquid', Sales: 400000, Category: 'Household', Revenue: 1200000, Profit: 120000 },
        { Product: 'Fabric Softener', Sales: 200000, Category: 'Household', Revenue: 800000, Profit: 80000 },
        { Product: 'Air Freshener', Sales: 90000, Category: 'Household', Revenue: 270000, Profit: 27000 },
        { Product: 'Garbage Bags', Sales: 60000, Category: 'Household', Revenue: 120000, Profit: 12000 },
        { Product: 'Dish Sponges Pack', Sales: 50000, Category: 'Household', Revenue: 25000, Profit: 6250 },
        { Product: 'Light Bulbs 2-pack', Sales: 40000, Category: 'Household', Revenue: 200000, Profit: 20000 },
        { Product: 'Broom & Dustpan', Sales: 15000, Category: 'Household', Revenue: 75000, Profit: 11250 }
    ];

    try {
        const response = await fetch('http://localhost:5000/api/data?limit=1000');
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.items) && data.items.length > 0) {
                allData = data.items;
            } else if (Array.isArray(data) && data.length > 0) {
                allData = data;
            } else {
                allData = initialData;
            }
            showBanner('Data loaded from server', 'ok');
            setTimeout(() => hideBanner(), 1500);
        } else {
            showBanner('Server returned error, using sample data', 'warn');
            allData = initialData;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        showBanner('Unable to fetch data from server: ' + (error.message || error), 'error');
        allData = initialData;
    }

    filteredData = [...allData];
    populateFilters();
    updateChart();
    updateTable();
    updateSummary();
    updateTimestamp();
}

// Populate category filter
function populateFilters() {
    const categories = [...new Set(allData.map(d => d.Category))];
    const filterSelect = document.getElementById('categoryFilter');
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterSelect.appendChild(option);
    });
}

// Filter data based on selection and search query, then apply sort
function filterData() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const query = document.getElementById('searchInput').value.trim().toLowerCase();

    if (selectedCategory === 'all') {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(d => d.Category === selectedCategory);
    }

    if (query) {
        filteredData = filteredData.filter(d =>
            (d.Product && d.Product.toString().toLowerCase().includes(query)) ||
            (d.Category && d.Category.toString().toLowerCase().includes(query)) ||
            (d.Sales && d.Sales.toString().includes(query)) ||
            (d.Revenue && d.Revenue.toString().includes(query)) ||
            (d.Profit && d.Profit.toString().includes(query))
        );
    }

    // Loss-only toggle
    try {
        const lossOnly = document.getElementById('lossOnlyToggle');
        const enabled = lossOnly && lossOnly.checked;
        if (enabled) {
            filteredData = filteredData.filter(d => Number(d.Profit) < 0);
        }
        // persist choice
        if (lossOnly) window.localStorage.setItem('lossOnly', enabled ? 'true' : 'false');
    } catch (e) { /* ignore */ }


    if (sortColumn) {
        filteredData.sort((a, b) => {
            let av, bv;
            if (sortColumn === 'Loss') {
                av = Number(a.Profit) < 0 ? Math.abs(Number(a.Profit) || 0) : 0;
                bv = Number(b.Profit) < 0 ? Math.abs(Number(b.Profit) || 0) : 0;
            } else {
                av = a[sortColumn];
                bv = b[sortColumn];
            }
            if (typeof av === 'string') {
                av = av.toLowerCase();
                bv = bv.toLowerCase();
            }
            if (av < bv) return sortAsc ? -1 : 1;
            if (av > bv) return sortAsc ? 1 : -1;
            return 0;
        });
    }

    resetPage();
    updateChart();
    updateTable();
}

// Add more products (adds 4 new products per category)
function addMoreProducts() {
    const categories = [...new Set(allData.map(d => d.Category))];
    const avgPriceByCategory = {
        'Electronics': 300,
        'Personal Care': 8,
        'Stationery': 3,
        'Grocery': 5,
        'Household': 6
    };
    const avgMarginByCategory = {
        'Electronics': 0.20,
        'Personal Care': 0.25,
        'Stationery': 0.18,
        'Grocery': 0.05,
        'Household': 0.12
    };
    expansionCount += 1;
    categories.forEach(category => {
        for (let i = 1; i <= 4; i++) {
            const suffix = expansionCount * 4 + i;
            const name = `${category} Extra ${suffix}`;
            const sales = Math.floor(Math.random() * (200000 - 20000 + 1)) + 20000;
            const revenue = sales * (avgPriceByCategory[category] || 10);
            const profit = Math.round(revenue * (avgMarginByCategory[category] || 0.1));
            const newItem = { Product: name, Sales: sales, Category: category, Revenue: revenue, Profit: profit };
            allData.push(newItem);
            newlyAdded.push(newItem);
        }
    });
    const selectedCategory = document.getElementById('categoryFilter').value;
    if (selectedCategory === 'all') {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(d => d.Category === selectedCategory);
    }
    populateFilters();
    updateChart();
    updateTable();
}

// Update D3.js bar chart
function updateChart() {
    const svg = d3.select('#salesChart');
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 80, left: 40 };
    const width = svg.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(filteredData.map(d => d.Product))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.Sales)])
        .nice()
        .range([height, 0]);

    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-0.6em')
        .attr('dy', '0.15em')
        .attr('transform', 'rotate(-45)');

    g.append('g')
        .call(d3.axisLeft(y));

    const tooltip = d3.select('#tooltip');

    const bars = g.selectAll('.bar')
        .data(filteredData)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.Product))
        .attr('y', d => y(d.Sales))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.Sales))
        .attr('fill', 'steelblue')
        .on('mouseover', function(event, d) {
            d3.select(this).attr('fill', '#1d4ed8');
            tooltip.style('display', 'block').html(`<strong>${d.Product}</strong><br/>Sales: ${d.Sales.toLocaleString()}<br/>Revenue: ${currencyFormatter.format(Math.round(d.Revenue))}`);
        })
        .on('mousemove', function(event) {
            tooltip.style('left', (event.pageX + 12) + 'px').style('top', (event.pageY + 12) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('fill', 'steelblue');
            tooltip.style('display', 'none');
        });

    // add small red badge to loss-making products
    g.selectAll('.loss-badge').remove();
    g.selectAll('.loss-badge')
        .data(filteredData.filter(d => Number(d.Profit) < 0))
        .enter().append('circle')
        .attr('class', 'loss-badge loss-badge-dot')
        .attr('cx', d => x(d.Product) + x.bandwidth() / 2)
        .attr('cy', d => y(d.Sales) - 8)
        .attr('r', 6)
        .attr('fill', '#ef4444')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

}

// Update data table
function updateTable() {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';
    const numberFormatter = new Intl.NumberFormat();
    // top-level currencyFormatter (INR) is used for currency formatting

    const headers = Array.from(document.querySelectorAll('#dataTable thead th'));
    const columns = [null, 'Product', 'Sales', 'Category', 'Revenue', 'Profit', 'Loss'];
    headers.forEach((th, i) => {
        const col = columns[i] || '';
        th.innerHTML = `${col}${col && sortColumn === col ? (sortAsc ? ' ▲' : ' ▼') : ''}`;
    });

    const start = (currentPage - 1) * pageSize;
    const pageItems = filteredData.slice(start, start + pageSize);

    pageItems.forEach(row => {
        const isNew = newlyAdded.includes(row);
        const tr = document.createElement('tr');

        // expand toggle cell
        const tdToggle = document.createElement('td');
        const btn = document.createElement('button');
        btn.className = 'expand-btn';
        btn.textContent = '+';
        btn.addEventListener('click', () => {
            const next = tr.nextElementSibling;
            if (next && next.classList.contains('detail-row')) {
                next.remove();
                btn.textContent = '+';
            } else {
                const detail = document.createElement('tr');
                detail.className = 'detail-row';
                const td = document.createElement('td');
                td.colSpan = 7;
                td.innerHTML = `<div style="padding:10px 6px;">Category: <strong>${row.Category}</strong> &nbsp; • &nbsp; Sales: ${row.Sales.toLocaleString()} &nbsp; • &nbsp; Revenue: ${currencyFormatter.format(Math.round(row.Revenue))} &nbsp; • &nbsp; Profit: ${typeof row.Profit !== 'undefined' && row.Profit !== null ? currencyFormatter.format(Math.round(row.Profit)) : '-'}</div>`;
                detail.appendChild(td);
                tr.after(detail);
                btn.textContent = '−';
            }
        });
        tdToggle.appendChild(btn);

        const tdName = document.createElement('td');
        tdName.innerHTML = `${row.Product}${isNew ? ' <strong>(new)</strong>' : ''}`;
        const tdSales = document.createElement('td');
        tdSales.textContent = `${numberFormatter.format(row.Sales)} units/yr`;
        const tdCat = document.createElement('td');
        tdCat.textContent = row.Category;
        const tdRev = document.createElement('td');
        tdRev.textContent = currencyFormatter.format(row.Revenue);
        const tdProfit = document.createElement('td');
        tdProfit.textContent = (typeof row.Profit !== 'undefined' && row.Profit !== null) ? currencyFormatter.format(row.Profit) : '-';
        const lossAmount = Number(row.Profit) < 0 ? Math.abs(Number(row.Profit) || 0) : 0;
        const tdLoss = document.createElement('td');
        tdLoss.textContent = lossAmount ? currencyFormatter.format(lossAmount) : '-';
        if (lossAmount) tdLoss.className = 'loss-value';

        if (lossAmount) tr.classList.add('row-loss');

        tr.appendChild(tdToggle);
        tr.appendChild(tdName);
        tr.appendChild(tdSales);
        tr.appendChild(tdCat);
        tr.appendChild(tdRev);
        tr.appendChild(tdProfit);
        tr.appendChild(tdLoss);

        tbody.appendChild(tr);
    });

    renderPagination();
}

// Setup table sorting
function setupTableSorting() {
    const headers = Array.from(document.querySelectorAll('#dataTable thead th'));
    const columns = [null, 'Product', 'Sales', 'Category', 'Revenue', 'Profit', 'Loss'];
    headers.forEach((th, index) => {
        if (index === 0) return; // skip expand column
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const col = columns[index];
            if (sortColumn === col) {
                sortAsc = !sortAsc;
            } else {
                sortColumn = col;
                sortAsc = true;
            }
            filterData();
        });
    });
}

// Export filtered data to CSV
function exportCsv() {
    if (!filteredData || filteredData.length === 0) {
        alert('No data to export');
        return;
    }
    const headers = ['Product', 'Sales', 'Category', 'Revenue', 'Profit', 'Loss'];
    const rows = filteredData.map(r => {
        const loss = Number(r.Profit) < 0 ? Math.abs(Number(r.Profit) || 0) : 0;
        const formatted = exportFormattedEl && exportFormattedEl.checked;
        const rowObj = {
            Product: r.Product,
            Sales: r.Sales,
            Category: r.Category,
            Revenue: formatted ? currencyFormatter.format(Math.round(r.Revenue)) : (r.Revenue || ''),
            Profit: formatted ? (typeof r.Profit !== 'undefined' && r.Profit !== null ? currencyFormatter.format(Math.round(r.Profit)) : '') : (r.Profit || ''),
            Loss: formatted ? (loss ? currencyFormatter.format(loss) : '') : (loss || '')
        };
        return headers.map(h => `"${(rowObj[h] ?? '').toString().replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-assessment-data.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function updateTimestamp() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    el.textContent = new Date().toLocaleString();
    // restart animation
    el.classList.remove('flash');
    // force reflow
    void el.offsetWidth;
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 700);
}

function updateSummary() {
    const elProducts = document.getElementById('cardProducts');
    const elSales = document.getElementById('cardSales');
    const elRevenue = document.getElementById('cardRevenue');
    const elLosses = document.getElementById('cardLosses');
    const totalProducts = filteredData.length;
    const totalSales = filteredData.reduce((s, d) => s + (Number(d.Sales) || 0), 0);
    const totalRevenue = filteredData.reduce((s, d) => s + (Number(d.Revenue) || 0), 0);
    const losses = filteredData.filter(d => Number(d.Profit) < 0).map(d => Math.abs(Number(d.Profit) || 0));
    const totalLoss = losses.reduce((s, v) => s + v, 0);

    if (elProducts) elProducts.textContent = totalProducts;
    if (elSales) elSales.textContent = totalSales.toLocaleString();
    if (elRevenue) elRevenue.textContent = currencyFormatter.format(Math.round(totalRevenue));
    if (elLosses) elLosses.textContent = totalLoss > 0 ? currencyFormatter.format(Math.round(totalLoss)) : '—';

    // Update loss table if visible
    renderLossTable();
}

// Render the loss-making products table
function renderLossTable() {
    const tbody = document.querySelector('#lossTable tbody');
    if (!tbody) return;
    const losses = filteredData
        .filter(d => Number(d.Profit) < 0)
        .map(d => ({...d, loss: Math.abs(Number(d.Profit) || 0) }))
        .sort((a, b) => b.loss - a.loss);
    tbody.innerHTML = '';
    if (losses.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="3" style="padding:8px">No products with losses in the current filter.</td>`;
        tbody.appendChild(tr);
        return;
    }
    losses.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:8px">${r.Product}</td>
            <td style="padding:8px">${r.Category || ''}</td>
            <td style="padding:8px;text-align:right" class="loss-value">${currencyFormatter.format(r.loss)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Toggle loss list panel
function toggleLossPanel() {
    const panel = document.getElementById('lossSection');
    if (!panel) return;
    const isOpen = panel.style.display !== 'none';
    panel.style.display = isOpen ? 'none' : 'block';
    panel.setAttribute('aria-hidden', isOpen.toString());
    const card = document.getElementById('lossCard');
    if (card) card.setAttribute('aria-pressed', (!isOpen).toString());
    if (!isOpen) renderLossTable();
}

// Event listeners
const categoryFilterEl = document.getElementById('categoryFilter');
if (categoryFilterEl) categoryFilterEl.addEventListener('change', filterData);
const searchInputEl = document.getElementById('searchInput');
if (searchInputEl) searchInputEl.addEventListener('input', filterData);
const addMoreEl = document.getElementById('addMoreBtn');
if (addMoreEl) addMoreEl.addEventListener('click', addMoreProducts);
const exportEl = document.getElementById('exportCsvBtn');
if (exportEl) exportEl.addEventListener('click', exportCsv);
const refreshEl = document.getElementById('refreshBtn');
if (refreshEl) refreshEl.addEventListener('click', () => fetchData());

// Loss only toggle wiring
const lossOnlyEl = document.getElementById('lossOnlyToggle');
if (lossOnlyEl) lossOnlyEl.addEventListener('change', () => filterData());

// Export formatted checkbox
const exportFormattedEl = document.getElementById('exportFormatted');

// Locale select wiring
const localeSelect = document.getElementById('localeSelect');
if (localeSelect) {
    // set initial
    try { localeSelect.value = currentLocale; } catch (e) {}
    localeSelect.addEventListener('change', (e) => setLocale(e.target.value));
}

// Share view button
const shareBtn = document.getElementById('shareViewBtn');
if (shareBtn) shareBtn.addEventListener('click', shareView);

const lossCardEl = document.getElementById('lossCard');
if (lossCardEl) {
    lossCardEl.addEventListener('click', toggleLossPanel);
    lossCardEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleLossPanel();
        }
    });
}

// If user toggled loss-only before, restore
if (lossOnlyEl && window.localStorage.getItem('lossOnly') === 'true') {
    lossOnlyEl.checked = true;
}

// helper: share view
function shareView() {
    const params = new URLSearchParams();
    const cat = document.getElementById('categoryFilter').value;
    const q = (document.getElementById('searchInput').value || '').trim();
    if (cat && cat !== 'all') params.set('category', cat);
    if (q) params.set('q', q);
    if (lossOnlyEl && lossOnlyEl.checked) params.set('lossOnly', '1');
    params.set('locale', currentLocale);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => showBanner('Share link copied to clipboard', 'ok')).catch(() => showBanner('Unable to copy link', 'warn'));
    } else {
        showBanner(url, 'info');
    }
}


// keyboard pagination
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentPage = Math.max(1, currentPage - 1);
        updateTable();
    }
    if (e.key === 'ArrowRight') {
        const pages = Math.max(1, Math.ceil(filteredData.length / pageSize));
        currentPage = Math.min(pages, currentPage + 1);
        updateTable();
    }
});

// Initialize
setupTableSorting();
fetchData();