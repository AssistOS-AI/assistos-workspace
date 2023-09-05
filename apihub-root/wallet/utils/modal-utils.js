import {getClosestParentElement, getMainAppContainer} from "../../WebSkel/utils/dom-utils";

export async function showModal(element, modalComponentName, componentProps) {
    const existingModalContainer = getClosestParentElement(element, "dialog");
    if (existingModalContainer) {
        existingModalContainer.close();
        existingModalContainer.remove();
    }
    const modalContainer = element || getMainAppContainer(element);
    const modal = Object.assign(createModal(modalComponentName), {
        component: modalComponentName,
        cssClass: modalComponentName,
        componentProps,
    });
    modalContainer.appendChild(modal);
    await modal.showModal();
    return modal;
}

function createModal(childTagName) {
    let modal = document.createElement("dialog");
    modal.innerHTML=`<${childTagName} data-presenter="${childTagName}"/>`;
    modal.classList.add("modal");
    return modal;
}