export class ContactWidget {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.contactInfo = this.props.data || "Have questions? Reach out to us anytime!";
        this.email = this.props.generalSettings?.email || "contact@example.com";
    }

    async afterRender() {}
}
