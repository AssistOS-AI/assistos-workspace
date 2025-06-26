export class AddEditProcessModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        debugger
        const modalTitle = this.element.getAttribute('data-modalTitle');
        const processName = this.element.getAttribute('data-processName');
        const processDescription = this.element.getAttribute('data-processDescription');
        const processId = this.element.getAttribute('data-processId');

        this.modalTitle = modalTitle || "Add New Process";
        this.processName =processName || "";
        this.processSoplang = window.processSoplang|| "";
        this.processDescription = processDescription || "";
        this.processId = processId || null;
        this.isEditMode = !!this.processId;

        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
        const nameInput = this.element.querySelector('#process-name');
        if (nameInput) {
            setTimeout(() => nameInput.focus(), 100);
        }
    }

    closeModal() {
        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element);
        } else if (window.WebSkel?.closeModal) {
            window.WebSkel.closeModal(this.element);
        } else {
            const dialog = this.element.closest('dialog');
            if (dialog) {
                dialog.close();
                dialog.remove();
            }
        }
    }

    saveProcess() {
        const nameInput = this.element.querySelector('#process-name');
        const soplangInput = this.element.querySelector('#process-soplang');
        const descriptionInput = this.element.querySelector('#process-description');

        const name = nameInput.value.trim();
        const soplang = soplangInput.value.trim();
        const description = descriptionInput.value.trim();

        nameInput.classList.remove('input-invalid');
        soplangInput.classList.remove('input-invalid');

        let isValid = true;
        if (!name) {
            nameInput.classList.add('input-invalid');
            isValid = false;
        }
        if (!soplang) {
            soplangInput.classList.add('input-invalid');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const processData = {
            name,
            soplang,
            description
        };

        if (this.isEditMode) {
            processData.id = this.processId;
        }

        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element, processData);
        } else if (window.WebSkel?.closeModal) {
            window.WebSkel.closeModal(this.element, processData);
        } else {
            // Fallback - dispatch custom event
            const event = new CustomEvent('process-saved', {
                detail: processData,
                bubbles: true
            });
            this.element.dispatchEvent(event);
            this.closeModal();
        }
    }
}