const helloWorld = (...args) => {
    const callback = args.pop();
    callback(undefined, args);
}
const addPost = function (brandId, postId, title, image, body, creatorDID, timestamp, isActivated, mintingFee, callback){
    const PostSVD = require("./PostSVD");
    const post = PostSVD.ctor(brandId, postId, title, image, body, creatorDID, timestamp, isActivated, mintingFee);
    this.insertRecord(creatorDID, "posts", postId, post, (err, res)=>{
        callback(err, res);
    })
}

module.exports = {
    registerLambdas: function (remoteEnclaveServer) {
        remoteEnclaveServer.addEnclaveMethod("helloWorld", helloWorld, "read");
    }
}