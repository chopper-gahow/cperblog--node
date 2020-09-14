var mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/cperblog')
var Schema = mongoose.Schema;
var BlogSchema = new Schema({
	title:{
        type:String
    },
    text:{
        type:String
    },
	headimg:{
		type:String
    },
    writer:{
        type:String
    },
    writedate:{
        type:String
    },
    writerickname:{
        type:String
    },
    visitors:[{
        visitor:{type:String}
    }]
})
module.exports = mongoose.model('Blog',BlogSchema) 
