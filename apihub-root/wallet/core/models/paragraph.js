    export class Paragraph {
        constructor(paragraphData) {
            this.text = paragraphData.textContent;
            this.id = paragraphData.paragraphId;
        }
        toString() {
            return this.text;
        }
    }