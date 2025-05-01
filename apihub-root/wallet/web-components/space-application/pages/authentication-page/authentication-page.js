import {getDemoUserCredentials} from "../../../../imports.js";

let userModule = require("assistos").loadModule("user", {});
const spaceModule = require("assistos").loadModule("space", {});

export class AuthenticationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.rotations = 0;
        [this.demoUserEmail, this.demoUserPassword] = getDemoUserCredentials();
        this.invalidate();
    }

    async beforeRender() {
        this.inviteToken = window.location.hash.split("/")[2];
        this.dataSubpage = this.element.getAttribute("data-subpage");
        switch (this.dataSubpage) {
            case "register-confirmation": {
                this.subpage = `
              <div>
                   <div class="form-item">
                        <label class="form-label" for="authCode">
                            <p>Enter the code that has been sent to your email</p>
                            <input type="text" name="authCode" id="authCode" class="form-input" value="${this.authCode || ''}">
                        </label>
                        <button type="button" data-local-action="submitCode" class="general-button">Submit</button>
                    </div>
              </div>`;
                break;
            }
            default: {
                this.subpage = ` 
                <form class="log-in-form">
                    <div class="form-item">
                        <label class="form-label" for="user-email">Enter your E-mail to begin using AssistOS</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" placeholder="Add e-mail">
                    </div>
                    <div class="form-footer">
                        <button type="button" class="general-button" data-local-action="generateCode">Submit</button>
                    </div>
                </form>`;
                break;
            }
        }
    }

    sendFormOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.element.querySelector(".general-button").click();
        }
    }

    afterRender() {
        this.carousel = this.element.querySelector(".images");
        this.dots = this.element.querySelectorAll(".dot");
        setTimeout(async () => {
            await this.startSlideshow(0);
        });
        let inputs = this.element.querySelectorAll("input");
        this.lastInput = inputs[inputs.length - 1];
        if (this.lastInput) {
            this.lastInput.removeEventListener("keypress", this.boundFn);
            this.boundFn = this.sendFormOnEnter.bind(this);
            this.lastInput.addEventListener("keypress", this.boundFn);
        }
        if(this.dataSubpage === "successful-activation"){
            const innerElement = this.element.querySelector('#successful-activation');
            let time =5;
            let intervalId = setInterval(async ()=>{
                if(time === 0){
                    clearInterval(intervalId);
                    this.dataSubpage = "login-page";
                    this.invalidate();
                }
                innerElement.innerHTML =`Account Activated! Redirecting to log in page in ${time} seconds`
                time--;
            },1000)
        }
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

    async navigateToPage(subpage) {
        if (this.inviteToken) {
            await assistOS.UI.changeToDynamicPage("authentication-page", `authentication-page/inviteToken/${this.inviteToken}`, {subpage: subpage});
        } else {
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page", {subpage: subpage});
        }
    }


    async generateCode(_target) {
        let email = this.element.querySelector("#user-email").value;
        if (!email) {
            alert("Email is required");
            return;
        }
        let loader = assistOS.UI.showLoading();
        let result = await userModule.userExists(email);
        await assistOS.UI.hideLoading(loader);
        if(result.userExists){
            result = await userModule.generateAuthCode(email, "email");
            this.email = email;
        } else {
            let signUpMessage = `We couldn't find an account for ${email}. Do you want to create a new account with this email?`;
            let signUpConfirmation = await assistOS.UI.showModal("confirm-action-modal", {
                message: signUpMessage
            }, true);
            if (signUpConfirmation) {
                result = await userModule.generateAuthCode(email, "emailCode");
                this.email = email;
                this.createSpace = true;
            } else {
                return;
            }
        }
        this.authCode = result.code;
        this.invalidate(async () => {
            this.element.setAttribute("data-subpage", "register-confirmation")
        })
    }
    async submitCode(_target) {
        let authCode = this.element.querySelector("#authCode").value;
        let result = await userModule.loginUser(this.email, authCode, "emailCode");
        if(result.operation !== "success"){
            throw new Error(result.message);
        }
        if(this.createSpace){
            let spaceName = this.email.split('@')[0];
            await assistOS.UI.showLoading();
            await spaceModule.createSpace(spaceName);
            await assistOS.UI.hideLoading();
        }
        await assistOS.UI.showLoading();
        await assistOS.loadPage(this.email);
        if (!assistOS.user.imageId) {
            let uint8Array = await this.generateUserAvatar(this.email);
            assistOS.user.imageId = await spaceModule.putImage(uint8Array);
            await userModule.updateUserImage(assistOS.user.email, assistOS.user.imageId);
        }
        await assistOS.UI.hideLoading();
    }
    async generateUserAvatar(email, size = 100) {
        let firstLetter = email.charAt(0).toUpperCase();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Generate a random background color
        ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, size / 2, size / 2);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        canvas.remove();
        return uint8Array;
    }

}
