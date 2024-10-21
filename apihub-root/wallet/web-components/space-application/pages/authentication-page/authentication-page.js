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

    beforeRender() {
        this.inviteToken = window.location.hash.split("/")[2];
        this.dataSubpage = this.element.getAttribute("data-subpage");
        if (this.inviteToken && this.dataSubpage !== "register-confirmation-with-invite") {
            this.dataSubpage = "register-page";
        }
        switch (this.dataSubpage) {
            case "register-page": {
                let hiddenClass = this.inviteToken ? "hidden" : "email";
                this.subpage = ` <div>
             <div class="form-title">
             Registration
             </div>
             <form>
                    <div class="form-item" id="${hiddenClass}">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" placeholder="Add e-mail">
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
                        <button type="button" class="general-button" data-local-action="registerUser">${this.inviteToken?"Create Account":"Get Secret Token"}</button>
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
                            <p>Account Created Successfully. You're being redirected to log in</p>
                        </label>
                    </div>
              </div>`;
                break;
            }
            case "password-reset-successfully": {
                this.subpage = `
              <div>
                   <div class="form-item">
                        <label class="form-label">
                            <p>Password Reset Successfully. You're being redirected to log in</p>
                        </label>
                    </div>
              </div>`;
                break;
            }
            case "password-recovery": {
                this.subpage = `
              <div>
                  <div class="form-title">
                   Password Reset
                  </div>
                  <div class="form-description">
                  We will send you a verification code to reset your password. Make sure to also check your spam and trash folder.
                  </div>
                  <form>
                   <div class="form-item" id="email">
                        <label class="form-label" for="user-email">E-mail</label>
                        <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="E-mail Address">
                    </div>
                    <div class="form-item" id="password">
                        <label class="form-label" for="user-password">New Password</label>
                        <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="New password" autocomplete="new-password">
                    </div>
                    <div class="form-item" id="confirm-password">
                        <label class="form-label" for="user-password-confirm">Confirm new Password</label>
                        <input class="form-input" name="password-confirm" type="password" data-condition="checkPasswordConfirmation" data-id="user-password-confirm" id="user-password-confirm" required placeholder="Confirm password" autocomplete="new-password">
                    </div>
                       <div class="form-item" style="visibility:hidden">
                        <label class="form-label" for="password-reset-code">Verification Code</label>
                        <input class="form-input" name="password-reset-code" type="text" data-id="password-reset-code" id="password-reset-code" placeholder="Ex: 123456">
                    </div>

                    <div class="form-footer spaced-buttons">
                        <button type="button" id="regenerate-verification-code" class="general-button" data-local-action="generateVerificationCode">Get Verification Code </button>
                        <button type="button"  style="visibility:hidden" id="reset-password-button" class="general-button" data-local-action="resetPassword" disabled>Reset Password</button>
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
                          <input class="form-input" name="email" type="email" data-id="user-email" id="user-email" required placeholder="Add e-mail" value="${this.demoUserEmail}" autocomplete="email">
                      </div>
                      <div class="form-item">
                          <label class="form-label" for="user-password">Password</label>
                          <input class="form-input" name="password" type="password" data-id="user-password" id="user-password" required placeholder="Add password" value="${this.demoUserPassword}" autocomplete="current-password">
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
        if (this.dataSubpage === "register-confirmation-with-invite") {
            setTimeout(async () => {
                await this.navigateToLoginPage();
            }, 3000);
        }
        if (this.dataSubpage === "password-reset-successfully") {
            setTimeout(async () => {
                await this.navigateToLoginPage();
            }, 3000);
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
    uploadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsArrayBuffer(file);
        });
    }
    async registerUser(_target) {
        let email = this.element.querySelector("#user-email").value;
        let password = this.element.querySelector("#user-password").value;
        let photoFile = this.element.querySelector("#photo").files[0];
        let imageId;
        if(this.inviteToken){
            email = "";
        }else if(!email){
            alert("Email is required");
            return;
        }
        if(!password){
            alert("Password is required");
            return;
        }
        if(photoFile){
            if(photoFile.size <= 1048576 * 5){
                let arrayBuffer = await this.uploadImage(photoFile);
                try {
                    imageId = await spaceModule.putImage(arrayBuffer);
                } catch (e) {
                    alert("User image upload failed");
                }
            } else {
                alert("Image too large! Image max size: 5MB");
                return;
            }
        }
        try {
            this.loader = assistOS.UI.showLoading();
            await userModule.registerUser(email, password, imageId, this.inviteToken);
        } catch (error) {
            let message = JSON.parse(error.message);
            switch (message.status) {
                case 409:
                    alert("User Already Registered with this Email Address");
                    break;
                default:
                    alert(message.message);
            }
            this.invalidate(async () => {
                if(this.inviteToken){
                    this.element.setAttribute("data-subpage", "register-confirmation-with-invite")
                }else {
                    this.element.setAttribute("data-subpage", "register-page")
                }
            });
        } finally {
            await assistOS.UI.hideLoading(this.loader);
            delete this.loader;
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

    async activateUser() {
        const activationToken = this.element.querySelector("#user-token").value;
        try {
            await userModule.activateUser(activationToken);
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page");
        } catch (error) {
            alert(`Activation failed: Invalid Activation Token`)
        }
    }

    async loginUser(_target) {
        const formInfo = await assistOS.UI.extractFormInformation(_target);
        if (formInfo.isValid) {
            const {email, password} = formInfo.data;
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

    async generateVerificationCode(_target) {
        const regenerateCodeButton = _target
        regenerateCodeButton.removeAttribute("data-local-action");
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

        const formInfo = await assistOS.UI.extractFormInformation(regenerateCodeButton, conditions);
        if (formInfo.isValid) {
            const generateNewResetCode = async (email, password) => {
                await assistOS.loadifyFunction(userModule.generateVerificationCode, email, password);
                let timer = 60;
                regenerateCodeButton.disabled = true;
                regenerateCodeButton.innerHTML = `Regenerate Code (${timer}s)`;
                let intervalId = setInterval(() => {
                    timer--;
                    if (timer === 0) {
                        clearInterval(intervalId);
                        regenerateCodeButton.innerHTML = "Get Verification Code";
                        regenerateCodeButton.disabled = false;
                    } else {
                        regenerateCodeButton.innerHTML = `Regenerate Code (${timer}s)`;
                        regenerateCodeButton.disabled = true;
                    }
                }, 1000);
            }
            const {email, password} = formInfo.data;
            try {
                await generateNewResetCode(email, password);

                const resetPasswordButton = this.element.querySelector("#reset-password-button");
                resetPasswordButton.style.visibility = "visible";
                resetPasswordButton.addEventListener('click', async () => {
                    try {
                        const code = this.element.querySelector("#password-reset-code").value;
                        await assistOS.loadifyFunction(userModule.resetPassword, email, password, code);
                        this.invalidate(async () => {
                            this.element.setAttribute("data-subpage", "password-reset-successfully")
                        });
                    } catch (error) {
                        switch(error.statusCode){
                            case 401:
                                alert("Invalid Verification Code");
                                break;
                            case 404:
                                alert("No code has been generate for the user");
                                break;
                            case 410:
                                alert("Verification code has expired");
                                break;
                            default:
                                alert(error.message);
                        }

                    }
                })
                const resetCodeField = this.element.querySelector("#password-reset-code");
                resetCodeField.style.visibility = "visible";
                resetCodeField.required = true;
                resetCodeField.addEventListener("input", (event) => {
                    const regex = /^[0-9]{6}$/;
                    if (regex.test(event.target.value)) {
                        resetPasswordButton.removeAttribute("disabled");
                    } else {
                        resetPasswordButton.setAttribute("disabled", "true");
                    }
                });

                const emailField = this.element.querySelector("#email");
                emailField.remove();
                const passwordField = this.element.querySelector("#password");
                passwordField.remove();
                const passwordConfirmField = this.element.querySelector("#confirm-password");
                passwordConfirmField.remove();

                regenerateCodeButton.addEventListener("click", async () => await generateNewResetCode(email, password));

            } catch (error) {
                alert(error.message);
            }
        } else {
            console.log("Form invalid");
        }
    }


}
