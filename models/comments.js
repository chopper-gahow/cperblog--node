var mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/cperblog')
var Schema = mongoose.Schema;
var CommentsSchema = new Schema({
	blogid:{type:String},
    content:{type:String},
    commernickname:{type:String},
    commer:{type:String},
    commerhead:{type:String},
})
module.exports = mongoose.model('Comments',CommentsSchema) 
