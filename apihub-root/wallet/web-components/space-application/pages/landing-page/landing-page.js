export class LandingPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.rotations = 0;
        this.invalidate();
    }

    async beforeRender() {}


    afterRender() {
        this.carousel = this.element.querySelector(".images");
        this.dots = this.element.querySelectorAll(".dot");
        setTimeout(async () => {
            await this.startSlideshow(0);
        });
    }

    async startSlideshow(milliseconds) {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(milliseconds);
        this.intervalId = setInterval(this.nextImage.bind(this, "", -1), 3000);
    }

    async setCurrentImage(_target, position) {
        clearInterval(this.intervalId);
        this.dots.forEach((dot) => {
            dot.classList.remove("active");
        });
        _target.classList.add("active");
        if (position === "1") {
            this.rotations = 0;
            this.carousel.style.transform = "translateX(0%)"
        } else if (position === "2") {
            this.rotations = -33;
            this.carousel.style.transform = "translateX(-33%)"
        } else {
            this.rotations = -66;
            this.carousel.style.transform = "translateX(-66%)"
        }
    }

    nextImage(_target, direction, stop) {
        if (stop) {
            clearInterval(this.intervalId);
        }
        this.dots.forEach((dot) => {
            dot.classList.remove("active");
        });
        this.rotations += parseInt(direction) * 33;
        if (this.rotations < -67) {
            this.rotations = 0;
        }
        if (this.rotations > 1) {
            this.rotations = -66;
        }
        this.carousel.style.transform = `translateX(${this.rotations}%)`;
        if (this.rotations === 0) {
            this.dots[0].classList.add("active");
        } else if (this.rotations === -33) {
            this.dots[1].classList.add("active");
        } else {
            this.dots[2].classList.add("active");
        }
    }

    async navigateToLoginPage(targetElement, actionType) {
        await assistOS.UI.changeToDynamicPage("login-page", `login-page`, {"authtype": actionType});
    }
}
