const {generateId} = require("../apihub-component-utils/crypto");
const {createSessionCookie} = require("../apihub-component-utils/cookie");

class SubscriptionManager {
    constructor() {
        this.clients = new Map();
    }

    addClientConnection(userId, response) {
        const client = this.clients.get(userId);

        const sessionId = generateId(16);
        response.setHeader('Set-Cookie', createSessionCookie(sessionId));
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();
        response.write("event: open\n");
        const intervalId = setInterval(() => {
            response.write("event: message\n");
            response.write('data: keep-alive\n\n');
        }, 15000);

        response.on('error', (err) => {
            this.closeClientConnection(userId, sessionId);
            console.error('Server SSE error:', err);
        });
        response.on('close', () => {
            this.closeClientConnection(userId, sessionId);
            console.log('Server SSE connection closed');
        });
        client.connections.set(sessionId, {
            response: response,
            intervalId: intervalId,
            objectIds: new Set()
        });
    }

    registerClient(userId, request, response) {
        if (this.clients.has(userId)) {
            return this.addClientConnection(userId, response);
        }
        const client = {
            connections: new Map(),
            userId: userId,
        };
        this.clients.set(userId, client);
        this.addClientConnection(userId, response);
    }

    closeClientConnection(userId, sessionId) {
        let client = this.clients.get(userId);
        if (client) {
            let clientConnection = client.connections.get(sessionId);
            if (clientConnection) {
                clearInterval(clientConnection.intervalId);
                clientConnection.response.statusCode = 204;
                clientConnection.response.write(`event: close\n`);
                clientConnection.response.write(`data: Connection closed\n\n`);
                clientConnection.response.end();
                client.connections.delete(sessionId);
                if (client.connections.size === 0) {
                    this.clients.delete(userId);
                }
            }
        }
    }

    notifyClients(sessionId, objectId, eventData = null, skipList=[]) {
        for (let [clientUserId, client] of this.clients) {
            if(skipList.includes(clientUserId)){
                continue;
            }
            for (let [connectionSessionId, connection] of client.connections) {
                const isSubscribed = Array.from(connection.objectIds).some(existingId =>
                    objectId.startsWith(existingId)
                );
                if (isSubscribed && sessionId !== connectionSessionId) {
                    let message = {objectId: objectId};
                    if (eventData) {
                        message.data = eventData;
                    }
                    connection.response.write(`event: content\n`);
                    connection.response.write(`data: ${JSON.stringify(message)}\n\n`);
                }
            }
        }
    }

    subscribeToObject(userId, sessionId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        let connection = client.connections.get(sessionId);
        if (!connection) {
            return;
        }
        connection.objectIds.add(objectId);
    }

    unsubscribeFromObject(userId, sessionId, objectId) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        let connection = client.connections.get(sessionId);
        if (!connection) {
            return;
        }
        connection.objectIds.delete(objectId);
    }
    getObjectId(...parts) {
        return parts.join("/");
    }
}

const subscriptionManager = new SubscriptionManager();

module.exports = subscriptionManager;