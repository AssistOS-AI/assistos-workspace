export class confirmationPopup {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
       this.message = this.element.getAttribute("data-message");
       this.left = this.element.getAttribute("data-left");
    }

    afterRender(){
        this.element.style.display = 'flex';
        this.element.style.left = this.left + 'px';
        setTimeout(()=> {
            this.element.style.opacity = '1';
        }, 10); // Delay for a very short time to trigger the transition effect
        setTimeout(()=> {
            this.element.style.opacity = '0';
            setTimeout(()=> {
                this.element.style.display = 'none';
                this.element.remove();
            }, 500); // Hide the popup after 1 second
        }, 500); // Show the popup for 1 second
    }
}
