class IImageLLM{
    constructor(){
        if(new.target===IImageLLM){
            throw new TypeError("Cannot construct Interface")
        }
        if(this.getModelName===undefined){
            throw new TypeError("Function getModelName must be implemented")
        }
    }
}
module.exports=IImageLLM;