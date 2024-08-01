class EventPublisher {
    constructor() {
        this.clients = new Map();
    }

    registerClient(userId, request, response) {

        if (this.clients.has(userId)) {
            this.closeClient(userId);
        }

        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();

        const intervalId = setInterval(() => {
            response.write("event: message\n");
            response.write('data: keep-alive\n\n');
        }, 15000);

        response.on('error', (err) => {
            this.closeClient(userId);
            console.error('Server SSE error:', err);
        });
        response.on('close', () => {
            this.closeClient(userId);
            console.log('Server SSE connection closed');
        });
        const client = {
            res: response,
            userId: userId,
            intervalId: intervalId,
            objectIds: new Set()
        };

        this.clients.set(userId, client);
    }
    closeClient(userId) {
        let client = this.clients.get(userId);
        if (client) {
            clearInterval(client.intervalId);
            client.res.statusCode = 204;
            client.res.write(`event: close\n`);
            client.res.write(`data: Connection closed\n\n`);
            client.res.end();
            this.clients.delete(userId);
        }
    }
    notifyClients(userId, objectId, eventData) {
        for (let [clientUserId, client] of this.clients) {
            if (client.objectIds.has(objectId)) {
                let message = { objectId: objectId };
                if (eventData) {
                    message.data = eventData;
                }
                if (clientUserId !== userId) {
                    client.res.write(`event: content\n`);
                    client.res.write(`data: ${JSON.stringify(message)}\n\n`);
                    console.log(`Notified client ${clientUserId} about object ${objectId}`);
                }
            }
        }
    }

    notifyClientTask(userId, objectId, eventData) {
        let client = this.clients.get(userId);
        if (client && client.objectIds.has(objectId)) {
            let message = { objectId: objectId };
            if (eventData) {
                message.data = eventData;
            }
            let stringData = JSON.stringify(message);
            client.res.write(`event: content\n`);
            client.res.write(`data: ${stringData}\n\n`);
        }
    }

    sendClientEvent(userId, eventName, eventData) {
        let client = this.clients.get(userId);
        if (client) {
            client.res.write(`event: ${eventName}\n`);
            client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
        } else {
            const error = new Error("Client not found");
            error.statusCode = 404;
            throw error;
        }
    }


    subscribeToObject(userId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        client.objectIds.add(objectId);
    }

    unsubscribeFromObject(userId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        client.objectIds.delete(objectId);
    }
}

const eventPublisher = new EventPublisher();

module.exports = eventPublisher;
