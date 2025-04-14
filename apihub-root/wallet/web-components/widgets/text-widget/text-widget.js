export class TextWidget {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.quoteText = this.props.data||"In the middle of difficulty lies opportunity. - Albert Einstein"
    }

    async afterRender() {

    }
}