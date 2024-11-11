import {generateId} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
function lockText(itemClass, presenter) {
    let textItem = presenter.element.querySelector(`.${itemClass}`);
    textItem.setAttribute("readonly", true);
    textItem.classList.add("locked-text");
}

function unlockText(itemClass, presenter) {
    let textItem = presenter.element.querySelector(`.${itemClass}`);
    textItem.removeAttribute("readonly");
    textItem.classList.remove("locked-text");
}
async function setUserIcon(imageId, selectId, itemClass, presenter){
    let userIconElement = presenter.element.querySelector(`.user-icon[data-id="${selectId}"]`);
    if(userIconElement){
        return;
    }
    let imageSrc;
    if (imageId) {
        imageSrc = await spaceModule.getImageURL(imageId);
    } else {
        imageSrc = "./wallet/assets/images/defaultUserPhoto.png";
    }
    let userIcon = `<img loading="lazy" src="${imageSrc}" class="user-icon" alt="user-icon" data-id="${selectId}">`;
    let documentItem = presenter.element.querySelector(`.${itemClass}-container`);
    documentItem.insertAdjacentHTML('beforeend', userIcon);
}
function removeUserIcon(selectId, presenter){
    let userIcon = presenter.element.querySelector(`.user-icon[data-id="${selectId}"]`);
    if(userIcon){
        userIcon.remove();
    }
}
async function deselectItem(itemId, presenter){
    if(presenter.selectionInterval){
        clearInterval(presenter.selectionInterval);
        delete presenter.selectionInterval;
    }
    await documentModule.deselectDocumentItem(assistOS.space.id, presenter._document.id, itemId, presenter.selectId);
}
async function selectItem(lockText, itemId, itemClass, presenter){
    presenter.selectId = generateId(8);
    if(presenter.selectionInterval){
        clearInterval(presenter.selectionInterval);
        delete presenter.selectionInterval;
    }
    await documentModule.selectDocumentItem(assistOS.space.id, presenter._document.id, itemId, {
        lockText: lockText,
        selectId: presenter.selectId
    });
    presenter.selectionInterval = setInterval(async () => {
        let itemText = presenter.element.querySelector(`.${itemClass}`);
        lockText = !itemText.hasAttribute("readonly");
        await documentModule.selectDocumentItem(assistOS.space.id, presenter._document.id, itemId, {
            lockText: lockText,
            selectId: presenter.selectId
        });
    }, 1000 * 10);
}
export default {
    lockText,
    unlockText,
    setUserIcon,
    removeUserIcon,
    deselectItem,
    selectItem
};