function sendResponse(response, statusCode, contentType, message, cookies) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);

    if (cookies) {
        const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
        response.setHeader('Set-Cookie', cookiesArray);
    }

    response.write(message);
    response.end();
}
module.exports=sendResponse;