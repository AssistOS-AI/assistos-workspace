const jwt = require("./jwt");

function parseCookies(request) {
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

async function createAuthCookie(userData) {
    const accessToken= await jwt.createUserAccessJWT(userData)
    return createCookieString('authToken', accessToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/'
    });
}

async function createRefreshAuthCookie(userData) {
    const refreshToken= await jwt.createUserRefreshAccessJWT(userData)
    return createCookieString('refreshAuthToken', refreshToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    });
}

function createCurrentSpaceCookie(currentSpaceId){
    return createCookieString('currentSpaceId', currentSpaceId, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    });
}
module.exports={
    parseCookies,
    createCookieString,
    createAuthCookie,
    createCurrentSpaceCookie,
    createRefreshAuthCookie
}