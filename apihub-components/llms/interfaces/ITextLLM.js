class ITextLLM{
    constructor(){
        if(new.target===ITextLLM){
            throw new TypeError("Cannot construct Interface")
        }
        if(this.getModelName===undefined){
            throw new TypeError("Function getModelName must be implemented")
        }
    }
}
module.exports=ITextLLM;