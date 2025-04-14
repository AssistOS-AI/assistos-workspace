export class PricingWidget{
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.planName = this.props.data?.plan || "Basic Plan";
        this.price = this.props.data?.price || "$9.99/month";
        this.details = this.props.data?.details || "Includes basic features and support.";
    }

    async afterRender() {}
}
