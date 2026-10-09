/**
 * api.js – ตัวกลางเรียก Google Apps Script
 * ทุกหน้าเรียกผ่านไฟล์นี้ ถ้าจะเปลี่ยนไปใช้ฐานข้อมูลอื่นภายหลัง แก้ที่นี่ที่เดียว
 * ต้องโหลด config.js ก่อนไฟล์นี้
 */
(function (global) {
    var PRODUCTS_CACHE = 'volcanno_products_cache';
    var CACHE_MS = 60 * 1000; // แคชสินค้า 60 วินาที ลดการรอ Google

    function apiUrl() {
        var url = (global.VOLCANNO_CONFIG || {}).API_URL || '';
        if (url.indexOf('https://script.google.com/') !== 0) {
            throw new Error('ยังไม่ได้ตั้งค่า API_URL ในไฟล์ config.js');
        }
        return url;
    }

    // เรียก API: GET สำหรับอ่านข้อมูลสาธารณะ, POST สำหรับที่เหลือ
    // POST ส่งเป็น text/plain (ค่าเริ่มต้นของ string body) เพื่อเลี่ยง CORS preflight ของ Apps Script
    async function call(action, payload, useGet) {
        var res;
        try {
            if (useGet) {
                res = await fetch(apiUrl() + '?action=' + encodeURIComponent(action));
            } else {
                res = await fetch(apiUrl(), {
                    method: 'POST',
                    body: JSON.stringify(Object.assign({ action: action }, payload || {}))
                });
            }
        } catch (e) {
            if (e.message.indexOf('config.js') !== -1) throw e;
            throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');
        }

        var json, raw = '';
        try {
            raw = await res.text();
            json = JSON.parse(raw);
        } catch (e) {
            // แสดงข้อความดิบที่เซิร์ฟเวอร์ตอบมาใน Console (F12) เพื่อใช้หาสาเหตุ
            console.error('[API] action=' + action + ' status=' + res.status + ' ตอบกลับที่ไม่ใช่ JSON:', raw.slice(0, 600));
            throw new Error('เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ (ตรวจว่า Deploy เป็น Anyone และใช้ URL ที่ลงท้าย /exec) กด F12 แล้วดูแท็บ Console เพื่อดูรายละเอียด');
        }
        if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาด');
        return json.data;
    }

    async function getProducts(force) {
        if (!force) {
            try {
                var cached = JSON.parse(sessionStorage.getItem(PRODUCTS_CACHE) || 'null');
                if (cached && Date.now() - cached.time < CACHE_MS) return cached.data;
            } catch (e) {}
        }
        var data = await call('getProducts', null, true);
        try {
            sessionStorage.setItem(PRODUCTS_CACHE, JSON.stringify({ time: Date.now(), data: data }));
        } catch (e) {}
        return data;
    }

    function clearCache() {
        try { sessionStorage.removeItem(PRODUCTS_CACHE); } catch (e) {}
    }

    global.Api = {
        call: call,
        getProducts: getProducts,
        getConfig: function () { return call('getConfig', null, true); },
        clearCache: clearCache
    };
})(window);