class EventPublisher {
    constructor() {
        this.clients = new Map();
    }

    registerClient(userId, request, response) {
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();

        const intervalId = setInterval(() => {
            response.write("event: message\n");
            response.write('data: keep-alive\n\n');
        }, 30000);

        response.on('error', (err) => {
            clearInterval(intervalId);
            console.error('Server SSE error:', err);
            response.end();
        });

        if (this.clients.has(userId)) {
            const existingClient = this.clients.get(userId);
            clearInterval(existingClient.intervalId);
            existingClient.res.end();
        }

        const client = {
            res: response,
            userId: userId,
            intervalId: intervalId,
            objectIds: {}
        };

        this.clients.set(userId, client);
    }

    notifyClients(userId, objectId, objectData) {
        for (let [key, value] of this.clients) {
            if (value.objectIds[objectId]) {
                let data = { objectId: objectId };
                if (objectData) {
                    data.data = objectData;
                }
                if (key === userId) {
                    data.isSameUser = true;
                }
                let stringData = JSON.stringify(data);
                value.res.write(`event: content\n`);
                value.res.write(`data: ${stringData}\n\n`);
            }
        }
    }

    notifyClientTask(userId, objectId, objectData) {
        let client = this.clients.get(userId);
        if (client && client.objectIds[objectId]) {
            let data = { objectId: objectId };
            if (objectData) {
                data.data = objectData;
            }
            let stringData = JSON.stringify(data);
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

    removeClient(userId) {
        let client = this.clients.get(userId);
        clearInterval(client.intervalId);
        client.res.end();
        this.clients.delete(userId);
    }

    subscribeToObject(userId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        client.objectIds[objectId] = objectId;
    }

    unsubscribeFromObject(userId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        delete client.objectIds[objectId];
    }
}

const eventPublisher = new EventPublisher();

module.exports = eventPublisher;
