let clients = [];

async function notifyClients(request, response) {
    try {
        let image = request.body;
        for (let client of clients) {
            Request.sendResponse(client, 200, "application/json", {
                success: true,
                data: image
            });
        }
    } catch (error) {
        Request.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function registerClients(request, response) {
    try {
        response.setHeader('Content-Type', 'text/event-stream');
        response.setHeader('Cache-Control', 'no-cache');
        response.setHeader('Connection', 'keep-alive');
        response.flushHeaders();
        clients.push(response);
        request.on('close', () => {
            clients = clients.filter(client => client !== response);
            response.end();
        });
    } catch (error) {
        Request.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    notifyClients,
    registerClients
}