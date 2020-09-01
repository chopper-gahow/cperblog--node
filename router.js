// var User=require('./models/user')
var express=require('express');
var router= express.Router();
const qiniu = require("qiniu");
var fs = require('fs')
const User = require('./models/user');
var session=[];
const Blog = require('./models/blog');
const { writer } = require('repl');


// const express = require('express');
//登录接口
router.get('/login/userlogin',(req,res)=>{
  var body=req.query
	User.findOne({
		username:body.username,
		password:body.password
	},(err,user)=>{
		if(err){
			res.send("err!")
		}
		if(!user){
			  res.send("no!")
		}else{
    
     req.session.user = user;
    
     session[session.length]=req.session.user;
     //console.log(res.get('Set-Cookie'))
     console.log(session)
		res.json({
		"code":200, 
		"msg":"登录成功",
		"cookie":req.session.user,
		"data":{
			username:body.username,
      password:body.password,
      nickname:user.nickname,
      headimg:user.headimg,
      birth:user.birth
    }
			})
		}
	})
})
//通过id查询用户
//退出登陆
router.get('/login/outlogin',(req,res)=>{
  var idx
  issession = session.filter((item,index)=>{
    idx=index
    return item._id == req.session.user._id
  })
  if(issession !== 0){
    session.splice(idx,1)
    console.log(session);
    res.json({
      "code":200,
      "msg":"退出成功",
      "data":"ok"
    })
  }
})
//查询用户
router.get('/person/finduserbyid',(req,res)=>{
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length != 0){
    User.find({
      _id: req.session.user._id
    },(err,rut)=>{
      if (err) {
        res.json({
          "data":"error"
        })
      }
      else{
        res.json({
          "code":200, 
          "msg":"查询成功",
          "data":req.session.user,
        })
      }
    })
  }
})
//注册接口
router.get('/register/userRegister',(req,res)=>{
	var body=req.query
	var user = new User({
	username: body.username,
  password: body.password,
  nickname:'用户'+body.username,
  headimg:'http://hchopper.top/headimg.jpg',
  birth:'',
	avater:body.avater
		});
			User.findOne({
					username:body.username,
					password:body.password,
				},(err,r)=>{
					if (err) {
						res.send("err!")
					}
					if(!r){
							user.save(function(err, ret) {
							if (err) {
								console.log('保存失败',err);
								//console.log(ret)
								res.send("注册失败")
							} else {
								console.log('保存成功');
								console.log(ret);
								res.json({
								"code":200,
								"msg":"注册成功"	
							})
							}
						}); 
					}else{
						 res.json({
						 	"code":"这个用户名已经被注册过啦！"
						 })
					}
				})
})

//获取七牛云token
router.get('/token/cper/gettoken',(req,res)=>{
  const accesskey='NE8_vBQZRIGgA3rME0MDu_nrFLnb6RXYoE3vDdtH';
  const ssk='o7pfhdI45Y88B3rIw3P5yC0d18Jm7fFYN9teGDBx';
  const bucket='nxhub';
  let mac=new qiniu.auth.digest.Mac(accesskey,ssk);
  let options={
    scope:bucket,
     expires:3600*24
  };
  let putPolicy=new qiniu.rs.PutPolicy(options);
  let uploadToken=putPolicy.uploadToken(mac);
 

})
//修改昵称
router.get('/personal/editnickname',(req,res)=>{
  var body = req.query,
  issession = session.filter(item=>{
    console.log(req.session.user._id,"jijijiji")
    return item._id == req.session.user._id
  })
  if(issession.length != 0){
    
    User.updateOne({_id:req.session.user._id},{
      nickname:body.nickname
    },(err)=>{
      if(err){
        res.json({
          "data":"error"
        })
      }
      else{
        User.findOne({_id:req.session.user._id},(err,result)=>{
          if (err) {
           res.json({
             "msg":"出错",
             "data":err,
           })
          }else{
           res.json({
             "code":200, 
             "msg":"修改成功",
             "data":result,
           })
          }
   })
      }
    })
  }
  else{
    res.json({
      "code":300,
      "msg":"用户未登录"
    })
  }
})
//修改生日
router.get('/personal/editbirth',(req,res)=>{
  var body = req.query,
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length != 0){
    User.updateOne({_id:req.session.user._id},{
      birth:body.birth
    },(err,ret)=>{
      if(err){
        res.json({
          "data":"error"
        })
      }
      else{
        User.findOne({_id:req.session.user._id},(err,result)=>{
               if (err) {
                res.json({
                  "code":200, 
                  "msg":"出错",
                  "data":err,
                })
               }else{
                res.json({
                  "code":200, 
                  "msg":"修改成功",
                  "data":result,
                })
               }
        })
        
      }
    })
  }
  else{
    res.json({
      "data":"用户未登录"
    })
  }
})

//获取博客
router.get('/blog/getblog',(req,res)=>{
  Blog.find(function(err,data){
    if(err){
      res.json({
        "data":"没找到"
      })
    }else{
      res.json({
        "data":data
      })
    }
  })
})
//撰写博客
router.get('/blog/writeblog',(req,res)=>{
  var body = req.query
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length != 0){
  var blog = new Blog({
    title: body.title,
    text: body.text,
    writer: req.session.user.nickname,
    headimg:'http://hchopper.top/headimg.jpg',
  })
  blog.save((err,ret)=>{
    if (err) {
      res.json({
        "data":"保存失败"
      })
    }
    else{
      res.json({
        "code":200,
        "data":"成功",
        "msg":"保存成功"
      })
    }
  })
}
})
module.exports = router;