/* AuthComponent.js – cleaned-up, syntax-valid */

let userModule = AssistOS.loadModule("user", { userId: "*" });
let spaceModule = AssistOS.loadModule("space", { userId: "*" });

import { passKeyLogin } from "./passkeyUtils.js";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function checkPasskeyAvailability() {
    if (!window.PublicKeyCredential) return false
    try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    } catch {
        return false
    }
}

export class AuthComponent {
    constructor(element, invalidate) {
        this.element = element
        this.invalidate = invalidate
        this.authMethods = this.element.variables["auth-methods"].split(",")
        this.referer = assistOS.UI.getURLParams().ref
        this.auth_step = this.element.variables["page-mode"] || sessionStorage.getItem("auth_step") || "login"
        this.email_code_auth = ""
        this.passkey_auth = ""
        this.totp_auth = ""
        this.selected_method = this.authMethods.includes("passkey") ? "passkey" : this.authMethods[0]
        this.invalidate()
    }

    beforeRender() { }

    async afterRender() {
        const emailInput = this.element.querySelector(".email_input")
        const submitEmailBtn = this.element.querySelector(".submit_email_button")
        const codeInput = this.element.querySelector(".code_input")
        const submitCodeBtn = this.element.querySelector(".submit_code_button")

        emailInput.addEventListener("input", e => {
            const ok = isValidEmail(e.target.value)
            emailInput.classList.toggle("invalid_email", !ok)
            submitEmailBtn.classList.toggle("disabled", !ok)
        })

        emailInput.addEventListener("keydown", e => {
            if (e.key === "Enter" && !submitEmailBtn.classList.contains("disabled")) submitEmailBtn.click()
        })

        codeInput.addEventListener("keydown", e => {
            if (e.key === "Enter" && !submitCodeBtn.classList.contains("disabled")) submitCodeBtn.click()
        })

        codeInput.addEventListener("input", e => {
            submitCodeBtn.classList.toggle("disabled", e.target.value.length < 5)
        })

        this.setAuthStep(this.auth_step)
    }

    async setRegisterOptions() {
        this.auth_options = `
            <label class="radio_container choice pointer emailCode">
                <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="emailCode"></custom-radio>
                <section class="label">Email Code</section>
                <section class="icon"></section>
            </label>`
        this.element.querySelector(".auth_methods_section").innerHTML = this.auth_options
        this.element.querySelector(".actions_container").innerHTML = `
            <button class="submit_auth_method_button auth-button" data-local-action="signupSubmit">Register</button>
            <button class="cancel_auth_method_button auth-button gray-background" data-local-action="changeAuthType" auth-type="signup">Cancel</button>`
        this.addAuthMethodsListeners()
    }

    setLoginOptions(opts) {
        this.auth_options = ""
        for (const m of opts) {
            let o = ""
            if (m.type === "emailCode") {
                this.email_code_auth = "enabled"
                o = `
                    <label class="radio_container choice pointer emailCode">
                        <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="emailCode"></custom-radio>
                        <section class="label">Email Code</section>
                        <section class="icon"></section>
                    </label>`
            }
            if (m.type === "passkey") {
                this.passkey_auth = "enabled"
                o = `
                    <label class="radio_container choice pointer passkey">
                        <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="passkey" passkey-id="${m.id}"></custom-radio>
                        <section class="label">${m.name}</section>
                        <section class="icon"></section>
                    </label>`
            }
            if (m.type === "totp") {
                if (m.enabled && !m.setupPending) {
                    this.totp_auth = "enabled"
                    o = `
                        <label class="radio_container choice pointer totp">
                            <custom-radio data-presenter="custom-radio" data-name="auth_method" data-value="totp"></custom-radio>
                            <section class="label">Authenticator (OTP)</section>
                            <section class="icon"></section>
                        </label>`
                }
            }
            this.auth_options += o
        }
        this.element.querySelector(".auth_methods_section").innerHTML = this.auth_options
        this.element.querySelector(".actions_container").innerHTML = `
            <button class="submit_auth_method_button auth-button" data-local-action="submitLoginMethod">Log&nbsp;In</button>
            <button class="cancel_auth_method_button auth-button gray-background" data-local-action="changeAuthType" auth-type="login">Cancel</button>`;
        if (!this.passkey_auth) {
            this.selected_method = "emailCode";
        }
        this.addAuthMethodsListeners()
    }

