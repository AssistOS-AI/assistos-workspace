export const appBaseUrl = new URL(`${window.location.protocol}//${window.location.host}`);
export const apihubBaseUrl = new URL(`${window.location.protocol}//${window.location.host}`);

export function isInternalUrl(url) {
    return new URL(url, appBaseUrl).hostname === appBaseUrl.hostname;
}

export function getAppUrl(relativePath) {
    if (relativePath != null && !relativePath.startsWith("/")) {
        relativePath = `/${relativePath}`;
    }
    if (!relativePath.startsWith("")) {
        relativePath = `${relativePath}`;
    }

    return `${relativePath}`;
}

export function getApihubUrl(relativePath) {
    if (relativePath != null && !relativePath.startsWith("/")) {
        relativePath = `/${relativePath}`;
    }
    return `${relativePath}`;
}
