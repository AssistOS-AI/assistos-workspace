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
