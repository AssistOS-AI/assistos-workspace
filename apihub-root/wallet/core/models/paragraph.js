    export class Paragraph {
        constructor(paragraphData) {
            this.text = paragraphData.text;
            this.id = paragraphData.id;
        }
        toString() {
            return this.text;
        }
    }