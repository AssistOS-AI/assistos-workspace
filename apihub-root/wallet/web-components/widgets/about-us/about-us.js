export class AboutUs {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.aboutText = this.props.data || "We are a passionate team dedicated to delivering the best solutions.";
    }

    async afterRender() {}
}
