function Storage(server){
    const { loadObject,storeObject} = require("./controller");
    server.get(objectPathid,loadObject);
    server.put(objectPathid,storeObject);
}