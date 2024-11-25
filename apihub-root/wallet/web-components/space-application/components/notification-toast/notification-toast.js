export class NotificationToast {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.timeout = setTimeout(() => {
            this.element.remove();
        }, 5000);
        this.invalidate();
    }
    beforeRender() {

    }
    removeComponent(){
        clearTimeout(this.timeout);
        this.element.remove();
    }
}