    addAuthMethodsListeners() {
        const radios = this.element.querySelectorAll('custom-radio[data-name="auth_method"]')
        const labels = this.element.querySelectorAll('.radio_container')

        labels.forEach(l => l.addEventListener("click", () => {
            const r = l.querySelector('custom-radio')
            if (r) r.webSkelPresenter.selectRadio(r.firstElementChild)
        }))

        radios.forEach(r => {
            const v = r.getAttribute("data-value")
            if (v === this.selected_method) {
                r.setAttribute("data-selected", "true")
                r.parentElement.classList.add("selected")
                this.element.querySelector(".auth_container").setAttribute("selected-auth", v)
            }
            r.addEventListener("change", e => {
                const sel = this.element.querySelector(".choice.selected")
                if (sel) sel.classList.remove("selected")
                e.target.parentElement.classList.add("selected")
                this.element.querySelector(".auth_container").setAttribute("selected-auth", e.value)
                this.selected_method = e.value
            })
        })
    }

    async cancelAuth() {
        await assistOS.UI.changeToDynamicPage("landing-page", "landing-page")
    }

    async submitCode() {
        clearTimeout(this.timeout)
        try {
            await userModule.emailLogin(this.email, this.element.querySelector(".code_input").value)
            localStorage.setItem("userEmail", this.email)
            let sid
            if (this.createSpace) {
                await assistOS.UI.showLoading()
                sid = await spaceModule.createSpace(this.email.split("@")[0])
                await assistOS.UI.hideLoading()
            }
            await assistOS.UI.reinit(`/spaces/webSkel-config`);
            await assistOS.loadPage(this.email, sid);
        } catch (err) {
            if (err.details?.status === 403) {
                const mins = Math.ceil(err.details.detailsData.lockTime / 60000)
                const m = await showApplicationError("Exceeded number of attempts",
                    `Exceeded number of attempts. Login is locked for ${mins} minutes`)
                setTimeout(() => assistOS.UI.closeModal(m), err.details.detailsData.lockTime)
            } else {
                await showApplicationError("Error", assistOS.UI.sanitize(err.details || err.message))
            }
        }
    }

    async waitGetCode(email, ref) {
        const r = await userModule.generateAuthCode(email, ref, "emailCode")
        this.element.querySelector(".auth_type_wrapper").style.display = "none"
        this.element.querySelector(".code_submit_section").style.display = "flex"
        if (r.code) {
            const ci = this.element.querySelector(".code_input")
            ci.value = r.code
            this.element.querySelector(".submit_code_button").classList.remove("disabled")
        }
        this.timeout = setTimeout(() => window.location.reload(), 120000)
    }

    totpLogin() {
        this.element.querySelector(".auth_type_wrapper").style.display = "none"
        this.element.querySelector(".totp_login_section").style.display = "flex"
        const i = this.element.querySelector(".totp_login_section .totp_input")
        const b = this.element.querySelector(".totp_login_section .totp_action_button")
        i.addEventListener("input", e => b.classList.toggle("disabled", !/^\d{6}$/.test(e.target.value)))
    }

    changeAuthType(t) { this.setAuthStep(t.getAttribute("auth-type")) }

    setAuthStep(s) {
        this.auth_step = s
        sessionStorage.setItem("auth_step", s)
        const title = this.element.querySelector(".header .title")
        title.textContent = s === "login" ? "Login" : "Register"

        const c = this.element.querySelector(".auth_container")
        c.classList.add("auth_step1")
        c.removeAttribute("selected-auth")

        const submitBtn = this.element.querySelector(".email_wrapper .input_container .submit_email_button")
        const emailIn = this.element.querySelector(".email_wrapper .input_container .email_input")
        submitBtn.style.display = "block"
        emailIn.readOnly = false
        submitBtn.textContent = "Next"

        this.element.querySelector(".separator").classList.remove("hidden")
        this.element.querySelector(".footer-separator").classList.add("hidden")
        c.setAttribute("auth-step", s)
    }

