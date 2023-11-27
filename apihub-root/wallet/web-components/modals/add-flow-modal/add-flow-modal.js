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
        let flowCode = this.element.querySelector("#code");
        flowCode.addEventListener("keydown", this.insertSpacesOnTab);
    }

    insertSpacesOnTab(event){
        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            let start = this.selectionStart;
            let end = this.selectionEnd;
            const selectedText = this.value.substring(start, end);
            const indentedText = selectedText.replace(/^/gm, '    ');
            this.value = this.value.substring(0, start) + indentedText + this.value.substring(end);
            this.selectionStart = start + indentedText.length;
            this.selectionEnd = start + indentedText.length;
            this.setSelectionRange(this.selectionStart, this.selectionEnd);

        }else if(event.key === 'Tab' && event.shiftKey){
            event.preventDefault();
            let start = this.selectionStart;
            let beginningOfLine = start;
            while (beginningOfLine > 0 && this.value[beginningOfLine - 1] !== '\n') {
                beginningOfLine--;
            }
            this.selectionStart = beginningOfLine;
            start = this.selectionStart;
            let end = this.selectionEnd;
            const selectedText = this.value.substring(start, end);
            const unindentedText = selectedText.replace(/^    /gm, '');
            this.value = this.value.substring(0, start) + unindentedText + this.value.substring(end);
            const newStart = start;
            const newEnd = newStart + selectedText.length - unindentedText.length;
            this.setSelectionRange(newStart, newEnd);
        }

    }


    closeModal(_target) {
        closeModal(_target);
    }

    async addFlow(_target) {
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
                content: formInfo.data.code,
                tags: formInfo.data.tags
            }
            let flowId = webSkel.currentUser.space.getFlowIdByName("AddFlow");
            let result = await webSkel.getService("LlmsService").callFlow(flowId, flowData);
            console.log(result);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}