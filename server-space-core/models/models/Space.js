const IModel = require('../IModel.js')
class Space extends IModel{
    constructor(spaceObj){
        super(spaceObj)
        this.validate(spaceObj)
    }

    validate(spaceObj=this){

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
module.exports=Space;