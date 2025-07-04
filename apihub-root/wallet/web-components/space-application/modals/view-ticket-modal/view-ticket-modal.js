let userModule = assistOS.loadModule("user");

export class ViewTicketModal{
    constructor(element,invalidate,props){
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;

        this.ticketId = this.element.dataset.ticketid;
        this.invalidate();
    }

    async beforeRender(){
        const tickets = await userModule.getOwnTickets(assistOS.user.email);
        const ticket = tickets.find(t => t.id === this.ticketId);
        this.message = ticket.message;
        this.status = ticket.status;
        this.subject = ticket.subject;
        this.resolutionMessage = ticket.resolutionMessage?` <div class="form-item">
        <label class="form-label" for="resolutionMessage">Resolution Message</label>
        <textarea name="message" class="form-input" id="message" disabled>${ticket.resolutionMessage}</textarea>
    </div>`:""
    }

    async afterRender(){

    }

    async closeModal(target){
        await assistOS.UI.closeModal(target);
    }
}