export class AddSpaceCollaboratorModal{
    constructor(element, invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        this.spaceName=assistOS.space.name;
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    addEmailField() {
        const form = this.element.querySelector('.modal-body form'); // Asigură-te că selecționezi formularul corect
        const emailFields = form.querySelectorAll('input[type="email"]'); // Obține toate câmpurile de email existente
        const lastEmailInput = emailFields[emailFields.length - 1]; // Selectează ultimul câmp de email adăugat

        let emailField = document.createElement("input");
        emailField.type = "email";
        emailField.placeholder = "Enter additional email address";
        emailField.className = "form-input";
        emailField.name = `email[${this.emailFieldCount + 1}]`; // Numele unic pentru fiecare câmp nou adăugat

        this.emailFieldCount++; // Incrementez contorul după fiecare adăugare

        // Adaugă noul câmp de email direct după ultimul câmp de email
        if (lastEmailInput) {
            lastEmailInput.parentNode.insertBefore(emailField, lastEmailInput.nextSibling);
        } else {
            form.appendChild(emailField); // Dacă nu există niciun câmp de email, adaugă primul câmp
        }
    }


}