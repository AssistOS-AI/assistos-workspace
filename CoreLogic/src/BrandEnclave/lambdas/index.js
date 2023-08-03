const BrandSVD = require("../BrandSVD");
const CommentSVD = require("../CommentSVD");
const PostSVD = require("../PostSVD");
const BrandFollowSVD = require("../BrandFollowSVD");
let fsSVDStorage;

function initSVD() {
    const fastSVD = require("opendsu").loadApi("svd");
    fsSVDStorage = fastSVD.createFsSVDStorage("./SVDS/");
    fsSVDStorage.registerType("brand", BrandSVD);
    fsSVDStorage.registerType("brandFollow", BrandFollowSVD);
    fsSVDStorage.registerType("post", PostSVD);
    fsSVDStorage.registerType("comment", CommentSVD)
}

const helloWorld = (...args) => {
    const callback = args.pop();
    callback(undefined, args);
}

function addNewBrand(brandName, brandLogo, brandDescription, brandUrl, callback) {
    const svdUid = "svd:brand:brand" + Math.floor(Math.random() * 100000);
    const self = this;
    fsSVDStorage.createTransaction(function (err, transaction){
        let brand = transaction.create(svdUid, svdUid, brandName, brandLogo, brandDescription, brandUrl);
        self.insertRecord("", "brands", svdUid, { brand: brand.read() }, (err, res) => {
            if (!err) {
                transaction.commit((commitError) => {
                    console.log("Commit error", commitError);
                    callback(commitError, res);
                })
            }
            else {
                callback(err);
            }
        });
    });
}

function addNewBrandFollow(brandId,userId,callback){
    const self = this;
    fsSVDStorage.createTransaction(function (err, transaction){
        let brandFollow = transaction.create(brandId, brandId, userId);
        self.insertRecord("", "brandsFollow", brandId, { brandFollow: brandFollow.read() }, (err, res) => {
            if (!err) {
                transaction.commit((commitError) => {
                    console.log("Commit error", commitError);
                    callback(commitError, res);
                })
            }
            else {
                callback(err);
            }
        });
    });
}
function removeBrandFollow(brandId, callback) {
    const self = this;
    self.deleteRecord("", "brandsFollow", brandId, callback);

}
function addNewPost(brandId, title, image, body, creatorDID, mintingFee, callback) {
    const postSvdUid = "svd:post:post" + Math.floor(Math.random() * 100000);
    const self = this;
    fsSVDStorage.createTransaction(function (err, transaction){
        let post = transaction.create(postSvdUid, brandId, postSvdUid, title, image, body, creatorDID, new Date().getTime(), false, mintingFee);
        self.insertRecord("", "posts", postSvdUid, { post: post.read() }, (err, res) => {
            if (!err) {
                transaction.commit((commitError) => {
                    console.log("@@Commit error", commitError);
                    callback(commitError, res);
                })
            }
            else {
                callback(err);
            }
        });
    });
}


function addNewComment(brandId, postId, title, body, creatorDID, mintingFee, callback) {
    const commentSvdUid = "svd:comment:comment" + Math.floor(Math.random() * 100000);
    const self = this;
    fsSVDStorage.createTransaction(function (err, transaction){
        let comment = transaction.create(commentSvdUid, brandId, postId, commentSvdUid, title, body, creatorDID, new Date().getTime(), mintingFee);
        self.insertRecord("", "comments", commentSvdUid, { comment: comment.read() }, (err, res) => {
            if (!err) {
                transaction.commit((commitError) => {
                    console.log("@@Commit error", commitError);
                    callback(commitError, res);
                })
            }
            else {
                callback(err);
            }
        });
    });
}


module.exports = {
    registerLambdas: function (remoteEnclaveServer) {
        initSVD();
        remoteEnclaveServer.addEnclaveMethod("helloWorld", helloWorld, "read");
        remoteEnclaveServer.addEnclaveMethod("addNewBrand", addNewBrand, "read");
        remoteEnclaveServer.addEnclaveMethod("addNewPost", addNewPost, "read");
        remoteEnclaveServer.addEnclaveMethod("addNewComment", addNewComment, "read");
        remoteEnclaveServer.addEnclaveMethod("addNewBrandFollow", addNewBrandFollow, "read");
        remoteEnclaveServer.addEnclaveMethod("removeBrandFollow", removeBrandFollow, "write");
    }
}