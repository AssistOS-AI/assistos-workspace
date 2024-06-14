export function getDemoUserCredentials() {
    try {
        const demoUserCredentials = JSON.parse(getCookieValue("demoCredentials"));
        return [demoUserCredentials.email, demoUserCredentials.password]
    } catch (error) {
        console.log(error + "No demo credentials found")
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

export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get the Base64 string without the data URL prefix
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export function executeTimer(fn, t) {
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
export function saveCaretPosition() {
    let savedCursorPosition = null;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        savedCursorPosition = selection.getRangeAt(0).cloneRange();
    }
    return function restore() {
        if (savedCursorPosition) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedCursorPosition);
        }
    }
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
export function getCursorPositionTextIndex() {
    // Get the selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = range.startContainer; // Get the text node containing the cursor
        const text = textNode.textContent; // Get the text content of the node
        const offset = range.startOffset; // Get the offset within the text node
        let currentIndex = 0;

        // Iterate through text nodes preceding the current one
        let node = textNode;
        while (node.previousSibling) {
            node = node.previousSibling;
            if (node.nodeType === Node.TEXT_NODE) {
                currentIndex += node.textContent.length;
            }
        }

        // Add the offset within the current text node
        currentIndex += offset;

        return currentIndex;
    }
    return -1; // No cursor position found
}
