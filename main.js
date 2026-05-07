// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let allProducts = [];
let allCategories = [];
let cart = [];

// ===== ЗАГРУЗКА ДАННЫХ ИЗ XML (ОСНОВНОЙ ИСТОЧНИК) =====
async function loadDataFromXML() {
    try {
        const response = await fetch('xml/products.xml');
        if (!response.ok) throw new Error('XML не загружен');
        
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
        
        // Проверка на ошибку парсинга
        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('Ошибка парсинга XML');
        }
        
        // Парсим товары
        const productNodes = xmlDoc.querySelectorAll('product');
        if (productNodes.length === 0) throw new Error('Нет товаров в XML');
        
        const products = [];
        productNodes.forEach(node => {
            // Парсим характеристики
            const specs = [];
            node.querySelectorAll('spec').forEach(spec => {
                specs.push({
                    name: spec.getAttribute('name'),
                    value: spec.textContent
                });
            });
            
            products.push({
                id: node.getAttribute('id'),
                category: node.getAttribute('category'),
                subcategory: node.getAttribute('subcategory'),
                featured: node.getAttribute('featured') === 'true',
                name: node.querySelector('name')?.textContent || '',
                type: node.querySelector('type')?.textContent || '',
                price: parseFloat(node.querySelector('price')?.textContent || 0),
                currency: node.querySelector('currency')?.textContent || 'BYN',
                description: node.querySelector('description')?.textContent || '',
                image: node.querySelector('image')?.textContent || '',
                color: node.querySelector('color')?.textContent || '#c47a8a',
                specs: specs
            });
        });
        
        // Парсим категории
        const categoryNodes = xmlDoc.querySelectorAll('category');
        const categories = [];
        categoryNodes.forEach(node => {
            const subs = [];
            node.querySelectorAll('subcategory').forEach(sub => {
                subs.push({
                    id: sub.getAttribute('id'),
                    name: sub.getAttribute('name')
                });
            });
            categories.push({
                id: node.getAttribute('id'),
                name: node.getAttribute('name'),
                subs: subs
            });
        });
        
        allProducts = products;
        allCategories = categories;
        
        console.log('Данные успешно загружены из XML');
        
    } catch (error) {
        console.error('ОШИБКА ЗАГРУЗКИ XML:', error.message);
        // Показываем сообщение об ошибке на странице
        showErrorMessage('Не удалось загрузить данные из XML. Проверьте файл xml/products.xml');
    }
}

// ===== ПОКАЗ ОШИБКИ НА СТРАНИЦЕ =====
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.background = '#e05151';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '20px 30px';
    errorDiv.style.borderRadius = '10px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.fontSize = '16px';
    errorDiv.innerHTML = `
        <strong>Ошибка загрузки данных</strong><br>
        ${message}<br>
        <small style="opacity:0.8">Убедитесь, что файл products.xml существует в папке xml/</small>
    `;
    document.body.appendChild(errorDiv);
}

// ===== РАБОТА С КОРЗИНОЙ =====
function loadCart() {
    const saved = localStorage.getItem('softbloomy_cart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartCount();
}

function saveCart() {
    localStorage.setItem('softbloomy_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId) {
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id: productId, qty: 1 });
    }
    saveCart();
    showToast('Товар добавлен в корзину');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
}

function updateQty(productId, newQty) {
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.qty = newQty;
        saveCart();
    }
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        const product = allProducts.find(p => p.id === item.id);
        return sum + (product ? product.price * item.qty : 0);
    }, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartCount() {
    const badge = document.querySelector('.cart-count');
    if (badge) badge.textContent = getCartCount();
}

// ===== УВЕДОМЛЕНИЯ =====
let toastTimeout = null;

