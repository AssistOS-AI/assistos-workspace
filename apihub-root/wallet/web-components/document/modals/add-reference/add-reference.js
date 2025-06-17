import { generateAPACitation } from "../../components/references-table/referenceUtils.js";
export class addReference {
    constructor(element, invalidate, props) {
        this.invalidate = invalidate;
        this.element = element;
        this.reference = props.reference;
        let docViewPage = document.querySelector("document-view-page");
        this.docPresenter = docViewPage.webSkelPresenter;
        this.invalidate();
    }
    async beforeRender(){

    }
    async afterRender(){
        // Real-time preview update
        const inputs = this.element.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updateCitationPreview());
        });
        if (this.reference) {
            const fields = [
                'reference-type-select', 'reference-authors', 'reference-year', 'reference-title',
                'reference-volume', 'reference-pages',
                'reference-publisher', 'reference-location', 'reference-website',
                'reference-access-date', 'reference-url'
            ];

            fields.forEach(fieldId => {
                const element = this.element.querySelector(`#${fieldId}`);
                if (element && this.reference[fieldId.replace('reference-', '').replace('-', '_')]) {
                    element.value = this.reference[fieldId.replace('reference-', '').replace('-', '_')];
                }
            });

            if (this.reference.type) this.element.querySelector('#reference-type-select').value = this.reference.type;
            if (this.reference.access_date) this.element.querySelector('#reference-access-date').value = this.reference.access_date;
        } else {
            const inputs = this.element.querySelectorAll('#reference-modal input, #reference-modal select');
            inputs.forEach(input => input.value = '');
        }

        const typeSelect = this.element.querySelector('#reference-type-select');
        this.toggleReferenceFields(typeSelect.value);
        this.updateCitationPreview();

        // Show/hide fields based on reference type
        typeSelect.addEventListener("change", () => {
            this.toggleReferenceFields(typeSelect.value);
            this.updateCitationPreview();
        });
    }
    toggleReferenceFields(type) {
        const allFields = this.element.querySelectorAll('.field-group');

        allFields.forEach(field => {
            if (field.classList.contains('journal-field') ||
                field.classList.contains('book-field') ||
                field.classList.contains('website-field')) {
                field.style.display = 'none';
            }
        });

        const fieldsToShow = this.element.querySelectorAll(`.${type}-field`);
        fieldsToShow.forEach(field => {
            field.style.display = 'block';
        });
    }
    updateCitationPreview() {
        const modal = this.element.querySelector("#reference-modal");
        if (!modal) return;

        const getValue = (id) => modal.querySelector(`#${id}`)?.value?.trim() || '';

        const data = {
            type: getValue('reference-type-select'),
            authors: getValue('reference-authors'),
            year: getValue('reference-year'),
            title: getValue('reference-title'),
            volume: getValue('reference-volume'),
            pages: getValue('reference-pages'),
            publisher: getValue('reference-publisher'),
            location: getValue('reference-location'),
            website: getValue('reference-website'),
            accessDate: getValue('reference-access-date'),
            url: getValue('reference-url')
        };

        const citation = generateAPACitation(data);
        const previewElement = modal.querySelector('#citation-preview-text');
        if (previewElement) {
            previewElement.textContent = citation;
        }
    }

    saveRef(button){
        const getValue = (id) => this.element.querySelector(`#${id}`)?.value?.trim() || '';
        const authors = getValue('reference-authors');
        const year = getValue('reference-year');
        const title = getValue('reference-title');

        if (!authors || !year || !title) {
            alert("Authors, Year, and Title are required fields.");
            return;
        }

        const newReference = {
            id: this.reference?.id || Date.now().toString(),
            type: getValue('reference-type-select'),
            authors,
            year: parseInt(year),
            title,
            volume: getValue('reference-volume'),
            pages: getValue('reference-pages'),
            publisher: getValue('reference-publisher'),
            location: getValue('reference-location'),
            website: getValue('reference-website'),
            access_date: getValue('reference-access-date'),
            url: getValue('reference-url')
        };

        if (this.reference) {
            const index = this.docPresenter.references.findIndex(r => r.id === this.reference.id);
            if (index !== -1) {
                this.docPresenter.references[index] = newReference;
            }
        } else {
            this.docPresenter.references.push(newReference);
        }
        assistOS.UI.closeModal(button, true);
    }
    closeModal(button) {
        assistOS.UI.closeModal(button);
    }
}