    async submitStep1() {
        this.element.querySelector(".auth_container").classList.remove("auth_step1")
        this.element.querySelector(".email_wrapper .input_container .submit_email_button").style.display = "none"
        this.element.querySelector(".email_wrapper .input_container .email_input").readOnly = true
        this.auth_step === "login" ? this.setLoginOptions(this.authInfo.authMethods) : await this.signupSubmit()
    }

    async submitLoginMethod() {
        try {
            if (this.selected_method === "passkey") {
                const { publicKeyCredentialRequestOptions, challengeKey } =
                    await userModule.generatePasskeyLoginOptions(this.email)
                await passKeyLogin(this.email, publicKeyCredentialRequestOptions, challengeKey)
            } else if (this.selected_method === "totp") {
                this.totpLogin()
            } else {
                await this.waitGetCode(this.email)
            }
        } catch (err) {
            if (err.details?.status === 403) {
                const mins = Math.ceil(err.details.detailsData.lockTime / 60000)
                const lm = await assistOS.UI.showModal("lock-login", {
                    message: `Exceeded number of attempts. Login is locked for ${mins} minutes`
                })
                setTimeout(() => assistOS.UI.closeModal(lm), err.details.detailsData.lockTime)
            } else {
                await showApplicationError("Error", err.details || err.message)
            }
        }
    }

    async signupSubmit() {
        try {
            this.createSpace = true
            await this.waitGetCode(this.email, this.referer)
        } catch (err) {
            if (err.details?.status === 403) {
                const mins = Math.ceil(err.details.detailsData.lockTime / 60000)
                const lm = await assistOS.UI.showModal("lock-login", {
                    message: `Exceeded number of attempts. Login is locked for ${mins} minutes`
                })
                setTimeout(() => assistOS.UI.closeModal(lm), err.details.detailsData.lockTime)
            } else if (err.name !== "NotAllowedError") {
                const em = await showApplicationError("Error", err.message)
                em.addEventListener("close", () => assistOS.UI.changeToDynamicPage("landing-page", "landing-page"))
            }
        }
    }

    async totpCodeSubmit() {
        const t = this.element.querySelector(".totp_login_section .totp_input").value
        try {
            await this.submitTotpCode(t)
        } catch (err) {
            await showApplicationError("Error", assistOS.UI.sanitize(err.message))
        }
    }

    async submitTotpCode(token, createSpace) {
        if (!/^\d{6}$/.test(token)) throw new Error("Please enter a valid 6-digit code")
        const r = await userModule.totpLogin(this.email, token)
        if (r.operation === "success") {
            let sid
            if (createSpace) {
                await assistOS.UI.showLoading()
                sid = await spaceModule.createSpace(this.email.split("@")[0])
                await assistOS.UI.hideLoading()
            }
            await assistOS.UI.reinit(`/spaces/webSkel-config`);
            await assistOS.loadPage(this.email, sid)
        } else {
            throw new Error("Invalid authentication code")
        }
    }

    async submitEmail() {
        this.email = this.element.querySelector(".email_input").value.trim()
        this.element.querySelector(".separator").classList.add("hidden")
        this.element.querySelector(".footer-separator").classList.remove("hidden")
        this.authInfo = await userModule.getPublicAuthInfo(this.email)

        if (this.auth_step === "signup") {
            if (this.authInfo.userExists) {
                const ok = await assistOS.UI.showModal("confirm-action-modal", {
                    message: `We found an account for ${this.email}. Do you want to login with this email?`
                }, true)
                if (!ok) return
                this.selected_method = this.authInfo.authMethods.find(m => m.enabled && !m.setupPending)?.type || "emailCode"
                this.setAuthStep("login")
            }
            await this.submitStep1()
            return
        }

        if (!this.authInfo.userExists) {
            const ok = await assistOS.UI.showModal("confirm-action-modal", {
                message: `We couldn't find an account for ${this.email}. Do you want to create a new account with this email?`
            }, true)
            if (!ok) return
            this.auth_step = "signup"
        }
        this.setLoginOptions(this.authInfo.authMethods)
        await this.submitStep1()
    }
}