function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== ШАПКА + БУРГЕР =====
function initHeader() {
    const burger = document.querySelector('.burger');
    const mobileMenu = document.querySelector('.mobile-menu');
    if (burger && mobileMenu) {
        burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    }
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// ===== СОЗДАНИЕ КАРТОЧКИ ТОВАРА =====
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imgPath = product.image || 'assets/img/placeholder.jpg';
    const priceText = product.price.toFixed(2).replace('.', ',') + ' ' + product.currency;
    
    card.innerHTML = `
        <div class="product-img">
            <img src="${imgPath}" alt="${product.name}" onerror="this.src='assets/img/placeholder.jpg'">
        </div>
        <div class="product-info">
            <div class="product-type">${product.type}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${priceText}</div>
            <button class="btn-add" data-id="${product.id}">В корзину</button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-add')) {
            window.location.href = `product.html?id=${product.id}`;
        }
    });
    
    card.querySelector('.btn-add').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product.id);
    });
    
    return card;
}

// ===== ГЛАВНАЯ СТРАНИЦА =====
async function initHome() {
    await loadDataFromXML();
    const grid = document.getElementById('featured-grid');
    if (grid && allProducts.length > 0) {
        const featured = allProducts.filter(p => p.featured === true);
        featured.forEach(product => grid.appendChild(createProductCard(product)));
    }
}

// ===== СТРАНИЦА КАТАЛОГА =====
async function initCatalog() {
    await loadDataFromXML();
    
    const grid = document.getElementById('catalog-grid');
    const sidebarDiv = document.getElementById('sidebar-categories');
    
    if (sidebarDiv && allCategories.length) {
        sidebarDiv.innerHTML = '';
        allCategories.forEach(cat => {
            const catDiv = document.createElement('div');
            catDiv.className = 'category';
            
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.innerHTML = cat.name + ' <span>▼</span>';
            
            const subDiv = document.createElement('div');
            subDiv.className = 'subcats';
            
            cat.subs.forEach(sub => {
                const link = document.createElement('a');
                link.href = '#';
                link.textContent = sub.name;
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filtered = allProducts.filter(p => p.subcategory === sub.id);
                    renderProducts(filtered);
                    document.querySelectorAll('.subcats a').forEach(a => a.classList.remove('active'));
                    link.classList.add('active');
                });
                subDiv.appendChild(link);
            });
            
            btn.addEventListener('click', () => {
                btn.classList.toggle('open');
                subDiv.classList.toggle('open');
            });
            
            catDiv.appendChild(btn);
            catDiv.appendChild(subDiv);
            sidebarDiv.appendChild(catDiv);
        });
    }
    
    function renderProducts(products) {
        if (!grid) return;
        grid.innerHTML = '';
        if (products.length === 0) {
            grid.innerHTML = '<p style="text-align:center;padding:40px;">Товары не найдены</p>';
            return;
        }
        products.forEach(product => grid.appendChild(createProductCard(product)));
    }
    
    if (allProducts.length > 0) {
        renderProducts(allProducts);
    }
}

// ===== СТРАНИЦА ТОВАРА =====
async function initProduct() {
    await loadDataFromXML();
    
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) return;
    
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = '<a href="index.html">Главная</a> / <a href="catalog.html">Каталог</a> / ' + product.name;
    }
    
    const typeEl = document.querySelector('.product-type');
    const nameEl = document.querySelector('.product-name');
    const priceEl = document.querySelector('.product-price');
    
    if (typeEl) typeEl.textContent = product.type;
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = product.price.toFixed(2).replace('.', ',') + ' ' + product.currency;
    
    const productImg = document.getElementById('product-main-img');
    if (productImg) {
        productImg.src = product.image;
        productImg.alt = product.name;
    }
    
    const specsBody = document.getElementById('specs-body');
    if (specsBody && product.specs) {
        specsBody.innerHTML = '';
        product.specs.forEach(spec => {
            const row = document.createElement('tr');
            row.innerHTML = '<td>' + spec.name + '</td><td>' + spec.value + '</td>';
            specsBody.appendChild(row);
        });
    }
    
    const addBtn = document.querySelector('.btn-primary');
    if (addBtn) {
        addBtn.addEventListener('click', () => addToCart(product.id));
    }
    
    document.title = product.name + ' — softbloomy';
}

// ===== СТРАНИЦА КОРЗИНЫ =====
async function initCart() {
    await loadDataFromXML();
    loadCart();
    
    const cartItemsDiv = document.getElementById('cart-items');
    const emptyDiv = document.getElementById('cart-empty');
    const cartListDiv = document.getElementById('cart-list');
    const summaryTotal = document.getElementById('summary-total');
    const cartCountLabel = document.getElementById('cart-count-label');
    
    const customerName = document.getElementById('customer-name');
    const citySelect = document.getElementById('city-select');
    const confirmCityBtn = document.getElementById('confirm-city-btn');
    const selectedCityDisplay = document.getElementById('selected-city-display');
    const deliveryAddress = document.getElementById('delivery-address');
    const customerPhone = document.getElementById('customer-phone');
    
    const savedOrder = localStorage.getItem('softbloomy_last_order');
    if (savedOrder) {
        const order = JSON.parse(savedOrder);
        if (customerName) customerName.value = order.name || '';
        if (citySelect) citySelect.value = order.city || '';
        if (deliveryAddress) deliveryAddress.value = order.address || '';
        if (customerPhone) customerPhone.value = order.phone || '';
        if (order.city && selectedCityDisplay) {
            selectedCityDisplay.textContent = 'Выбран город: ' + order.city;
            selectedCityDisplay.style.display = 'block';
            if (citySelect) citySelect.style.display = 'none';
            if (confirmCityBtn) confirmCityBtn.style.display = 'none';
        }
    }
    
    if (confirmCityBtn && citySelect && selectedCityDisplay) {
        confirmCityBtn.addEventListener('click', () => {
            const selectedCity = citySelect.value;
            if (selectedCity) {
                selectedCityDisplay.textContent = 'Выбран город: ' + selectedCity;
                selectedCityDisplay.style.display = 'block';
                citySelect.style.display = 'none';
                confirmCityBtn.style.display = 'none';
            } else {
                showToast('Пожалуйста, выберите город');
            }
        });
    }
    
    function renderCart() {
        if (!cartItemsDiv) return;
        
        if (cart.length === 0) {
            if (cartListDiv) cartListDiv.style.display = 'none';
            if (emptyDiv) emptyDiv.style.display = 'block';
            return;
        }
        
        if (emptyDiv) emptyDiv.style.display = 'none';
        if (cartListDiv) cartListDiv.style.display = '';
        
        cartItemsDiv.innerHTML = '';
        
        cart.forEach(item => {
            const product = allProducts.find(p => p.id === item.id);
            if (!product) return;
            
            const itemTotal = product.price * item.qty;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-img">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='assets/img/placeholder.jpg'">
                </div>
                <div>
                    <div><strong>${product.name}</strong></div>
                    <div class="cart-item-price">${itemTotal.toFixed(2).replace('.', ',')} ${product.currency}</div>
                </div>
                <div class="qty-control">
                    <button class="qty-btn" data-action="dec" data-id="${product.id}">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn" data-action="inc" data-id="${product.id}">+</button>
                    <button class="qty-btn" data-action="remove" data-id="${product.id}" style="border-color:#e05151;">X</button>
                </div>
            `;
            cartItemsDiv.appendChild(itemDiv);
        });
        
        const total = getCartTotal();
        const count = getCartCount();
        if (summaryTotal) summaryTotal.textContent = total.toFixed(2).replace('.', ',') + ' BYN';
        if (cartCountLabel) cartCountLabel.textContent = 'товары, ' + count + ' шт';
        
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const currentItem = cart.find(i => i.id === id);
                
                if (action === 'inc') updateQty(id, (currentItem?.qty || 0) + 1);
                else if (action === 'dec') updateQty(id, (currentItem?.qty || 0) - 1);
                else if (action === 'remove') removeFromCart(id);
                renderCart();
            });
        });
    }
    
    const orderBtn = document.getElementById('order-btn');
    if (orderBtn) {
        orderBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Корзина пуста');
                return;
            }
            
            const name = customerName?.value.trim();
            let city = '';
            if (selectedCityDisplay && selectedCityDisplay.style.display === 'block') {
                city = selectedCityDisplay.textContent.replace('Выбран город: ', '');
            } else {
                city = citySelect?.value;
            }
            
            if (!name) { showToast('Введите ваше имя'); customerName?.focus(); return; }
            if (!city) { showToast('Выберите город доставки'); return; }
            
            const address = deliveryAddress?.value || 'Не указан';
            const phone = customerPhone?.value || 'Не указан';
            
            localStorage.setItem('softbloomy_last_order', JSON.stringify({ name, city, address, phone, date: new Date().toLocaleString() }));
            
            showToast('Заказ оформлен! Спасибо за покупку!');
            
            cart = [];
            saveCart();
            renderCart();
        });
    }
    
    renderCart();
}

// ===== ДОБРОЕ ПОЖЕЛАНИЕ В ПОДВАЛЕ =====
function addXMLDecoration() {
    const footer = document.querySelector('.footer-inner');
    if (footer && !document.getElementById('xml-fact')) {
        const xmlDiv = document.createElement('div');
        xmlDiv.id = 'xml-fact';
        xmlDiv.style.fontSize = '12px';
        xmlDiv.style.opacity = '0.6';
        xmlDiv.style.marginTop = '10px';
        xmlDiv.style.textAlign = 'center';
        xmlDiv.style.width = '100%';
        xmlDiv.style.color = '#aaa';
        xmlDiv.innerHTML = 'Желаем вам хороших покупок и отличного настроения! ^^ ';
        footer.appendChild(xmlDiv);
    }
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    addXMLDecoration();
    loadCart();
    
    const page = window.location.pathname.split('/').pop() || 'index.html';
    
    if (page === 'index.html' || page === '') initHome();
    else if (page === 'catalog.html') initCatalog();
    else if (page === 'product.html') initProduct();
    else if (page === 'cart.html') initCart();
});



