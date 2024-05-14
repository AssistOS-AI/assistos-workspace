export class AddFlowModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
    }
    afterRender() {
        this.flowCode = this.element.querySelector("#code");
        this.flowCode.addEventListener("keydown", this.insertSpacesOnTab);
        this.flowCode.value = "class PascalCase {\n" +
            "\n" +
            "   static description = \"description\"; \n\n" +
            "   constructor(personality) {\n" +
            "       this.dependency = dependency;\n" +
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
        assistOS.UI.closeModal(_target);
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
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        if (formInfo.isValid) {
            await assistOS.callFlow("AddFlow", {
                spaceId: assistOS.space.id,
                code: formInfo.data.code
            });
            assistOS.UI.closeModal(_target);
        }
    }
}