export class PrivacyWidget {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.policyText = this.props.data || "Your privacy is important to us. We do not share your data.";
    }

    async afterRender() {}
}
