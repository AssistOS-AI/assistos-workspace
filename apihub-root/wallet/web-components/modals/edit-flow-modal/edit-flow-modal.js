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
      let flow = webSkel.currentUser.space.getFlow(this.element.getAttribute("data-id"));
      this.flowContent = flow.content;
      this.flowName = flow.name;
    }
    afterRender(){
        this.flowCode = this.element.querySelector("textarea");
        this.flowCode.value = this.flowContent;
        this.flowCode.addEventListener("keydown", this.insertSpacesOnTab);
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
            const indentedText = selectedText.replace(/^/gm, '\t');
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
            const unindentedText = selectedText.replace(new RegExp(`^[ ]?\\t`, 'gm'), '');
            this.value = this.value.substring(0, start) + unindentedText + this.value.substring(end);
            const newStart = start;
            const newEnd = newStart + selectedText.length - unindentedText.length;
            this.setSelectionRange(newStart, newEnd);
        }

    }
    async saveFlow(_target) {
        let form = this.element.querySelector("form")
        let formInfo = await extractFormInformation(form);
        if(formInfo.isValid) {
            let flowId = this.element.getAttribute("data-id");
                let execFlowId = webSkel.currentUser.space.getFlowIdByName("UpdateFlow");
            let result = await webSkel.getService("LlmsService").callFlow(execFlowId, flowId, formInfo.data.flowCode);
            console.log(result);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
    countTabs(blocks) {
        let tabCount = 0;
        let necessaryTabs = {};

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i];
            if (block === '{') {
                necessaryTabs[i] = tabCount;
                tabCount++;
            } else if (block === '}') {
                tabCount--;
                necessaryTabs[i] = tabCount;
            } else {
                // Calculate necessary tabs based on the current tab count
                necessaryTabs[i] = tabCount;
            }
        }

        return necessaryTabs-1;
    }
    formatCode(){
        let tabCount = 0;
        let formattedCode = '';

        // Split the code on '{' or '}'
        let blocks = this.flowCode.value.split(/({|}|;)/);

        // Count the necessary tabs for each block
        let necessaryTabs = this.countTabs(blocks);

        // Iterate through each block
        blocks.forEach(function(block, index) {
            if (block === '{' || block === '}') {
                // Add or remove tabs based on the necessary tabs and include the bracket
                let tabs = '\t'.repeat(necessaryTabs[index]);
                formattedCode += tabs + block + '\n';
            }else {
                // Add or remove tabs based on the necessary tabs
                let tabs = '\t'.repeat(necessaryTabs[index]);
                formattedCode += tabs + block;
            }
        });
        this.flowCode.value = formattedCode;
    }
    loadFlow(){
        alert("To be implemented.");
    }
}