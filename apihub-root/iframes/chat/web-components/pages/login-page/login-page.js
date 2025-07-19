function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

let userModule = require("assistos").loadModule("user", {userId: "*"});

const displayError = async (err) => {
    if (err.details?.status === 403) {
        const mins = Math.ceil(err.details.detailsData.lockTime / 60000)
        const m = await showApplicationError("Exceeded number of attempts",
            `Exceeded number of attempts. Login is locked for ${mins} minutes`)
    } else {
        await showApplicationError("Error", UI.sanitize(err.details || err.message))
    }
}
export class LoginPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.resAuth = this.props.resAuth;
        this.invalidate();
    }

    async beforeRender(props) {

    }

    async afterRender(props) {

    }

    async submitEmail() {
        this.email = this.element.querySelector(".email_input").value.trim();
        if (!isValidEmail(this.email)) {
            this.element.querySelector(".email_input").classList.add("error");
            return;
        }
        this.authInfo = await userModule.getPublicAuthInfo(this.email)
        if (this.authInfo.userExists === false) {
            this.element.querySelector(".email_input").classList.add("error");
            this.element.querySelector(".email_input").placeholder = "User does not exist";
        } else {
            this.waitCode(this.email);
        }
    }

    async waitCode(email, ref) {
        let r;
        try{
           r = await userModule.generateAuthCode(email, ref, "emailCode")
        }catch(err){
            return displayError(err);
        }
        this.element.querySelector(".auth_type_wrapper").style.display = "none"
        this.element.querySelector(".code_submit_section").style.display = "flex"
        if (r.code) {
            const ci = this.element.querySelector(".code_input")
            ci.value = r.code
            this.element.querySelector(".submit_code_button").classList.remove("disabled")
        }
    }

    async login() {
        try {
            await userModule.emailLogin(this.email, this.element.querySelector(".code_input").value)
            localStorage.setItem("userEmail", this.email)
            this.element.remove();
            this.resAuth();
        } catch (err) {
            await displayError(err);
        }
    }

}