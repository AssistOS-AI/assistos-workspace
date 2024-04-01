function extractQueryParams(request) {
    const queryObject = new URL(request.url, `http://${request.headers.host}`).searchParams;
    let params = {};
    for (let [key, value] of queryObject.entries()) {
        params[key] = value;
    }
    return params;
}
module.exports=extractQueryParams;