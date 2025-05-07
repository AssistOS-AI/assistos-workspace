export class LoginPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.pageMode = this.element.getAttribute('data-authtype') || sessionStorage.getItem("auth_step") || "login";
        this.invalidate();
    }

    beforeRender() {
    }
    updateInfoDisplay(selectedValue) {
        document.querySelectorAll('.radio_info').forEach(info => {
            info.style.display = (info.id === `${selectedValue}_info`) ? 'block' : 'none';
        });
    }

    setPageMode() {
        if (this.action === "signup" || this.params.ref) {
            document.querySelector(".code_action_button").textContent = "Sign up";
            document.querySelector(".page_section").classList.add("register");
            document.querySelector(".page_section").classList.remove("login");
            const radios = document.querySelectorAll('.auth_method_selection input[name="auth_method"]');
            const checked = document.querySelector('.auth_method_selection input[name="auth_method"]:checked');
            if (checked) this.updateInfoDisplay(checked.value);
            radios.forEach(radio => {
                radio.addEventListener('change', event => {
                    this.element.querySelector(".choice.selected").classList.remove('selected');
                    event.target.parentElement.classList.add('selected');
                    this.updateInfoDisplay(event.target.value);
                });
            });
        } else {
            document.querySelector(".page_section").classList.add("login");
            document.querySelector(".page_section").classList.remove("register");

            document.querySelector(".code_input_section").style.display = "flex";
            document.querySelector(".login_section").style.display = "none";
            document.querySelector(".code_sent_message").style.display = "none";
            document.querySelector(".form_title").textContent = "Login";

            if (this.element.getAttribute("data-email")) {
                let inputElement = document.querySelector(".code_input_section .email_input")
                inputElement.value = this.element.getAttribute('data-email')
                const event = new Event('input', { bubbles: true });
                inputElement.dispatchEvent(event);
            }
        }
    }
}