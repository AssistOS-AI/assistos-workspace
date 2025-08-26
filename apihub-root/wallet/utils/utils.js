import { encode as encodeBase58 } from './base58.js';

export function getCookieValue(cookieName) {
    const name = cookieName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

export function base64ToBlob(base64, contentType = '', sliceSize = 512) {
    // Remove the data URL prefix if it exists
    const base64String = base64.includes(',') ? base64.split(',')[1] : base64;

    const byteCharacters = atob(base64String);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
}

export function executorTimer(fn, t) {
    let intervalId = setInterval(fn, t);
    this.stop = async function (executeFn) {
        if (intervalId) {
            if (executeFn) {
                await fn();
            }
            clearInterval(intervalId);
            intervalId = null;
        }
        return this;
    }
    // start timer using current settings (if it's not already running)
    this.start = async function () {
        if (!intervalId) {
            await this.stop();
            intervalId = setInterval(fn, t);
        }
        return this;
    }
    // start with new or original interval, stop current interval
    this.reset = async function (newT = t) {
        t = newT;
        let self = await this.stop();
        return self.start();
    }
    return this;
}

export function insertTextAtCursor(text) {
    // Check if there's a selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents(); // Delete any selected content
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // Move the caret to the end of the inserted text
        range.setStartAfter(textNode);
        range.collapse(true);

        // Update the selection with the new range
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

export function unescapeHtmlEntities(value) {
    const tempElement = document.createElement('textarea');
    tempElement.innerHTML = value;
    return tempElement.value;
}
export function generateId(length = 16) {
    // Generate random bytes using Web Crypto API
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    
    // Encode to base58 and ensure we get the desired length
    let randomStringId = encodeBase58(randomBytes);
    
    // If the encoded string is shorter than desired, generate more random bytes
    while (randomStringId.length < length) {
        const moreBytes = new Uint8Array(length);
        crypto.getRandomValues(moreBytes);
        randomStringId = encodeBase58(moreBytes);
    }
    
    return randomStringId.slice(0, length);
}
export function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diffInMs = now - timestamp;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
        return "just now";
    } else if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
        return "yesterday";
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
    } else {
        const diffInMonths = Math.floor(diffInDays / 30);
        return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
    }
}