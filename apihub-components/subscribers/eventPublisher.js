const { generateId } = require("../apihub-component-utils/crypto");
const { createSessionCookie } = require("../apihub-component-utils/cookie");
const keepAliveInterval = 29000;

class EventPublisher {
    constructor() {
        this.clients = new Map();
    }

    setConnectionHeaders(response, sessionId) {
        response.setHeader('Set-Cookie', createSessionCookie(sessionId));
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();
        response.write("event: open\n\n");
    }

    keepConnectionAlive(response) {
        return setInterval(() => {
            response.write("event: message\n");
            response.write('data: keep-alive\n\n');
        }, keepAliveInterval);
    }

    addClientConnection(userId, request, response) {
        let client = this.clients.get(userId);

        const sessionId = generateId(16);

        this.setConnectionHeaders(response, sessionId);

        const keepAliveId = this.keepConnectionAlive(response);

        response.on('error', (err) => {
            this.closeClientConnection(userId, sessionId);
            console.error('Server SSE error:', err);
        });

        response.on('close', () => {
            this.closeClientConnection(userId, sessionId);
        });

        if (!client) {
            client = {
                connections: new Map(),
                userId: userId,
            };
            this.clients.set(userId, client);
        }

        client.connections.set(sessionId, {
            response,
            keepAliveId,
            paths: new Set()
        });
    }

    registerClient(userId, request, response) {
        this.addClientConnection(userId, request, response);
    }

    closeClientConnection(userId, sessionId) {
        let client = this.clients.get(userId);
        if (client) {
            let clientConnection = client.connections.get(sessionId);
            if (clientConnection) {
                clearInterval(clientConnection.keepAliveId);
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

    subscribeToObject(userId, sessionId, path) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        let connection = client.connections.get(sessionId);
        if (!connection) {
            return;
        }
        connection.paths.add(path);
    }

    unsubscribeFromObject(userId, sessionId, path) {
        let client = this.clients.get(userId);
        if (!client) {
            return;
        }
        let connection = client.connections.get(sessionId);
        if (!connection) {
            return;
        }
        connection.paths.delete(path);
    }

    notifyClients(objectPath, eventData, skipList = []) {
        for (let [clientUserId, client] of this.clients) {
            for (let [connectionSessionId, connection] of client.connections) {
                if (skipList.includes(clientUserId)) {
                    continue;
                }
                for (let path of connection.paths) {
                    if (this.matchesSubscription(objectPath, path)) {
                        let message = { objectId: objectPath };
                        if (eventData) {
                            message.data = eventData;
                        }
                        connection.response.write(`event: content\n`);
                        connection.response.write(`data: ${JSON.stringify(message)}\n\n`);
                        break;
                    }
                }
            }
        }
    }

    matchesSubscription(objectPath, subscribedPath) {
        const objectParts = objectPath.split('/');
        const subscribedParts = subscribedPath.split('/');

        let i = 0;
        let j = 0;

        while (i < objectParts.length && j < subscribedParts.length) {
            if (subscribedParts[j] === '**') {
                return true;
            } else if (subscribedParts[j] === '*') {
                i++;
                j++;
            } else {
                if (objectParts[i].toLowerCase() !== subscribedParts[j].toLowerCase()) {
                    return false;
                }
                i++;
                j++;
            }
        }

        if (j < subscribedParts.length && subscribedParts[j] === '**') {
            return true;
        }

        return i === objectParts.length && j === subscribedParts.length;
    }
}

const eventPublisher = new EventPublisher();

module.exports = eventPublisher;
