export class TextWidget {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.company = this.props.html;
        if(this.props.css){
            const style = document.createElement('style');
            style.textContent = this.props.css;
            document.head.appendChild(style);
        }
    }

    async afterRender() {
    }
}