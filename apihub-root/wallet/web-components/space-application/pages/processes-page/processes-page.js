export class ProcessesPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.processes = this.getMockProcesses();
        this.invalidate();
    }

    getMockProcesses() {
        return [
            {
                id: 1,
                name: "Car Rental Request",
                description: "Process for borrowing a car through agent interaction",
                soplang: `# Car Rental Process
@customerName := "John Doe"
@rentalDuration := 3
@carType := "sedan"
@agentID := "AGT_001"

# Check availability through agent
@agentQuery := "I need to borrow a " $carType " for " $rentalDuration " days"
@isAvailable assert [checkCarInventory $carType $rentalDuration]

# Process rental if available
@rentalStatus if $isAvailable then "approved" else "waitlist"
@confirmationMsg := "Rental " $rentalStatus " for " $customerName

# Notify agent system
?notifyAgent $agentID $confirmationMsg
return $confirmationMsg`
            },
            {
                id: 2,
                name: "Ticket Purchase Flow",
                description: "Metro ticket purchase with agent assistance",
                soplang: `# Ticket Purchase Process
@ticketType := "daily_pass"
@quantity := 2
@paymentMethod := "card"
@agentStation := "Central_Station"

# Calculate price
@unitPrice := 5.50
@totalCost math $unitPrice * $quantity

# Process payment
@paymentStatus ?processPayment $paymentMethod $totalCost
@ticketValid assert $paymentStatus == "SUCCESS"

# Generate ticket if payment successful
@ticketNumber if $ticketValid then [generateTicketID] else "FAILED"
@confirmation := "Ticket " $ticketNumber " purchased at " $agentStation

return $confirmation`
            },
            {
                id: 3,
                name: "Inventory Management",
                description: "Workers checking parts inventory through metro system",
                soplang: `# Inventory Check Process
@workerID := "WRK_456"
@partType := "brake_pad"
@requiredQuantity := 15
@currentLocation := "Metro_Depot_A"

# Check current inventory
@availableStock math [getInventoryLevel $partType $currentLocation]
@isStockSufficient assert $availableStock >= $requiredQuantity

# Create request based on availability
@requestType if $isStockSufficient then "withdrawal" else "transfer_request"
@requestID := [createInventoryRequest $requestType $partType $requiredQuantity]

# Update agent system
@agentNotification := "Worker " $workerID " requests " $requiredQuantity " " $partType
?updateAgentSystem $agentNotification $requestID

return $requestID`
            },
            {
                id: 4,
                name: "Multi-Agent Coordination",
                description: "Agent handles multiple process types and routes requests",
                soplang: `# Multi-Agent Process Router
@agentID := "AGENT_CENTRAL"
@requestType
@requestData
@priority := "normal"

# Define process routing macro
@routeProcess macro reqType reqData
    @processHandler if [assert $reqType == "rental"] then "car_rental_dept" else "general_queue"
    @routedTo := "Request routed to " $processHandler
    return $routedTo
end

# Validate request
@isValidRequest assert $requestType != undefined && $requestData != undefined

# Route to appropriate handler
@routingResult if $isValidRequest then [routeProcess $requestType $requestData] else "invalid_request"

# Log interaction
@timestamp := [getCurrentTimestamp]
@logEntry := $agentID " processed " $requestType " at " $timestamp

return $routingResult`
            },
            {
                id: 5,
                name: "Agent Knowledge Base Query",
                description: "Agent queries multiple processes to assist users",
                soplang: `# Agent Knowledge Base System
@userQuery := "What processes can you help me with?"
@agentCapabilities := "rental,ticket,inventory,scheduling"
@userContext

# Define capability checker
@hasCapability macro capability
    @capList := $agentCapabilities
    @found assert [contains $capList $capability]
    return $found
end

# Check user intent
@intent := [analyzeUserQuery $userQuery]
@canAssist assert [hasCapability $intent]

# Prepare response
@agentResponse if $canAssist then [getProcessDetails $intent] else "Please contact specialized support"

# Track interaction
@interactionID := [generateInteractionID]
@trackingData := "User: " $userQuery " | Response: " $agentResponse " | ID: " $interactionID

return $agentResponse`
            },
            {
                id: 6,
                name: "Parts Request Workflow",
                description: "Metro workers request specific parts through agent system",
                soplang: `# Parts Request Through Agent
@workerBadge := "MTR_789"
@partsList := "bolt_M8,washer_M8,nut_M8"
@urgency := "high"
@workLocation := "Station_B_Track_2"

# Validate worker credentials
@isAuthorized assert [validateWorker $workerBadge]

# Parse parts list
@partsArray := [splitString $partsList ","]
@partsCount math [arrayLength $partsArray]

# Check availability for each part
@allAvailable assert [checkMultiplePartsAvailability $partsArray $workLocation]

# Create work order
@workOrderID if $isAuthorized && $allAvailable then [createWorkOrder $workerBadge $partsList] else "DENIED"

# Notify relevant agents
@notification := "Work order " $workOrderID " for " $partsCount " parts at " $workLocation
?broadcastToAgents $notification $urgency

return $workOrderID`
            }
        ];
    }

    async beforeRender() {
        this.processRows = this.processes.map(process => `
            <tr>
                <td class="main-cell">
                    <span style="font-weight: 500;">${process.name}</span>
                </td>
                <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${process.description}
                </td>
                <td class="actions-button">
                    <button class="table-action-btn" data-local-action="editProcess ${process.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="delete-row-btn" data-local-action="deleteProcess ${process.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async afterRender() {
    }

    async openAddProcessModal() {
        const result = await assistOS.UI.showModal("add-edit-process-modal", {
            modalTitle: "Add New Process",
            processName: "",
            processDescription: "",
            processSoplang: ""
        }, true);

        if (result) {
            // Add the new process
            const newProcess = {
                id: Math.max(...this.processes.map(p => p.id)) + 1,
                name: result.name,
                description: result.description,
                soplang: result.soplang
            };
            this.processes.push(newProcess);
            this.invalidate();
        }
    }

    async editProcess(event, processId) {
        const process = this.processes.find(p => p.id === parseInt(processId));
        if (!process) return;
        window.processSoplang = process.soplang; // For debugging purposes
        const result = await assistOS.UI.showModal("add-edit-process-modal", {
            modalTitle: "Edit Process",
            processName: process.name,
            processDescription: process.description,
            processSoplang: process.soplang,
            processId: process.id
        }, true);

        if (result) {
            // Update the process
            const processIndex = this.processes.findIndex(p => p.id === parseInt(processId));
            if (processIndex !== -1) {
                this.processes[processIndex] = {
                    ...this.processes[processIndex],
                    name: result.name,
                    description: result.description,
                    soplang: result.soplang
                };
                this.invalidate();
            }
        }
    }

    async deleteProcess(event, processId) {
        const process = this.processes.find(p => p.id === parseInt(processId));
        if (!process) return;

        const result = await assistOS.UI.showModal("delete-process-modal", {
            processName: process.name,
            processId: process.id
        }, true);

        if (result && result.confirmed) {
            this.processes = this.processes.filter(p => p.id !== parseInt(processId));
            this.invalidate();
        }
    }
}