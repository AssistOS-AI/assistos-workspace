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
        this.paginationLimit = 11;
        this.tickets = await userModule.getTickets(this.offset, this.paginationLimit);
        let ticketsHTML = "";
        for(let ticket of this.tickets) {
            ticketsHTML += `
            <div class="ticket">
                <div class="ticket-preview">
                     <div class="email">Submitted by: ${ticket.email}</div>
                     <div class="email">Subject: ${ticket.subject}</div>
                     <div data-local-action="openTicket">View</div>
                </div>
            </div>`;
        }
        if (this.tickets.length === 0) {
            ticketsHTML = `<div class="no-tickets">No tickets submitted</div>`;
        }
        this.ticketsHTML = ticketsHTML;
    }
    openTicket(button, id){
        let ticket = this.tickets.find(ticket => ticket.id === id);
        let ticketPreview = button.closest('.ticket-preview');
        let ticketDetails = `
                <div class="ticket-details">
                    <div class="message">Message: ${ticket.message}</div>
                    <textarea class="form-input"></textarea>
                    <div class="general-button">Mark as resolved</div>
                </div>`;

    }
    afterRender() {
        this.changePaginationArrows();
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

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}