
const IModel = require('../IModel.js')
class Announcement extends IModel{
    constructor(announcementObj){
        super(announcementObj);
        this.validate(announcementObj);
    }
    validate(announcementObj=this){
        const mustInclude=['title','id','text','date']
        const mustBeNonEmpty=['title','id','text','date']

        mustInclude.forEach(key => {
            if (!(key in announcementObj)) {
                throw new Error(`Missing required field: ${key}`);
            }
        });

        mustBeNonEmpty.forEach(key => {
            if (announcementObj[key] === "") {
                throw new Error(`${key} must not be an empty string`);
            }
        });
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
module.exports=Announcement;