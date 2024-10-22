const jwt = require("./jwt");
const secrets = require("./secrets");
function createSessionCookie(sessionId) {
    return createCookieString('sessionId', sessionId, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: "/"
    });
}
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
    const accessToken = await jwt.createUserAccessJWT(userData)
    return createCookieString('authToken', accessToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 15,
        path: '/'
    });
}

function deleteAuthCookie() {
    return createCookieString('authToken', '', {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 0,
        path: '/'
    });
}

async function createRefreshAuthCookie(userData) {
    const refreshToken = await jwt.createUserRefreshAccessJWT(userData)
    return createCookieString('refreshAuthToken', refreshToken, {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
    });
}

function deleteRefreshAuthCookie() {
    return createCookieString('refreshAuthToken', '', {
        httpOnly: true,
        sameSite: 'Strict',
        maxAge: 0,
        path: '/'
    });
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

function createDemoUserCookie(email, password) {
    return createCookieString("demoCredentials", JSON.stringify({
            email: email,
            password: password
        }
    ), {
        path: "/",
        sameSite: 'Strict',
        maxAge: 60 * 60 * 24 * 7
    });
}
function deleteDemoUserCookie() {
    return createCookieString("demoCredentials", "", {
        path: "/",
        sameSite: 'Strict',
        maxAge: 0
    });

}
function createApiHubAuthCookies(apiHubAuthSecret, userId, spaceId) {
    let apiHubSecretCookie = createCookieString('ApiHubAuth', apiHubAuthSecret, {
        httpOnly: true,
        sameSite: 'Strict',
        path: "/"});
    let userIdCookie = createCookieString('userId', userId, {
        httpOnly: true,
        sameSite: 'Strict',
    });
    let spaceIdCookie = createCookieString('spaceId', spaceId, {
        httpOnly: true,
        sameSite: 'Strict',
    });
    return apiHubSecretCookie + " " + userIdCookie + " " + spaceIdCookie;
}

module.exports = {
    createSessionCookie,
    parseCookies,
    createCookieString,
    createAuthCookie,
    createCurrentSpaceCookie,
    createRefreshAuthCookie,
    createDemoUserCookie,
    deleteDemoUserCookie,
    deleteAuthCookie,
    deleteRefreshAuthCookie,
    deleteCurrentSpaceCookie,
    createApiHubAuthCookies
}