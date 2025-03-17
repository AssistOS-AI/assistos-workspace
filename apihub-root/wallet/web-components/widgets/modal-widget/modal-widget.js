export class ModalWidget {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
    }

    async afterRender() {
        this.initModal();
    }

    initModal() {
        this.modal = document.getElementById("hugeModalOverlay");
        this.modalContent = document.getElementById("hugeModal");
        this.closeButton = document.getElementById("closeModal");
        this.closeFooterButton = document.getElementById("closeFooter");
        this.resizeButton = document.getElementById("resizeModal");
        this.tabButtons = document.querySelectorAll(".tab-button");
        this.tabContents = document.querySelectorAll(".tab-content");

        this.closeButton.addEventListener("click", () => this.closeModal());
        this.closeFooterButton.addEventListener("click", () => this.closeModal());
        this.resizeButton.addEventListener("click", () => this.resizeModal());
        this.tabButtons.forEach(button => button.addEventListener("click", (e) => this.switchTab(e)));

        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.closeModal();
        });

        this.openModal();
    }

    openModal() {
        this.modal.style.opacity = "1";
        this.modal.style.visibility = "visible";
        this.modalContent.style.transform = "scale(1)";
    }

    closeModal() {
        this.modal.style.opacity = "0";
        this.modal.style.visibility = "hidden";
        this.modalContent.style.transform = "scale(0.8)";
    }

    resizeModal() {
        this.modalContent.style.width = "90%";
        this.modalContent.style.height = "80vh";
    }

    switchTab(event) {
        const targetTab = event.target.dataset.tab;
        this.tabButtons.forEach(btn => btn.classList.remove("active"));
        this.tabContents.forEach(content => content.classList.remove("active"));

        document.getElementById(targetTab).classList.add("active");
        event.target.classList.add("active");
    }
}
