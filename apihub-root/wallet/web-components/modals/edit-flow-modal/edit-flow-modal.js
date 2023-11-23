import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class editFlowModal {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
      let script = webSkel.currentUser.space.getFlow(this.element.getAttribute("data-id"));
      this.scriptContent = script.content;
      this.scriptName = script.name;
    }
    afterRender(){
        let scriptCode = this.element.querySelector("textarea");
        scriptCode.value = this.scriptContent;
        scriptCode.addEventListener("keydown", this.insertSpacesOnTab);
    }

    closeModal(_target) {
        closeModal(_target);
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
    async saveScript(_target) {
        let form = this.element.querySelector("form")
        let formInfo = await extractFormInformation(form);
        if(formInfo.isValid) {
            let flowId = this.element.getAttribute("data-id");
            await webSkel.currentUser.space.updateFlow(flowId, formInfo.data.scriptCode);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}