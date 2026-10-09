/**
 * auth.js – สถานะการเข้าสู่ระบบของลูกค้า (สมาชิก)
 * ต้องโหลด config.js และ api.js ก่อนไฟล์นี้
 * เก็บ token + ข้อมูลผู้ใช้ใน localStorage ของเบราว์เซอร์
 * token ฝั่งเซิร์ฟเวอร์มีอายุ 6 ชั่วโมง ฝั่งเว็บจึงถือว่าหมดอายุที่ ~5.8 ชั่วโมง
 */
(function (global) {
    var TOKEN_KEY = 'volcanno_user_token';
    var USER_KEY = 'volcanno_user';
    var TIME_KEY = 'volcanno_user_at';
    var TTL_MS = 21000 * 1000;

    function clear() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TIME_KEY);
        } catch (e) {}
        updateNav();
    }

    function getToken() {
        try {
            var token = localStorage.getItem(TOKEN_KEY);
            if (!token) return null;
            var at = Number(localStorage.getItem(TIME_KEY)) || 0;
            if (Date.now() - at > TTL_MS) { clear(); return null; }
            return token;
        } catch (e) {
            return null;
        }
    }

    function getUser() {
        if (!getToken()) return null;
        try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
    }

    function save(token, user) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem(TIME_KEY, String(Date.now()));
        } catch (e) {}
        updateNav();
    }

    async function login(identifier, password) {
        var r = await Api.call('login', { identifier: identifier, password: password });
        save(r.token, r.user);
        return r.user;
    }

    async function register(data) {
        var r = await Api.call('register', data);
        save(r.token, r.user);
        return r.user;
    }

    // จุดสีเขียวบนไอคอนโปรไฟล์ เมื่อล็อกอินอยู่
    function updateNav() {
        if (!document.getElementById('auth-style')) {
            var css = document.createElement('style');
            css.id = 'auth-style';
            css.textContent = '.icon-circle{position:relative}' +
                '.user-dot{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;' +
                'background:#2e9e5b;border:2px solid #FCF9F2}';
            document.head.appendChild(css);
        }
        var link = document.querySelector('a.icon-circle[href="profile.html"]');
        if (!link) return;
        var dot = link.querySelector('.user-dot');
        if (getUser()) {
            if (!dot) {
                dot = document.createElement('span');
                dot.className = 'user-dot';
                link.appendChild(dot);
            }
            link.title = 'สวัสดี ' + getUser().name;
        } else if (dot) {
            dot.remove();
            link.removeAttribute('title');
        }
    }

    document.addEventListener('DOMContentLoaded', updateNav);

    global.Auth = {
        getToken: getToken, getUser: getUser, save: save, clear: clear,
        login: login, register: register, logout: clear, updateNav: updateNav
    };
})(window);