const WebAssistant = assistOS.loadModule("webassistant",{});

export class ApplicationCreatorPages {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.assistantId = assistOS.space.webAssistant
        this.spaceId = assistOS.space.id;
        this.pageName = "Widgets"
        this.invalidate();
    }

    async beforeRender() {
        const pages = await WebAssistant.getPages(this.spaceId,this.assistantId);


        this.pageRows = (pages||[]).map(pageData =>
            `<div class="page-item">
            <span class="page-item-name">${pageData.name}</span>
            <div class="page-item-description-container">
            <div class="page-item-description">
            ${pageData.description}
            </div>
            <div class="page-item-description-buttons">
                <button class="table-action-btn button-padding" data-local-action="openEditModal ${pageData.id}">
                <svg width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.2833 15.9143H3.89902L14.9823 6.19166L13.3666 4.77429L2.2833 14.4969V15.9143ZM1.14946 17.9036C0.82821 17.9036 0.559112 17.8081 0.342171 17.6171C0.12523 17.4262 0.0163809 17.1901 0.015625 16.9089V14.4969C0.015625 14.2317 0.0723171 13.9787 0.185701 13.738C0.299085 13.4973 0.459712 13.2861 0.667583 13.1044L14.9823 0.57192C15.2091 0.389569 15.4597 0.248661 15.734 0.149197C16.0084 0.0497323 16.2964 0 16.598 0C16.8996 0 17.1925 0.0497323 17.4768 0.149197C17.761 0.248661 18.0066 0.397858 18.2137 0.596786L19.7728 1.98929C19.9995 2.17164 20.1647 2.38715 20.2683 2.63581C20.3718 2.88447 20.424 3.13313 20.4247 3.38179C20.4247 3.64703 20.3726 3.9 20.2683 4.1407C20.1639 4.38141 19.9988 4.60089 19.7728 4.79916L5.4864 17.3317C5.27853 17.514 5.0374 17.6549 4.76301 17.7544C4.48862 17.8539 4.20063 17.9036 3.89902 17.9036H1.14946ZM14.1603 5.49541L13.3666 4.77429L14.9823 6.19166L14.1603 5.49541Z" fill="#333333"/>
            </svg>

            </button>
            
            <button class="table-action-btn button-padding" data-local-action="previewPage ${pageData.id}">
            <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.62775 14.3306C7.78112 14.3306 6.07385 13.8428 4.50595 12.8673C2.93805 11.8917 1.70987 10.559 0.821392 8.86913C0.716866 8.66007 0.63847 8.44684 0.586207 8.22942C0.533944 8.01201 0.507812 7.78971 0.507812 7.56254C0.507812 7.31865 0.533944 7.08346 0.586207 6.85699C0.63847 6.63052 0.716866 6.41275 0.821392 6.2037C1.70987 4.51385 2.93805 3.18114 4.50595 2.20556C6.07385 1.22998 7.78112 0.742188 9.62775 0.742188C11.4744 0.742188 13.1817 1.22998 14.7496 2.20556C16.3175 3.18114 17.5456 4.51385 18.4341 6.2037C18.5386 6.41275 18.617 6.62633 18.6693 6.84445C18.7216 7.06256 18.7477 7.29321 18.7477 7.53641C18.7477 7.77961 18.7216 8.01061 18.6693 8.22942C18.617 8.44823 18.5386 8.66147 18.4341 8.86913C17.5456 10.559 16.3175 11.8917 14.7496 12.8673C13.1817 13.8428 11.4744 14.3306 9.62775 14.3306ZM9.62775 12.2401C11.1608 12.2401 12.5632 11.822 13.8349 10.9858C15.1067 10.1496 16.0823 8.99978 16.7617 7.53641C16.0823 6.07304 15.1067 4.92325 13.8349 4.08704C12.5632 3.25082 11.1608 2.83272 9.62775 2.83272C8.0947 2.83272 6.6923 3.25082 5.42056 4.08704C4.14882 4.92325 3.17324 6.07304 2.49382 7.53641C3.17324 8.99978 4.14882 10.1496 5.42056 10.9858C6.6923 11.822 8.0947 12.2401 9.62775 12.2401ZM9.62775 11.1948C10.6382 11.1948 11.5005 10.8377 12.2148 10.1234C12.9291 9.40918 13.2862 8.54683 13.2862 7.53641C13.2862 6.52599 12.9291 5.66364 12.2148 4.94938C11.5005 4.23512 10.6382 3.87798 9.62775 3.87798C8.61733 3.87798 7.75499 4.23512 7.04072 4.94938C6.32646 5.66364 5.96932 6.52599 5.96932 7.53641C5.96932 8.54683 6.32646 9.40918 7.04072 10.1234C7.75499 10.8377 8.61733 11.1948 9.62775 11.1948ZM9.62775 9.10431C9.19223 9.10431 8.82185 8.95205 8.51664 8.64753C8.21142 8.34301 8.05916 7.97264 8.05985 7.53641C8.06055 7.10019 8.21316 6.73016 8.51768 6.42634C8.8222 6.12252 9.19223 5.96991 9.62775 5.96851C10.0633 5.96712 10.4337 6.11973 10.7389 6.42634C11.0441 6.73295 11.1963 7.10298 11.1957 7.53641C11.195 7.96985 11.0427 8.34022 10.7389 8.64753C10.435 8.95484 10.0647 9.1071 9.62775 9.10431Z" fill="#333333"/>
        </svg>
        
            </button>
            
            <button class="table-action-btn red button-padding" data-local-action="deletePage ${pageData.id}">
            <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.14407 17.9036C2.59631 17.9036 2.12755 17.709 1.73781 17.3197C1.34806 16.9305 1.15286 16.462 1.15219 15.9143V2.98393C0.87001 2.98393 0.633641 2.88845 0.443084 2.69747C0.252528 2.5065 0.156917 2.27044 0.156253 1.98929C0.155589 1.70814 0.2512 1.47207 0.443084 1.2811C0.634969 1.09013 0.871338 0.994644 1.15219 0.994644H5.13595C5.13595 0.712828 5.23156 0.476766 5.42278 0.286458C5.614 0.096149 5.85037 0.000663096 6.13189 0H10.1157C10.3978 0 10.6345 0.0954859 10.8258 0.286458C11.017 0.477429 11.1123 0.713491 11.1116 0.994644H15.0954C15.3775 0.994644 15.6142 1.09013 15.8055 1.2811C15.9967 1.47207 16.092 1.70814 16.0913 1.98929C16.0906 2.27044 15.995 2.50683 15.8045 2.69847C15.6139 2.8901 15.3775 2.98526 15.0954 2.98393V15.9143C15.0954 16.4614 14.9005 16.9298 14.5107 17.3197C14.121 17.7096 13.6519 17.9043 13.1035 17.9036H3.14407ZM13.1035 2.98393H3.14407V15.9143H13.1035V2.98393ZM6.13189 13.925C6.41408 13.925 6.65078 13.8295 6.842 13.6386C7.03322 13.4476 7.1285 13.2115 7.12783 12.9304V5.96786C7.12783 5.68605 7.03222 5.44999 6.841 5.25968C6.64978 5.06937 6.41341 4.97388 6.13189 4.97322C5.85037 4.97256 5.614 5.06804 5.42278 5.25968C5.23156 5.45131 5.13595 5.68737 5.13595 5.96786V12.9304C5.13595 13.2122 5.23156 13.4486 5.42278 13.6396C5.614 13.8305 5.85037 13.9257 6.13189 13.925ZM10.1157 13.925C10.3978 13.925 10.6345 13.8295 10.8258 13.6386C11.017 13.4476 11.1123 13.2115 11.1116 12.9304V5.96786C11.1116 5.68605 11.016 5.44999 10.8248 5.25968C10.6335 5.06937 10.3972 4.97388 10.1157 4.97322C9.83413 4.97256 9.59776 5.06804 9.40654 5.25968C9.21532 5.45131 9.11971 5.68737 9.11971 5.96786V12.9304C9.11971 13.2122 9.21532 13.4486 9.40654 13.6396C9.59776 13.8305 9.83413 13.9257 10.1157 13.925Z" fill="white"/>
        </svg>
            </button>
        </div>
        
        </div>
        </div>
    `).join('');
        }


    async afterRender() {

    }

    async viewActions(eventTarget, id) {
        document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('show'));

        const dropdown = eventTarget.querySelector('.action-dropdown');
        dropdown.classList.toggle('show');

        const clickHandler = (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
                document.removeEventListener('click', clickHandler);
            }
        };
        document.addEventListener('click', clickHandler);
    }

    async openAddModal(evenTarget) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-page-modal", {
            presenter: "application-edit-page-modal",
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }

    async openEditModal(evenTarget,id) {
        const {shouldInvalidate} = await assistOS.UI.showModal("application-edit-page-modal", {
            presenter: "application-edit-page-modal",
            id
        }, true)
        if (shouldInvalidate) {
            this.invalidate();
        }
    }
    async previewPage(evenTarget,id) {
        const modal = await assistOS.UI.showModal("application-preview-page-modal", {
            presenter: "application-preview-page-modal",
            id
        }, true)
    }

    async deletePage(evenTarget,id) {
            await WebAssistant.deletePage(this.spaceId,this.assistantId,id);
            this.invalidate();
    }
}