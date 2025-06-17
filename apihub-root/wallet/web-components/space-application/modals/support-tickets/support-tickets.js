let userModule = assistOS.loadModule("user");
export class SupportTickets {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.email = decodeURIComponent(this.element.getAttribute('data-email'));
        this.invalidate();
    }
    async beforeRender() {
        this.offset = 0;
        this.paginationLimit = 9;
        this.tickets = await userModule.getTickets(this.offset, this.paginationLimit);
        this.ticketsHTML = this.getTicketsHTML();
    }
    afterRender() {
        this.changePaginationArrows();
    }
    openTicket(button, id){
        let ticketElement = button.closest('.ticket');
        let ticketDetailsElement = ticketElement.querySelector('.ticket-details');
        if(ticketDetailsElement) {
            return;
        }
        let ticket = this.tickets.find(ticket => ticket.id === id);
        let ticketDetails = `
                <div class="ticket-details">
                    <div class="ticket-header">
                    Message:
                        <img class="close-icon pointer" data-local-action="closeTicket" src="./wallet/assets/icons/x-mark.svg" alt="close">
                    </div>
                    <div class="message">${ticket.message}</div>
                    <label class="form-label" for="resolutionMessage">Provide a resolution message:</label>
                    <textarea class="form-input" name="resolutionMessage" id="resolutionMessage"></textarea>
                    <div class="general-button mark-resolved" data-local-action="resolveTicket ${id}">Mark as resolved</div>
                </div>`;
        ticketElement.insertAdjacentHTML("beforeend", ticketDetails);

    }
    closeTicket(button) {
        let ticketDetails = button.closest('.ticket-details');
        ticketDetails.remove();
    }

    async resolveTicket(button, id){
        let ticketElement= button.closest('.ticket');
        let resolutionMessage = ticketElement.querySelector('#resolutionMessage').value;
        await userModule.resolveTicket(id, resolutionMessage);
        ticketElement.classList.add("resolved");
        this.closeTicket(button);
    }
    changePaginationArrows(){
        let nextButton = this.element.querySelector('.next-tickets');
        let prevButton = this.element.querySelector('.previous-tickets');
        if (this.paginationLimit > this.tickets.length) {
            nextButton.classList.add('disabled');
        } else {
            nextButton.classList.remove('disabled');
        }

        if (this.offset === 0) {
            prevButton.classList.add('disabled');
        } else {
            prevButton.classList.remove('disabled');
        }
    }
    async changePage(button, direction) {
        if (direction === 'next') {
            this.offset += this.paginationLimit - 1;
        } else if (direction === 'previous') {
            this.offset -= this.paginationLimit - 1;
        }
        let ticketsList = this.element.querySelector('.tickets');
        await assistOS.loadifyComponent(ticketsList, async () => {
            this.tickets = await userModule.getTickets(this.offset, this.paginationLimit);
            this.displayTickets();
            this.changePaginationArrows();
        });
    }
    displayTickets(){
        let ticketsContainer = this.element.querySelector('.tickets');
        ticketsContainer.innerHTML = this.getTicketsHTML();
    }
    getTicketsHTML(){
        let ticketsHTML = "";
        if (this.tickets.length === 0) {
            return `<div class="no-tickets">No tickets submitted</div>`;
        }
        for(let i= 0; i < this.paginationLimit - 1; i++){
            let ticket = this.tickets[i];
            if(!ticket) {
                continue;
            }
            let resolvedClass = ticket.resolved ? 'resolved' : '';
            ticketsHTML += `
            <div class="ticket ${resolvedClass}">
                <div class="ticket-preview">
                     <div class="ticket-info">
                        <div class="email">Subject: ${ticket.subject}</div>
                        <div class="email">Submitted by: ${ticket.email}</div>
                     </div>
                     <div class="view-ticket" data-local-action="openTicket ${ticket.id}">View</div>
                     <img class="resolved-icon" src="./wallet/assets/icons/success.svg" alt="resolved" loading="lazy">
                </div>
            </div>`;
        }
        return ticketsHTML;
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}