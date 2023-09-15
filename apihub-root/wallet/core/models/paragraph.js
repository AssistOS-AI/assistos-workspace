    export class Paragraph {
        constructor(textContent, paragraphId) {
            this.text = textContent;
            this.id = paragraphId;
        }

        toString() {
            return this.text;
        }
    }