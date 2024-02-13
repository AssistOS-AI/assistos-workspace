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
        // const nameInput = this.element.querySelector('#name');
        //
        // nameInput.addEventListener('keydown', function(e) {
        //     if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey ||
        //         e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        //         e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        //         e.key === 'Home' || e.key === 'End' ||
        //         e.key === 'PageUp' || e.key === 'PageDown' ||
        //         e.key === 'Enter' || e.key === 'Tab' ||
        //         e.key === 'Escape' || e.key === 'F1' ||
        //         e.key.startsWith('F') && !isNaN(e.key.slice(1))) {
        //         return;
        //     }
        //     if (e.key === ' ') {
        //         lastCharWasSpace = true;
        //     } else if (e.key.length === 1) {
        //         e.preventDefault();
        //         if (lastCharWasSpace || this.value.length === 0) {
        //             this.value = this.value.trimEnd() + e.key.toUpperCase();
        //         } else {
        //             this.value = this.value + e.key;
        //         }
        //         lastCharWasSpace = false;
        //     }
        // });
        this.flowCode = this.element.querySelector("#code");
        this.flowCode.addEventListener("keydown", this.insertSpacesOnTab);
        this.flowCode.value = "class PascalCase {\n" +
            "\n" +
            `   static id = "${webSkel.appServices.generateId()}" \n` +
            "   static description = \"description\"; \n\n" +
            "   constructor(dependencies) {\n" +
            "       const { changeSelectedPageFromSidebar } = dependencies;\n" +
            "       this.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;\n" +
            "   }\n" +
            "   start(){\n" +
            "\n" +
            "   }\n" +
            "}"
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

    formatCode() {

        let code = this.flowCode.value;
        // Helper functions:
        const isWhitespace = (char) => /\s/.test(char);
        const isLineTerminator = (char) => /\n|\r/.test(char);
        const isNewStatement = (char) => char === ';';

        let formattedCode = '';  // Stores the final formatted code
        let indentationStack = []; // Stack to keep indentation levels
        let currentIndent = ''; // Holds the current indentation string
        let inString = false; // Flag to indicate if we're inside a string
        let stringChar = ''; // Keeps track of the type of string delimiter
        let lastNonWhiteSpaceChar = ''; // Tracks the previous non-whitespace character

        const increaseIndentation = () => {
            indentationStack.push(currentIndent);
            currentIndent += '\t';
        };

        const decreaseIndentation = () => {
            if (indentationStack.length > 0) {
                currentIndent = indentationStack.pop();
            }
        };

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';

            if (inString) {
                formattedCode += char;
                if (char === stringChar && prevChar !== '\\') { // Check for unescaped string delimiter
                    inString = false;
                }
            } else if (char === '"' || char === "'" || char === '`') { // String start
                formattedCode += char;
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                if(lastNonWhiteSpaceChar && !isLineTerminator(lastNonWhiteSpaceChar) && !isNewStatement(lastNonWhiteSpaceChar)) {
                    formattedCode = formattedCode.trimEnd() + ' ';
                }
                formattedCode += char + '\n';
                increaseIndentation();
                formattedCode += currentIndent;
                lastNonWhiteSpaceChar = char;
            } else if (char === '}') {
                formattedCode = formattedCode.trimEnd() + '\n';
                decreaseIndentation();
                formattedCode += currentIndent + char;
                lastNonWhiteSpaceChar = char;
            } else if (isNewStatement(char) || isLineTerminator(char)) {
                if (!isLineTerminator(lastNonWhiteSpaceChar)) {
                    formattedCode += char + '\n' + currentIndent;
                    lastNonWhiteSpaceChar = char;
                }
            } else {
                if (!isWhitespace(char) || !isWhitespace(lastNonWhiteSpaceChar)) {
                    formattedCode += char;
                    if (!isWhitespace(char)) {
                        lastNonWhiteSpaceChar = char;
                    }
                }
            }
        }
        this.flowCode.value = formattedCode.trim();
    }

    async addFlow(_target) {
        // const isValidPascalCase=(nameInput)=> {
        //     return /^[A-Z][^\s]*$/.test(nameInput.value);
        // }
        let formInfo = await extractFormInformation(_target);
        if (formInfo.isValid) {

            let flowId = webSkel.currentUser.space.getFlowIdByName("AddFlow");
            await webSkel.appServices.callFlow(flowId, formInfo.data.code);
            webSkel.currentUser.space.notifyObservers(webSkel.currentUser.space.getNotificationId());
            closeModal(_target);
        }
    }
}