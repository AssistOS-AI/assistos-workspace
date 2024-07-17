export class ClientDisconnectModal{
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        this.disconnectReason=this.element.getAttribute("data-reason");
        this.redirectTime = 5;
    }
    afterRender(){
        const redirectElement = this.element.querySelector("#redirect-time");
        let redirectTime = this.redirectTime;
        const interval = setInterval(() => {
            if (redirectTime > 0) {
                redirectTime--;
                redirectElement.innerHTML = redirectTime;
            } else {
                clearInterval(interval);
                window.location = "/";
            }
        }, 1000);
    }
}