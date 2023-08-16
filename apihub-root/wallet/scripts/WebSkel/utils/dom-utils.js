export function getClosestParentElement(element, selector, stopSelector) {
    let closestParent = null;
    while (element) {
        if (element.matches(selector)) {
            closestParent = element;
            break;
        } else if (stopSelector && element.matches(stopSelector)) {
            break;
        }
        element = element.parentElement;
    }
    return closestParent;
}

export function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}

export function getMainAppContainer(element) {
    return getClosestParentElement(element, ".app-container");
}


