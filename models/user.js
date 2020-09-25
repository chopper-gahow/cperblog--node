var mongoose=require('mongoose')
mongoose.connect('mongodb://localhost:27017/cperblog')
var Schema = mongoose.Schema;
var UserSchema = new Schema({
	username:{
		type:String
	},
	mobile:{
		type:String
	},
	password:{
		type:String
	},
	nickname:{
		type:String
	},
	headimg:{
		type:String
	},
	birth:{
		type:String
	},
	ilike:[
		{
			blogid:{type:String}
		}
	],
	collections:[
		{
			blogid:{type:String}
		}
	]

})
module.exports = mongoose.model('User',UserSchema) 
