export class AddFlowModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.parameterCount = 0;
        this.codeStart = "async execute(apis,parameters){\n" +
            "try{";
        this.codeEnd = "}catch(error){\n" +
            " this.genericReject(reject, error);\n" +
            "}\n";
    }

    afterRender() {
        this.flowCode = this.element.querySelector("#code");
        this.flowCode.addEventListener("keydown", this.insertSpacesOnTab);

    }

    insertSpacesOnTab(event) {
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

        } else if (event.key === 'Tab' && event.shiftKey) {
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
                if (lastNonWhiteSpaceChar && !isLineTerminator(lastNonWhiteSpaceChar) && !isNewStatement(lastNonWhiteSpaceChar)) {
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
            const name = formInfo.data.name;
            const action = formInfo.data.action;
            const intent = formInfo.data.intent;
            const code = formInfo.data.code;
            delete formInfo.data.name;
            delete formInfo.data.action;
            delete formInfo.data.intent;
            delete formInfo.data.code;
            let parameters = {};
            for (let key in formInfo.data) {
                if (key.includes('param-name')) {
                    const index = key.match(/\d+/)[0];
                    parameters[formInfo.data[key]] = {
                        type: formInfo.data[`param-type${index}`],
                        required: formInfo.data[`param-required${index}`] === 'on'
                    };
                }
            }
            await assistOS.callFlow("AddFlow", {
                name: name,
                code: assistOS.UI.unsanitize(code),
                flowParametersSchema: parameters,
                intent: intent,
                action: action
            });
            assistOS.UI.closeModal(_target);
        }
    }

    addParameter(_target) {
        this.parameterCount += 1;
        const container = assistOS.UI.reverseQuerySelector(_target, '#parameters-container');
        const parameterDiv = document.createElement('div');
        parameterDiv.className = 'form-item parameter-div';

        parameterDiv.innerHTML = `
        <div class="form-item">
            <label class="form-label" for="param-name${this.parameterCount}">Parameter Name</label>
            <input type="text" class="form-input" name="param-name${this.parameterCount}" required placeholder="Parameter Name">
        </div>
        <div class="form-item">
            <label class="form-label" for="param-type${this.parameterCount}">Parameter Type</label>
            <select class="form-input" name="param-type${this.parameterCount}" required>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="date">Date</option>
                <option value="file">File</option>
                <option value="function">Function</option>
                <option value="any">Any</option>
            </select>
        </div>
        <div class="form-item">
            <label class="form-label" for="param-required${this.parameterCount}">Required</label>
            <input type="checkbox" class="form-input" name="param-required${this.parameterCount}">
        </div>
        <div class="delete-parameter" data-local-action="deleteParameter"">X</div>
    `;

        container.appendChild(parameterDiv);
    }

    deleteParameter(element) {
        const parameterDiv = element.closest('.parameter-div');
        parameterDiv.remove();
    }
}