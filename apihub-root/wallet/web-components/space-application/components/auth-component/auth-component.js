let userModule = require("assistos").loadModule("user", { userId: "*" });
let spaceModule = require("assistos").loadModule("space", { userId: "*" });

import { passKeyLogin, passKeyRegister } from "./passkeyUtils.js";

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email)
}
async function checkPasskeyAvailability() {
    let available = true;
    if (window.PublicKeyCredential) {
        try {
            available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (err) {
            available = false;
            console.error("Error checking platform authenticator availability:", err);
        }
    } else {
        available = false;
        console.log("WebAuthn is not supported in this browser.");
    }
    return available;
}
export class AuthComponent {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.authMethods = this.element.variables["auth-methods"].split(",");
        this.referer = assistOS.UI.getURLParams().ref;
        this.auth_step = this.element.variables["page-mode"] || sessionStorage.getItem("auth_step") || "login";
        this.email_code_auth = "";
        this.passkey_auth = "";
        this.totp_auth = "";
        this.selected_method = this.authMethods.includes("passkey") ? "passkey" : this.authMethods[0];
        this.invalidate();
    }

    beforeRender() {

    }

    async afterRender() {
        // Query elements relative to this.element
        const emailInput = this.element.querySelector(".email_input");
        const submitEmailButton = this.element.querySelector(".submit_email_button");
        const codeInput = this.element.querySelector(".code_input");
        const submitCodeButton = this.element.querySelector(".submit_code_button");
        const authSelect = this.element.querySelector(".auth_method_select");
        emailInput.addEventListener("input", (event) => {
            if (!isValidEmail(event.target.value)) {
                event.target.classList.add("invalid_email");
                submitEmailButton.classList.add("disabled");
            } else {
                event.target.classList.remove("invalid_email"); // Also remove the class if valid
                submitEmailButton.classList.remove("disabled");
            }
        });

        emailInput.addEventListener("keydown", (event) => {
            if (event.key === 'Enter' && !submitEmailButton.hasAttribute("disabled")) {
                submitEmailButton.click();
            }
        });

        codeInput.addEventListener("keydown", (event) => {
            if (event.key === 'Enter' && !submitCodeButton.hasAttribute("disabled")) {
                submitCodeButton.click();
            }
        });

        codeInput.addEventListener("input", (event) => {
            if (event.target.value.length < 5) {
                submitCodeButton.classList.add("disabled");
            } else {
                submitCodeButton.classList.remove("disabled");
            }
        });

        this.setAuthStep(this.auth_step);
    }

    async setRegisterOptions() {
        this.auth_options = "";
        for (const method of this.authMethods) {
            let option = "";
            if (method === "emailCode") {
                this.email_code_auth = "enabled";
                option = `<label class="radio_container choice pointer emailCode">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="emailCode"></custom-radio>
                                <section class="label">Email Code</section>
                                <section class="icon"></section>
                            </label>`;
            }
            if (method === "passkey") {
                let available = await checkPasskeyAvailability()

                if (!available) {
                    this.selected_method = this.authMethods[0];
                    continue;
                }
                this.passkey_auth = "enabled";
                option = `<label class="radio_container choice pointer passkey">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="passkey"></custom-radio>  
                                <section class="label">Passkey</section>
                                <section class="icon"></section>
                            </label>`;
            }

            if (method === "totp") {
                this.totp_auth = "enabled";
                option = `<label class="radio_container choice pointer totp">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="totp"></custom-radio>
                                <section class="label">Authenticator (OTP)</section>
                                <section class="icon"></section>
                            </label>`;
            }
            this.auth_options = `${this.auth_options} ${option}`;

        }
        this.element.querySelector(".auth_methods_section").innerHTML = `${this.auth_options}`;
        this.element.querySelector(".actions_container").innerHTML = `
        <button class="submit_auth_method_button auth-button" data-local-action="signupSubmit">Register</button>
        <button class="cancel_auth_method_button auth-button gray-background" data-local-action="changeAuthType" auth-type="signup">Cancel</button>`;

        this.addAuthMethodsListeners();
    }

    setLoginOptions(options) {
        this.auth_options = "";
        for (const method of options) {
            let option = "";
            if (method.type === "emailCode") {
                this.email_code_auth = "enabled";
                option = `<label class="radio_container choice pointer emailCode">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="emailCode"></custom-radio>
                                <section class="label">Email Code</section>
                                <section class="icon"></section>
                            </label>`;
            }
            if (method.type === "passkey") {
                this.passkey_auth = "enabled";
                option = `<label class="radio_container choice pointer passkey">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="passkey" passkey-id="${method.id}"></custom-radio>
                                <section class="label">${method.name}</section>
                                <section class="icon"></section>
                            </label>`;
            }

            if (method.type === "totp") {
                if (!method.enabled || method.setupPending) {
                    this.selected_method = this.selected_method === method.type ? "emailCode" : this.selected_method;
                } else {
                    this.totp_auth = "enabled";
                    option = `<label class="radio_container choice pointer totp">
                                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="totp"></custom-radio>
                                <section class="label">Authenticator (OTP)</section>
                                <section class="icon"></section>
                            </label>`;
                }
            }
            this.auth_options = `${this.auth_options} ${option}`;

        }
        this.element.querySelector(".auth_methods_section").innerHTML = `${this.auth_options} `;
        this.element.querySelector(".actions_container").innerHTML = `
        <button class="submit_auth_method_button auth-button" data-local-action="submitLoginMethod">Log In</button>
        <button class="cancel_auth_method_button auth-button gray-background" data-local-action="changeAuthType" auth-type="login">Cancel</button>`;

        this.addAuthMethodsListeners();
    }

    addAuthMethodsListeners() {
        const radios = document.querySelectorAll('custom-radio[data-name="auth_method"]');
        const labels = document.querySelectorAll('.radio_container');
        labels.forEach(label => {
            label.addEventListener('click', event => {
                const radio = label.querySelector('custom-radio');
                if (radio) {
                    radio.webSkelPresenter.selectRadio(radio.firstElementChild);
                }
            });
        })
        radios.forEach(radio => {
            radio.addEventListener('change', event => {
                if (this.element.querySelector(".choice.selected")) {
                    this.element.querySelector(".choice.selected").classList.remove('selected');
                }
                event.target.parentElement.classList.add('selected');
                this.element.querySelector(".auth_container").setAttribute("selected-auth", event.value);
                this.selected_method = event.value;
            });
            let value = radio.getAttribute("data-value");
            if (value === this.selected_method) {
                radio.setAttribute("data-selected", "true");
                radio.parentElement.classList.add('selected');
                this.element.querySelector(".auth_container").setAttribute("selected-auth", value);
            }
        });
    }
    async cancelAuth() {
        await assistOS.UI.changeToDynamicPage("landing-page", "landing-page");
    }
    async submitCode() {
        clearTimeout(this.timeout);
        try {
            await userModule.walletLogin(this.email, this.element.querySelector(".code_input").value, "emailCode");
            // Store the email in localStorage for later use
            localStorage.setItem("userEmail", this.email);
            let spaceId;
            if (this.createSpace) {
                let spaceName = this.email.split('@')[0];
                await assistOS.UI.showLoading();
                spaceId = await spaceModule.createSpace(spaceName);
                await assistOS.UI.hideLoading();
            }
            await assistOS.loadPage(this.email, spaceId);
        } catch (err) {
            if (err.details && err.details.status === 403) {
                let modal = await showApplicationError("Exceeded number of attempts", `Exceeded number of attempts. Login is locked for ${new Date(err.details.detailsData.lockTime).getMinutes()} minutes`);
                setTimeout(async () => {
                    if (modal) {
                        await assistOS.UI.closeModal(modal);
                    }
                }, err.details.detailsData.lockTime);
            } else {
                await showApplicationError("Error", "error", assistOS.UI.sanitize(err.details || err.message));
            }
        }
    }

    async waitGetCode(email, ref) {
        let resp = await userModule.generateAuthCode(email, ref, "emailCode");
        this.element.querySelector(".auth_type_wrapper").style.display = "none";
        this.element.querySelector(".code_submit_section").style.display = "flex";
        let codeInput = this.element.querySelector(".code_input");
        if (resp.code) {
            codeInput.value = resp.code;
            let submitCodeButton = this.element.querySelector(".submit_code_button");
            submitCodeButton.classList.remove('disabled');
        }
        // Use .bind(this) to ensure 'this' inside activateCodeButton refers to the LoginPage instance
        this.timeout = setTimeout(() => {
            window.location.reload()
        }, 2 * 60 * 1000);
    }

    totpLogin() {
        this.element.querySelector(".auth_type_wrapper").style.display = "none";
        this.element.querySelector(".totp_login_section").style.display = "flex";
        // Setup TOTP input validation
        const totpInput = document.querySelector(".totp_login_section .totp_input");
        const totpButton = document.querySelector(".totp_login_section .totp_action_button");
        totpInput.addEventListener("input", (event) => {
            if (event.target.value.length === 6 && /^\d{6}$/.test(event.target.value)) {
                totpButton.classList.remove("disabled");
            } else {
                totpButton.classList.add("disabled");
            }
        });
    }
    changeAuthType(_target) {
        this.setAuthStep(_target.getAttribute("auth-type"));
    }
    setAuthStep(stepName) {
        this.auth_step = stepName;
        sessionStorage.setItem("auth_step", this.auth_step);
        const formTitle = this.element.querySelector(".header .title");
        this.element.querySelector(".auth_container").classList.add("auth_step1");
        this.element.querySelector(".auth_container").removeAttribute("selected-auth");
        this.element.querySelector(".email_wrapper .input_container .submit_email_button").style.display = "block";
        this.element.querySelector(".email_wrapper .input_container .email_input").readOnly = false;
        this.element.querySelector(".submit_email_button").textContent = "Next";
        let separator = this.element.querySelector(".separator");
        separator.classList.remove("hidden");
        let footerSeparator = this.element.querySelector(".footer-separator");
        footerSeparator.classList.add("hidden");
        if (stepName === "login") {
            formTitle.textContent = "Login";
        } else {
            formTitle.textContent = "Register";
        }

        this.element.querySelector(".auth_container").setAttribute("auth-step", this.auth_step);
    }

    async submitStep1() {
        this.element.querySelector(".auth_container").classList.remove("auth_step1");
        this.element.querySelector(".email_wrapper .input_container .submit_email_button").style.display = "none";
        this.element.querySelector(".email_wrapper .input_container .email_input").readOnly = true;
        if (this.auth_step === "login") {
            const result = await userModule.getAuthTypes(this.email);
            this.setLoginOptions(result.authMethods);
        } else {
            await this.setRegisterOptions();
            this.element.querySelector(".auth_container").setAttribute("selected-auth", this.selected_method);
        }
    }

    async submitLoginMethod() {
        try {
            if (this.selected_method === "passkey") {
                await passKeyLogin(this.email, this.passkeyData.publicKeyCredentialRequestOptions, this.passkeyData.challengeKey);
            }
            if (this.selected_method === "totp") {
                this.totpLogin(this.email);
            }
            if (this.selected_method === "emailCode") {
                await this.waitGetCode(this.email);
            }
        } catch (err) {
            if (err.details && err.details.status === 403) {
                let lockModal = await assistOS.UI.showModal("lock-login", {
                    message: `Exceeded number of attempts. Login is locked for ${new Date(err.details.detailsData.lockTime).getMinutes()} minutes`,
                })
                setTimeout(async () => {
                    if (lockModal) {
                        await assistOS.UI.closeModal(lockModal);
                    }
                }, err.details.detailsData.lockTime);
            } else {
                console.error(err.details);
                await showApplicationError("Error", err.details || err.message);
            }
        }

    }

    async signupSubmit(button) {
        button.classList.add("disabled");
        try {
            if (this.selected_method === "emailCode") {
                this.createSpace = true;
                await this.waitGetCode(this.email, this.referer);
            }
            if (this.selected_method === "passkey") {
                await passKeyRegister(this.email, this.referer);
            }
            if (this.selected_method === "totp") {
                this.element.querySelector(".auth_type_wrapper").style.display = "none";
                let totpResult = await userModule.generateAuthCode(this.email, this.referer || "", "totp");
                totpResult = encodeURIComponent(JSON.stringify(totpResult));
                this.element.querySelector(".totp_register_section").innerHTML = `<totp-register data-presenter="totp-register" totp-result="${totpResult}" email="${this.email}"></totp-register>`
                this.element.querySelector(".totp_register_section").style.display = "block";
                this.element.addEventListener("totp-verified", async (event) => {
                    try {
                        await this.submitTotpCode(event.detail.token, true);
                    } catch (e) {
                        console.log("Error submitting TOTP code", e);
                        this.element.querySelector(".totp_register_section").style.display = "none";
                        this.element.querySelector(".totp_login_section").style.display = "flex";
                    }
                })
            }
        } catch (err) {
            if (err.details && err.details.status === 403) {
                let lockModal = await assistOS.UI.showModal("lock-login", {
                    message: `Exceeded number of attempts. Login is locked for ${new Date(err.details.detailsData.lockTime).getMinutes()} minutes`,
                })
                setTimeout(async () => {
                    if (lockModal) {
                        await assistOS.UI.closeModal(lockModal);
                    }
                }, err.details.detailsData.lockTime);
            } else {
                if (err.name !== "NotAllowedError") {
                    let errModal = await showApplicationError("Error", err.message);
                    errModal.addEventListener("close", async () => {
                        await assistOS.UI.changeToDynamicPage("landing-page", "landing-page");
                    });
                }
            }
        } finally {
            button.classList.remove("disabled");
        }
    }

    async totpCodeSubmit() {
        let token = this.element.querySelector(".totp_login_section .totp_input").value;
        try {
            await this.submitTotpCode(token);
        } catch (err) {
            console.error(err)
            await showApplicationError("Error", assistOS.UI.sanitize(err.message));
        }
    }

    async submitTotpCode(token, createSpace) {
        if (!token || !/^\d{6}$/.test(token)) {
            throw new Error("Please enter a valid 6-digit code");
        }
        // Verify TOTP code for login
        const result = await userModule.verifyTotp(token, this.email);
        if (result.operation === "success") {
            let spaceId;
            if (createSpace) {
                let spaceName = this.email.split('@')[0];
                await assistOS.UI.showLoading();
                spaceId = await spaceModule.createSpace(spaceName);
                await assistOS.UI.hideLoading();
            }
            await assistOS.loadPage(this.email, spaceId);
        } else {
            throw new Error("Invalid authentication code");
        }
    }

    async submitEmail() {
        this.email = this.element.querySelector(".email_input").value.trim();
        let separator = this.element.querySelector(".separator");
        separator.classList.add("hidden");
        let footerSeparator = this.element.querySelector(".footer-separator");
        footerSeparator.classList.remove("hidden");
        this.accountCheck = await userModule.userExists(this.email);
        this.passkeyData = {
            publicKeyCredentialRequestOptions: this.accountCheck.publicKeyCredentialRequestOptions,
            challengeKey: this.accountCheck.challengeKey
        }
        if (this.publicKeyCredentialRequestOptions) {
            this.publicKeyCredentialRequestOptions = JSON.parse(this.passkeyData.publicKeyCredentialRequestOptions);
        }
        if (this.auth_step === "signup") {
            if (this.accountCheck.account_exists) {
                let loginConfirmation = await assistOS.UI.showModal("confirm-action-modal", {
                    message: `We found an account for ${this.email}. Do you want to login with this email?`,
                }, true);

                if (loginConfirmation) {
                    this.selected_method = this.accountCheck.activeAuthType;
                    this.setAuthStep("login");
                    return await this.submitStep1();
                } else {
                    return;
                }
            }
            await this.submitStep1();
            //await this.signupSubmit(this.selected_method, this.email);
        }
        if (this.auth_step === "login") {
            if (!this.accountCheck.account_exists) {
                let signUpConfirmation = await assistOS.UI.showModal("confirm-action-modal", {
                    message: `We couldn't find an account for ${this.email}. Do you want to create a new account with this email?`,
                }, true);

                if (signUpConfirmation) {
                    this.auth_step = "signup";
                    await this.submitStep1();
                    return //await this.signupSubmit(this.selected_method, this.email);
                } else {
                    return;
                }
            }
            this.selected_method = this.accountCheck.activeAuthType;
            await this.submitStep1();
        }
    }

}
