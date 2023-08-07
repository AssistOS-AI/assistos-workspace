import { getClosestParentElement, getMainAppContainer } from "./dom-utils.js";

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
    let modal=document.createElement("dialog");
    modal.innerHTML=`<${childTagName}/>`;
    modal.classList.add("modal");
    return modal;
}

export function closeModal(element) {
    const existingModal = getClosestParentElement(element, "dialog");
    if (existingModal) {
        existingModal.close();
        existingModal.remove();
    }
}
