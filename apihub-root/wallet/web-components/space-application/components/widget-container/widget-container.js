export class WidgetContainer {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.code = props.code;
    }
    async beforeRender() {

    }
}