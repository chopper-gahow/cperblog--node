// var User=require('./models/user')
var express=require('express');
var router= express.Router();
const qiniu = require("qiniu");
const User = require('./models/user');
var session=[];
const Blog = require('./models/blog');
const { writer } = require('repl');
const blog = require('./models/blog');
const { ifError } = require('assert');
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
    console.log(session);
    session[session.length]=req.session.user;
    console.log(session);
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
  const accesskey='';
  const ssk='';
  const bucket='hcpr';
  let mac=new qiniu.auth.digest.Mac(accesskey,ssk);

  let options={
    scope:bucket,
     expires:3600*24
  };
  let putPolicy=new qiniu.rs.PutPolicy(options);
  let uploadToken=putPolicy.uploadToken(mac);
  res.json({
    "token":uploadToken
  })
})
//修改昵称
router.get('/personal/editnickname',(req,res)=>{
  var body = req.query,
  issession = session.filter(item=>{
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
//修改头像
router.get('/personal/editheadimg',(req,res)=>{
  var body = req.query,
  
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length != 0){
    
    User.updateOne({_id:req.session.user._id},{
      // headimg:'http://hchopper.top/'+body.headimg
      headimg:body.headimg
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
  var now = new Date();
      var year = now.getFullYear(); //得到年份
      var month = now.getMonth();//得到月份
      var date = now.getDate();//得到日期
      var hour = now.getHours();//得到小时
      var minu = now.getMinutes();//得到分钟
      var sec = now.getSeconds();//得到秒
      month = month + 1;
      if (month < 10) month = "0" + month;
      if (date < 10) date = "0" + date;
      if (hour < 10) hour = "0" + hour;
      if (minu < 10) minu = "0" + minu;
      if (sec < 10) sec = "0" + sec;
      var time = "";
      time = year + "-" + month + "-" + date+ " " + hour + ":" + minu + ":" + sec;
  if(issession.length != 0){
  var blog = new Blog({
    title: body.title,
    text: body.text,
    writer: req.session.user.username,
    writerickname:req.session.user.nickname,
    headimg:req.session.user.headimg,
    writedate:time,
    blogcomments:[],
    visitors:[]
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
        "data":blog,
        "msg":"保存成功"
      })
    }
  })
  }
  else{
    res.json({
      "msg":"请先登录后在来"
    })
  }
})
//博客点击
router.get('/blog/findblogbyid',(req,res)=>{
    var body = req.query
    var arrv = []
    var v = {
      visitor:body.visitor
    }
    Blog.findOne({
      _id: body.id
    },(err,ret)=>{
      if(err){
        res.json({
          "msg":"error"
        })
      }
      else{
        arrv = ret.visitors
        if (!v){arrv.push(v)}
        var isvisit = arrv.filter(item=>{
          return item.visitor == body.visitor
        })
        if(isvisit.length==0){
          arrv.push(v)
        } 
        Blog.updateOne({_id: body.id},{visitors:arrv},(err,s)=>{
          if(err){
            res.json({
              "msg":"不是吧阿sir"
            })
          }else{
            res.json({
              "code":200,
              "msg":"查询成功",
              "data":ret
            })
          }
        })
        
      }
    })
})
//获取评论
router.get('/blog/findcommentbyid',(req,res)=>{
  var body = req.query
  Blog.find({
    _id: body.id
  },(err,rut)=>{
    if(err){
      res.json({
        "msg":"error"
      })
    }
    else{
      res.json({
        "code":200,
        "msg":"查询成功",
        "data":rut
      })
    }
  })
})
//发布评论
router.get('/blog/writecomment',(req,res)=>{
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length!==0){
  var body = req.query
  var comment={
    content:body.comment,
    commernickname:req.session.user.nickname,
    commer:req.session.user.username,
    commerhead:req.session.user.headimg
  }
  var arr=[]
  Blog.findOne({_id: body.id},
    (err,ret)=>{
    if(err){
      res.json({
        "msg":"这个博客消失啦～～～"
      })
    }else{
      arr = ret.comments
      arr.push(comment)  
      Blog.updateOne({_id: body.id},{comments:arr},(err,b)=>{
        if(err){
          res.json({
            "msg":"修改失败"
          })
        }else{
          res.json({
            "code":200,
            "msg":"评论成功了～～～",
            "data":ret
          })
        }
      })
    }
  })

  
} 
else{
  res.json({
    "msg":"先登录了啦～～～"
  })
}
})
module.exports = router;