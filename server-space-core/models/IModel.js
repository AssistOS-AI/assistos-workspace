class IModel{
    constructor(dependencies) {
        Object.keys(dependencies).forEach(objKey=>this[objKey]=dependencies[objKey])
    }
    validate() {
        throw new Error("Validate method must be implemented.");
    }

   stringify() {
        throw new Error("Stringify method must be implemented.");
    }
}
module.exports=IModel