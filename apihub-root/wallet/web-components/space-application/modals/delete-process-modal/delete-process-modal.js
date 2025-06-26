export class DeleteProcessModal {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;

        this.processName = props.processName || "";
        this.processId = props.processId || null;

        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
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

    confirmDelete() {
        const deleteData = {
            confirmed: true,
            processId: this.processId
        };

        if (window.assistOS?.UI?.closeModal) {
            window.assistOS.UI.closeModal(this.element, deleteData);
        } else if (window.WebSkel?.closeModal) {
            window.WebSkel.closeModal(this.element, deleteData);
        } else {
            const event = new CustomEvent('delete-confirmed', {
                detail: deleteData,
                bubbles: true
            });
            this.element.dispatchEvent(event);
            this.closeModal();
        }
    }
}