/**
 * cart.js – ตะกร้าสินค้า (เก็บใน localStorage ของเบราว์เซอร์)
 * เก็บเฉพาะ id กับจำนวน ส่วนชื่อ/ราคาดึงจากชีตตอนแสดงผลและตอนสั่งซื้อ
 */
(function (global) {
    var KEY = 'volcanno_cart';
    var MAX_QTY = 99;

    function read() {
        try {
            var list = JSON.parse(localStorage.getItem(KEY) || '[]');
            if (!Array.isArray(list)) return [];
            return list.filter(function (it) {
                return it && typeof it.id === 'string' && it.qty >= 1;
            });
        } catch (e) {
            return [];
        }
    }

    function write(list) {
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
        updateBadge();
        global.dispatchEvent(new Event('cart:change'));
    }

    // เพิ่มสินค้า: max = สต็อกคงเหลือ (ไม่ระบุก็จำกัดที่ 99)
    function add(id, qty, max) {
        var limit = Math.min(max > 0 ? max : MAX_QTY, MAX_QTY);
        var list = read();
        var item = list.filter(function (it) { return it.id === id; })[0];
        var wanted = (item ? item.qty : 0) + (parseInt(qty, 10) || 1);
        var final = Math.min(wanted, limit);
        if (item) item.qty = final;
        else list.push({ id: id, qty: final });
        write(list);
        return { qty: final, capped: wanted > limit };
    }

    function setQty(id, qty) {
        var q = parseInt(qty, 10);
        if (!(q >= 1)) return remove(id);
        var list = read().map(function (it) {
            return it.id === id ? { id: id, qty: Math.min(q, MAX_QTY) } : it;
        });
        write(list);
    }

    function remove(id) {
        write(read().filter(function (it) { return it.id !== id; }));
    }

    function clear() { write([]); }

    function count() {
        return read().reduce(function (sum, it) { return sum + it.qty; }, 0);
    }

    // ---------- ตัวเลขบนไอคอนตะกร้าใน Navbar ----------
    function injectStyle() {
        if (document.getElementById('cart-style')) return;
        var css = document.createElement('style');
        css.id = 'cart-style';
        css.textContent =
            '.icon-circle{position:relative}' +
            '.cart-badge{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;' +
            'background:#9B2226;color:#fff;border-radius:10px;font-size:11px;font-weight:600;' +
            'display:flex;align-items:center;justify-content:center;border:2px solid #FCF9F2;font-family:Prompt,sans-serif}' +
            '.cart-toast{position:fixed;left:50%;bottom:30px;transform:translate(-50%,20px);background:#2B2D42;color:#fff;' +
            'padding:12px 24px;border-radius:30px;font-size:14px;font-family:Prompt,sans-serif;opacity:0;' +
            'transition:all .3s;z-index:9999;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.2);max-width:90vw;text-align:center}' +
            '.cart-toast.show{opacity:1;transform:translate(-50%,0)}' +
            '.cart-toast.error{background:#9B2226}';
        document.head.appendChild(css);
    }

    function updateBadge() {
        injectStyle();
        var link = document.querySelector('a.icon-circle[href="order.html"]');
        if (!link) return;
        var badge = link.querySelector('.cart-badge');
        var n = count();
        if (n < 1) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            link.appendChild(badge);
        }
        badge.textContent = n > 99 ? '99+' : n;
    }

    var toastTimer;
    function toast(message, isError) {
        injectStyle();
        var el = document.getElementById('cart-toast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'cart-toast';
            document.body.appendChild(el);
        }
        el.className = 'cart-toast' + (isError ? ' error' : '');
        el.textContent = message;
        void el.offsetWidth; // เริ่ม transition ใหม่
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
    }

    document.addEventListener('DOMContentLoaded', updateBadge);
    // อัปเดตตัวเลขเมื่อมีการแก้ตะกร้าจากแท็บอื่น
    global.addEventListener('storage', function (e) { if (e.key === KEY) updateBadge(); });

    global.Cart = {
        get: read, add: add, setQty: setQty, remove: remove, clear: clear,
        count: count, toast: toast, updateBadge: updateBadge
    };
})(window);