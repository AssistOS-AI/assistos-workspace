function parseResponseCookies(response) {
    let cookies = response.headers.get('set-cookie');
    let parsedCookies = {};
    let cookieSplit = cookies.split(',');
    cookieSplit.forEach(function (cookie) {
        const parts = cookie.split('=');
        let name = parts.shift().trim();
        parsedCookies[name] = {};
        cookie.split(';').forEach(function (values) {
            const parts = values.split('=');
            let key = parts.shift().trim();
            if(key === name){
                parsedCookies[name].value = decodeURIComponent(parts.join('='));
            } else {
                parsedCookies[name][key] = decodeURIComponent(parts.join('='));
            }
        });
    });
    return parsedCookies;
}
function parseRequestCookies(request) {
    const list = {};
    const cookieHeader = request.headers.cookie;

    if (cookieHeader) {
        cookieHeader.split(';').forEach(function (cookie) {
            const parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }

    return list;
}

function createCookieString(name, value, options = {}) {
    let cookieString = `${name}=${value};`;

    if ('maxAge' in options) {
        cookieString += ` Max-Age=${options.maxAge};`;
    }
    if (options.path) {
        cookieString += ` Path=${options.path};`;
    }
    if (options.domain) {
        cookieString += ` Domain=${options.domain};`;
    }
    if (options.expires) {
        cookieString += ` Expires=${options.expires.toUTCString()};`;
    }
    if (options.httpOnly) {
        cookieString += ` HttpOnly;`;
    }
    if (options.secure) {
        cookieString += ` Secure;`;
    }
    if (options.sameSite) {
        cookieString += ` SameSite=${options.sameSite};`;
    }

    return cookieString;
}

function createCurrentSpaceCookie(currentSpaceId) {
    return createCookieString('currentSpaceId', currentSpaceId, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    });
}

function deleteCurrentSpaceCookie() {
    return createCookieString('currentSpaceId', '', {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 0,
        path: '/'
    });
}
function createAdminCookies(email, userId, authToken){
    let cookies= "";
    cookies += createCookieString('email', encodeURIComponent(email), {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7});
    cookies += createCookieString('userId', userId, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7
    });
    cookies += createCookieString('authToken', authToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7
    });
    return cookies;
}
module.exports = {
    parseRequestCookies,
    parseResponseCookies,
    createCookieString,
    createCurrentSpaceCookie,
    deleteCurrentSpaceCookie,
    createAdminCookies
}