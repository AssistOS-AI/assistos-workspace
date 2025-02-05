export class ViewContextModal {
    constructor(element,invalidate){
        this.invalidate=invalidate;
        this.invalidate();
        this.agentPagePresenter = document.querySelector('agent-page').webSkelPresenter
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    async handleUpdate(event,key){
        const text= event.target.value;
        this.agentPagePresenter.localContext[key] =text;
    }

    async beforeRender() {
        this.viewContextItems = this.agentPagePresenter.localContext.map((savedContext, index) => {
            return `<li class="view-item" data-key="${index}"> 
                <span class="role">${savedContext.role}</span>
            <textarea 
            oninput="document.querySelector('agent-page').webSkelPresenter.localContext[this.dataset.key].message = this.value" 
            class="editContextItem" 
            data-key="${index}">${savedContext.message}
            </textarea>
                        <button data-local-action="deleteItem">Delete</button>
            </li>`;
        }).join('') || `<span>No context Added</span>`;

    }
    async afterRender(){

    }

    async deleteItem(_target){
        const targetIndex= _target.closest('li').getAttribute('key');
        this.agentPagePresenter.localContext.splice(targetIndex,1);
        this.invalidate();
    }


}