import {generateId} from "../../../../imports.js";
const spaceModule = assistOS.loadModule("space");
const documentModule = assistOS.loadModule("document");
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
function changeCommentIndicator(element, commentMessages) {
    let previewIcons = element.querySelector(".preview-icons");
    if(commentMessages.length > 0) {
        let commentIndicator = previewIcons.querySelector(".comment-icon-container");
        if(commentIndicator) {
            return;
        }
        commentIndicator = `<div class="comment-icon-container pointer" data-local-action="showComments">
                                            <img class="comment-indicator" src="./wallet/assets/icons/comment-indicator.svg">
                                        </div>`;
        previewIcons.insertAdjacentHTML("afterbegin", commentIndicator);
    } else {
        let commentIndicator = previewIcons.querySelector(".comment-icon-container");
        if(commentIndicator){
            commentIndicator.remove();
        }
    }
}
function displayCurrentStatus(element, comments, level) {
    let previewIcons = element.querySelector(".preview-icons");
    if(comments.status === "error"){
        let errorStatus = "error";
        let plugin = assistOS.space.plugins[`${level}`].find(plugin => plugin.component === comments.plugin);
        previewIcons.insertAdjacentHTML("beforeend", `<img class="status-icon ${errorStatus} pointer" data-local-action="openPlugin ${level} ${comments.plugin} ${plugin.autoPin || false}" src="./wallet/assets/icons/${errorStatus}.svg">`);
    }
}
function changeStatusIcon(element, status, level, pluginName, autoPin = false) {
    let previewIcons = element.querySelector(".preview-icons");
    let statusIcon = previewIcons.querySelector(`.status-icon`);
    if(statusIcon){
        if(statusIcon.classList.contains(status)){
            return; // Status already set
        }
        statusIcon.remove();
    }
    if(status !== "ok"){
        previewIcons.insertAdjacentHTML("beforeend", `<img class="status-icon ${status} pointer" data-local-action="openPlugin ${level} ${pluginName} ${autoPin}" src="./wallet/assets/icons/${status}.svg">`);
    }
}
export default {
    lockItem,
    unlockItem,
    setUserIcon,
    removeUserIcon,
    deselectItem,
    selectItem,
    changeCommentIndicator,
    displayCurrentStatus,
    changeStatusIcon
};