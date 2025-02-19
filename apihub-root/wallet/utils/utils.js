const crypto = require("opendsu").loadAPI("crypto");
export function getDemoUserCredentials() {
    try {
        const demoUserCredentials = JSON.parse(getCookieValue("demoCredentials"));
        return [demoUserCredentials.email, demoUserCredentials.password]
    } catch (error) {
        return ["", ""];
    }
}

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
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}
export function formatTimestampToDate(timestamp) {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}