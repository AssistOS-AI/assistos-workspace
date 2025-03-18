const ClientUtils = {
    cookies: {
        parse: function () {
            return document.cookie
                .split('; ')
                .reduce((acc, cookie) => {
                    const [key, value] = cookie.split('=');
                    acc[key] = decodeURIComponent(value);
                    return acc;
                }, {});
        },
        set: function (key, value, days = 365) {
            const expires = new Date(Date.now() + days * 864e5).toUTCString();
            document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
        },
        delete: function (key) {
            document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
    },
    url: {
        parseQueryParams: function () {
            return Object.fromEntries(new URLSearchParams(window.location.search));
        },
        getQueryParam: function (key) {
            return new URLSearchParams(window.location.search).get(key);
        },
        updateQueryParams: function (params) {
            const searchParams = new URLSearchParams(window.location.search);
            Object.entries(params).forEach(([key, value]) => {
                searchParams.set(key, value);
            });
            window.history.replaceState({}, '', `${window.location.pathname}?${searchParams}`);
        },
        getDomain: function () {
            return window.location.hostname;
        },
        getFullUrl: function () {
            return window.location.href;
        },
        getPath: function () {
            return window.location.pathname;
        },
        getProtocol: function () {
            return window.location.protocol.replace(':', '');
        }
    },

    browser: {
        isHTTPS: function () {
            return window.location.protocol === 'https:';
        },
        isLocalhost: function () {
            return window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';
        },
        getUserAgent: function () {
            return navigator.userAgent;
        },
        isMobile: function () {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        isIOS: function () {
            return /iPhone|iPad|iPod/i.test(navigator.userAgent);
        },
        isAndroid: function () {
            return /Android/i.test(navigator.userAgent);
        }
    },

    storage: {
        localStorage: {
            get: function (key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch {
                    return localStorage.getItem(key);
                }
            },
            set: function (key, value) {
                localStorage.setItem(key, JSON.stringify(value));
            },
            remove: function (key) {
                localStorage.removeItem(key);
            },
            clear: function () {
                localStorage.clear();
            }
        },
        sessionStorage: {
            get: function (key) {
                try {
                    return JSON.parse(sessionStorage.getItem(key));
                } catch {
                    return sessionStorage.getItem(key);
                }
            },
            set: function (key, value) {
                sessionStorage.setItem(key, JSON.stringify(value));
            },
            remove: function (key) {
                sessionStorage.removeItem(key);
            },
            clear: function () {
                sessionStorage.clear();
            }
        }
    },

    generateId: function () {
        return crypto.randomUUID?.() ||
            `${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
    },

    getReferrer: function () {
        return document.referrer;
    },

    isIframe: function () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },

    getScreenResolution: function () {
        return `${window.screen.width}x${window.screen.height}`;
    },

    getViewportSize: function () {
        return `${window.innerWidth}x${window.innerHeight}`;
    },

    getScrollPosition: function () {
        return {
            x: window.scrollX || window.pageXOffset,
            y: window.scrollY || window.pageYOffset
        };
    },

    getHash: function () {
        return window.location.hash.substring(1);
    },

    updateHash: function (hash) {
        window.location.hash = hash;
    }
};

const spaceId = ClientUtils.url.getQueryParam('spaceId') || null;
const applicationId = ClientUtils.url.getQueryParam('applicationId') || null;

const appContainer = document.getElementById('app-container');

const fetchApplicationEntry = async function (spaceId, applicationId) {
    const response = await fetch(`/api/v1/spaces/${spaceId}/applications/${applicationId}`);
    return await response.text();
}

appContainer.innerHTML = await fetchApplicationEntry(spaceId, applicationId);