const actionButton = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="6" r="2" fill="#2A92AF"/> <circle cx="12" cy="12" r="2" fill="#2A92AF"/> <circle cx="12" cy="18" r="2" fill="#2A92AF"/> </svg>`

const getDropDownMenu = function (id) {
    return `<div class="action-dropdown" id="dropdown-${id}">
            <a href="#" class="dropdown-item" data-local-action="openEditModal ${id}">
              <svg>...</svg>
              Edit
            </a>
            <a href="#" class="dropdown-item" data-local-action="deletePage ${id}">
              <svg>...</svg>
              Delete
            </a>
              <a href="#" class="dropdown-item" data-local-action="previewPage ${id}">
                  <svg>...</svg>
         <!-- <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.0004 18.5C10.2337 18.5 8.60039 18.0333 7.10039 17.1C5.60039 16.1667 4.42539 14.8917 3.57539 13.275C3.47539 13.075 3.40039 12.871 3.35039 12.663C3.30039 12.455 3.27539 12.2423 3.27539 12.025C3.27539 11.7917 3.30039 11.5667 3.35039 11.35C3.40039 11.1333 3.47539 10.925 3.57539 10.725C4.42539 9.10833 5.60039 7.83333 7.10039 6.9C8.60039 5.96667 10.2337 5.5 12.0004 5.5C13.7671 5.5 15.4004 5.96667 16.9004 6.9C18.4004 7.83333 19.5754 9.10833 20.4254 10.725C20.5254 10.925 20.6004 11.1293 20.6504 11.338C20.7004 11.5467 20.7254 11.7673 20.7254 12C20.7254 12.2327 20.7004 12.4537 20.6504 12.663C20.6004 12.8723 20.5254 13.0763 20.4254 13.275C19.5754 14.8917 18.4004 16.1667 16.9004 17.1C15.4004 18.0333 13.7671 18.5 12.0004 18.5ZM12.0004 16.5C13.4671 16.5 14.8087 16.1 16.0254 15.3C17.2421 14.5 18.1754 13.4 18.8254 12C18.1754 10.6 17.2421 9.5 16.0254 8.7C14.8087 7.9 13.4671 7.5 12.0004 7.5C10.5337 7.5 9.19206 7.9 7.97539 8.7C6.75872 9.5 5.82539 10.6 5.17539 12C5.82539 13.4 6.75872 14.5 7.97539 15.3C9.19206 16.1 10.5337 16.5 12.0004 16.5ZM12.0004 15.5C12.9671 15.5 13.7921 15.1583 14.4754 14.475C15.1587 13.7917 15.5004 12.9667 15.5004 12C15.5004 11.0333 15.1587 10.2083 14.4754 9.525C13.7921 8.84167 12.9671 8.5 12.0004 8.5C11.0337 8.5 10.2087 8.84167 9.52539 9.525C8.84206 10.2083 8.50039 11.0333 8.50039 12C8.50039 12.9667 8.84206 13.7917 9.52539 14.475C10.2087 15.1583 11.0337 15.5 12.0004 15.5ZM12.0004 13.5C11.5837 13.5 11.2294 13.3543 10.9374 13.063C10.6454 12.7717 10.4997 12.4173 10.5004 12C10.5011 11.5827 10.6471 11.2287 10.9384 10.938C11.2297 10.6473 11.5837 10.5013 12.0004 10.5C12.4171 10.4987 12.7714 10.6447 13.0634 10.938C13.3554 11.2313 13.5011 11.5853 13.5004 12C13.4997 12.4147 13.3541 12.769 13.0634 13.063C12.7727 13.357 12.4184 13.5027 12.0004 13.5Z" fill="black"/>
          </svg>-->
                Preview
            </a>
          </div>
`

}
const spaceModule = require('assistos').loadModule('space', {});

const getPageRows = async function (spaceId) {
    return await spaceModule.getWebAssistantConfigurationPages(spaceId);
}

export class ApplicationCreatorPages {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.spaceId = assistOS.space.id;
        this.pageName = "Pages"
        this.invalidate();
    }

    async beforeRender() {
        this.pageRows = (await getPageRows(this.spaceId)).map(pageData => {
            return `<tr>
            <td>${pageData.name}</td>
            <td>${pageData.widget}</td>
            <td>${pageData.description}</td>
            <td class="application-action-button" data-local-action="viewActions ${pageData.id}" ">
          ${actionButton}
         ${getDropDownMenu(pageData.id)}
        </td>
            </tr>`
        }).join('');
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
            await spaceModule.deleteWebAssistantConfigurationPage(this.spaceId,id);
            this.invalidate();
    }
}