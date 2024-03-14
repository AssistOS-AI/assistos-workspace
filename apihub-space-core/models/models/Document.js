const IModel = require('../IModel.js')
class Document extends IModel{
    constructor(documentObj){
        super(documentObj)
        this.validate(documentObj)
    }

    validate(documentObj=this){

    }

    stringify() {
        const properties = {};
        Object.keys(this).forEach((key) => {
            if (typeof this[key] !== 'function') {
                properties[key] = this[key];
            }
        });
        return JSON.stringify(properties);
    }
}
module.exports=Document;