export class WidgetContainer {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.code = props.code;
        this.invalidate();
    }
    async beforeRender() {

    }
}