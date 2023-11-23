import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";


export class addFlowModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
    }
    afterRender() {
        let lastCharWasSpace = false;
        const nameInput = this.element.querySelector('#name');

        nameInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey ||
                e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                e.key === 'Home' || e.key === 'End' ||
                e.key === 'PageUp' || e.key === 'PageDown' ||
                e.key === 'Enter' || e.key === 'Tab' ||
                e.key === 'Escape' || e.key === 'F1' ||
                e.key.startsWith('F') && !isNaN(e.key.slice(1))) {
                return;
            }
            if (e.key === ' ') {
                lastCharWasSpace = true;
            } else if (e.key.length === 1) {
                e.preventDefault();
                if (lastCharWasSpace || this.value.length === 0) {
                    this.value = this.value.trimEnd() + e.key.toUpperCase();
                } else {
                    this.value = this.value + e.key;
                }
                lastCharWasSpace = false;
            }
        });
    }



    closeModal(_target) {
        closeModal(_target);
    }

    async addScript(_target) {
        const isValidPascalCase=(nameInput)=> {
            return /^[A-Z][^\s]*$/.test(nameInput.value);
        }
        const conditions = {"isValidPascalCase": {fn:isValidPascalCase, errorMessage:"Name is not valid PascalCase Format"} };
        let formInfo = await extractFormInformation(_target,conditions);
        if (formInfo.isValid) {
            let flowData = {
                name: formInfo.data.name,
                description: formInfo.data.description,
                id: webSkel.servicesRegistry.UtilsService.generateId(),
                content: formInfo.data.validateCode
            }

            await webSkel.getService("GlobalFlowsService").spaceFlows.addFlow(flowData);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}