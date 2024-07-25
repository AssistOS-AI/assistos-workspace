import {getDemoUserCredentials} from "../../../../imports.js";

let User = require("assistos").loadModule("user", {});
User = {
    apis: User,
    constants: User.constants
}

export class AuthenticationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        this.rotations = 0;
        [this.demoUserEmail, this.demoUserPassword] = getDemoUserCredentials();
        this.inviteToken = window.location.hash.split("/")[2];
    }

    beforeRender() {
        switch (this.element.getAttribute("data-subpage")) {
            case "register-page": {
                let hiddenClass = this.inviteToken ? "hidden" : "email";
                let requiredEmail = this.inviteToken ? "" : "required";
                this.subpage = ` <div>
             <div class="form-title">
             Registration
             </div>
             <form>
                    <div class="form-item" id="${hiddenClass}">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" ${requiredEmail} placeholder="Add e-mail">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password">Password</label>
                        <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add password">
                    </div>
                     <div class="form-item">
                        <label class="form-label" for="photo">Profile Picture</label>
                        <input class="form-input"  accept="image/png, image/jpeg" data-condition="verifyPhotoSize" name="photo" type="file" data-id="photo" id="photo" placeholder="Select a Profile Image">
                    </div>
                    <div class="form-footer">
                        <button type="button" class="general-button" data-local-action="registerUser">Get Secret Token</button>
                    </div>
                </form>
           </div>`;
                break;
            }
            case "login-new-device": {
                this.subpage = `
               <div>
                  <div class="form-title">
                   Log in
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-token">Enter the secret token or just click the link we just sent you by email.</label>
                        <input class="form-input" name="token" type="text" data-id="user-token" id="user-token" required placeholder="Add secret token">
                    </div>
                    <div class="form-footer">
                        <button class="general-button" data-local-action="loginUser">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="loginUser">
                        Log in development mode
                    </div>        
                </form>
              </div>
          `;
                break;
            }
            case "register-confirmation": {
                this.subpage = `
              <div>
                   <div class="form-item">
                        <label class="form-label">
                            <p>Thank you for registering with us! A confirmation email has been sent to your email address!</p>
                        </label>
                    </div>
              </div>`;
                break;
            }
            case "register-confirmation-with-invite": {
                delete this.inviteToken;
                this.subpage = `
              <div>
                   <div class="form-item">
                        <label class="form-label">
                            <p>Account Created! Click here to login into your new account.</p>
                            <button class="general-button" data-local-action="navigateToLoginPage">Log in</button>
                        </label>
                    </div>
              </div>`;
                break;
            }
            case "password-recovery": {
                this.subpage = `
              <div>
                  <div class="form-title">
                   Password Recovery
                  </div>
                  <div class="form-description">
                  Before you introduce your email and new password, we will send you a verification link on your email.
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password">New Password</label>
                        <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add new password">
                    </div>
                    <div class="form-item">
                        <label class="form-label" for="user-password-confirm">Confirm new Password</label>
                        <input class="form-input" name="password-confirm" type="password" data-condition="checkPasswordConfirmation" data-id="user-password-confirm" id="user-password-confirm" required placeholder="Confirm new password">
                    </div>
                    <div class="form-footer">
                        <button type="button" class="general-button" data-local-action="beginPasswordRecovery">Set New Password</button>
                    </div>
                </form>
              </div>`;
                break;
            }
            case "password-recovery-confirmation": {
                this.subpage = `
              <div>
                  <div class="form-title">
                   Password Recovery
                  </div>
                  <form>
                   <div class="form-item">
                        <label class="form-label" for="user-token">Enter the secret token or just click the link we just sent you by email.</label>
                        <input class="form-input" name="token" type="text" data-id="user-token" id="user-token" required placeholder="Add secret token">
                    </div>
                    <div class="form-footer">
                        <button type="button" class="general-button" data-local-action="finishPasswordRecovery">Log in</button>
                    </div>
                    <div class="development-mode" data-local-action="finishPasswordRecovery">
                        Log in development mode
                    </div>        
                </form>
              </div>`;
                break;
            }
            default: {
                this.subpage = `
               <div>
                  <div class="form-title">
                      
                  </div>
                  <form>
                      <div class="form-item">
                          <label class="form-label" for="user-email">E-mail</label>
                          <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail" value="${this.demoUserEmail}">
                      </div>
                      <div class="form-item">
                          <label class="form-label" for="user-password">Password</label>
                          <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add password" value="${this.demoUserPassword}">
                      </div>
                      <div class="forgot-password" data-local-action="navigateToPasswordRecoveryPage">
                          Forgot password?
                      </div>
                      <div class="form-footer">
                          <button type="button" class="general-button" data-local-action="loginUser">Log in</button>
                      </div>
                      <div class="suggest-registration">
                          <div>
                              Don't have an account?
                          </div>
                          <div class="sign-up" data-local-action="navigateToRegisterPage">
                              Sign Up
                          </div>
                      </div>
                  </form>
              </div>
          `;
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

    async navigateToRegisterPage() {
        await this.navigateToPage("register-page");
    }

    async navigateToLoginPage() {
        await this.navigateToPage("login-page");
    }

    async registerUser(_target) {
        const verifyPhotoSize = (element) => {
            return !element.files[0] ? true : element.files[0].size <= 1048576;
        };
        const conditions = {
            "verifyPhotoSize": {
                fn: verifyPhotoSize,
                errorMessage: "Image too large! Image max size: 1MB"
            }
        };
        const formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            this.formData = formInfo.data;
            const {email, password, photo} = formInfo.data;
            try {
                await User.apis.registerUser(email, password, photo || undefined, this.inviteToken);
            }catch(error){
                switch(error.statusCode){
                    case 409:
                        alert("User Already Registered with this Email Address");
                        break;
                    default:
                        alert(error.message);
                }
            }
            if (this.inviteToken) {
                this.invalidate(async () => {
                    this.element.setAttribute("data-subpage", "register-confirmation-with-invite")
                })
            } else {
                this.invalidate(async () => {
                    this.element.setAttribute("data-subpage", "register-confirmation")
                })
            }

        }
    }

    async activateUser() {
        const activationToken = this.element.querySelector("#user-token").value;
        try {
            await User.apis.activateUser(activationToken);
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page");
        } catch (error) {
            alert(`Activation failed: Invalid Activation Token`)
        }
    }

    async loginUser(_target) {
        const formInfo = await assistOS.UI.extractFormInformation(_target);
        if (formInfo.isValid) {
            const { email, password } = formInfo.data;
            try {
                await assistOS.login(email, password);
                try {
                    await assistOS.loadPage(true);
                } catch (error) {
                    console.error("Failed to load Landing Page", error);
                    alert(error);
                }
            } catch (error) {
                switch (error.statusCode) {
                    case 401:
                        alert("Invalid Password");
                        break;
                    case 404:
                        alert("User not found");
                        break;
                    default:
                        alert(error.message);
                }
            }
        }
    }


    async navigateToPasswordRecoveryPage() {
        await this.navigateToPage("password-recovery");
    }

    async beginPasswordRecovery(_target) {
        const checkPasswordConfirmation = (confirmPassword) => {
            let password = document.querySelector("#user-password");
            return password.value === confirmPassword.value;
        }

        const conditions = {
            "checkPasswordConfirmation": {
                fn: checkPasswordConfirmation,
                errorMessage: "Passwords do not match!"
            }
        };
        const formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if (formInfo.isValid) {
            if (await User.apis.recoverPassword(formInfo.data.email, formInfo.data.password)) {
                await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page", {subpage: "password-recovery-confirmation"});
            } else {
                console.log("Failed to recover password");
            }
        } else {
            console.log("Form invalid");
        }

    }

    async finishPasswordRecovery() {
        if (await User.apis.confirmRecoverPassword()) {
            window.location = "";
        } else {
            console.error("Failed to confirm password recovery");
        }
    }

}