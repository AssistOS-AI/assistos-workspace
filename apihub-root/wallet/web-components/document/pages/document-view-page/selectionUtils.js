import {generateId} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const documentModule = require("assistos").loadModule("document", {});
function lockItem(itemClass, presenter) {
    let editableItem = presenter.element.querySelector(`.${itemClass}`);
    editableItem.classList.add("locked-item");
}

function unlockItem(itemClass, presenter) {
    let editableItem = presenter.element.querySelector(`.${itemClass}`);
    editableItem.classList.remove("locked-item");
}
async function setUserIcon(imageId, userEmail, selectId, itemClass, presenter){
    let userIconElement = presenter.element.querySelector(`.user-icon-container[data-id="${selectId}"]`);
    if(userIconElement){
        return;
    }
    let imageSrc;
    if (imageId) {
        imageSrc = await spaceModule.getImageURL(imageId);
    } else {
        imageSrc = "./wallet/assets/images/defaultUserPhoto.png";
    }
    let userIcon = `<div class="user-icon-container"  data-id="${selectId}">
                              <div class="name-tooltip">${userEmail}</div>
                              <img loading="lazy" src="${imageSrc}" class="user-icon" alt="user-icon">
                          </div>
                        `;
    let documentItem = presenter.element.querySelector(`.${itemClass}-container`);
    documentItem.insertAdjacentHTML('beforeend', userIcon);
}
function removeUserIcon(selectId, presenter){
    let userIcon = presenter.element.querySelector(`.user-icon-container[data-id="${selectId}"]`);
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
async function selectItem(lockItem, itemId, itemClass, presenter){
    presenter.selectId = generateId(8);
    if(presenter.selectionInterval){
        clearInterval(presenter.selectionInterval);
        delete presenter.selectionInterval;
    }
    await documentModule.selectDocumentItem(assistOS.space.id, presenter._document.id, itemId, {
        lockItem: lockItem,
        selectId: presenter.selectId,
        userImageId: assistOS.user.imageId,
        userEmail: assistOS.user.email
    });
    presenter.selectionInterval = setInterval(async () => {
        let itemText = presenter.element.querySelector(`.${itemClass}`);
        lockItem = !itemText.hasAttribute("readonly");
        await documentModule.selectDocumentItem(assistOS.space.id, presenter._document.id, itemId, {
            lockItem: lockItem,
            selectId: presenter.selectId,
            userImageId: assistOS.user.imageId,
            userEmail: assistOS.user.email
        });
    }, 6000 * 10);
}
export default {
    lockItem,
    unlockItem,
    setUserIcon,
    removeUserIcon,
    deselectItem,
    selectItem
};