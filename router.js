var express=require('express');
var router= express.Router();
const qiniu = require("qiniu");
var session=[];
const User = require('./models/user');
const Blog = require('./models/blog');
const Comments = require('./models/comments');
const { writer } = require('repl');
const { ifError } = require('assert');
const { insertMany } = require('./models/user');
//登录接口
router.get('/login/userlogin',(req,res)=>{
  var body=req.query
	User.findOne({
		username:body.username,
		password  :body.password
	},(err,user)=>{
		if(err){
			res.send("err!")
		}
		if(!user){
			  res.send("no!")
		}else{
    var isLogin = session.filter(item=>{
      return item.username == user.username
    })
    req.session.user = user;
    if (isLogin.length == 0){
      session[session.length]=req.session.user;
      console.log(body.username+'登陆了');
      res.json({
        "code":200, 
        "msg":"登录成功",
        "data":{
          id:user._id,
          username:body.username,
          password:body.password,
          nickname:user.nickname,
          headimg:user.headimg,
          birth:user.birth
        }
      })
    }
    else{
      res.json({
        "msg":"登录失败，用户已经登陆",
      })
    }
    
		}
	})
})
//退出登陆
router.get('/login/outlogin',(req,res)=>{
  console.log(123);
  console.log(req.query);
  var body = req.query
  var idx
  issession = session.filter((item,index)=>{
    if(item.username == body.username){ 
      idx = index
    }
    return item.username == body.username
  })
  if(issession.length!==0){
    session.splice(idx,1) 
    console.log(body.username+"退出了");
    res.json({ 
      "code":200,
      "msg":"退出成功",
      "data":"ok"
    })
  }
  else{
    res.json({ 
      "msg":"退出失败",
      "data":"no"
    })
  }
})
router.get('/login/outloginbyid',(req,res)=>{
  console.log(req.query);
  var body = req.query
  var idx
  issession = session.filter((item,index)=>{
    if(item._id == body.id){ 
      idx = index
    }
    return item._id == body.id
  })
  if(issession.length!==0){
    session.splice(idx,1) 
    console.log("退出了");
    res.json({ 
      "code":200,
      "msg":"退出成功",
      "data":"ok"
    })
  }
  else{
    res.json({ 
      "msg":"退出失败",
      "data":"no"
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
               "msg":"这个用户名已经被注册过啦！",
               "code":201
						 })
					}
				})
})
//获取七牛云token
router.get('/token/cper/gettoken',(req,res)=>{
  const accesskey='NE8_vBQZRIGgA3rME0MDu_nrFLnb6RXYoE3vDdtH';
  const ssk='o7pfhdI45Y88B3rIw3P5yC0d18Jm7fFYN9teGDBx';
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
             "msg":"用户信息失效，请重新登陆",
             "data":err,
           })
          }
          else{
            res.json({
              "code":200,
              "msg":"修改成功",
              "data":result
            })
          }
          })
      }
    })
    .then(()=>{
      Blog.find((err,ret)=>{
        if(err){
          res.json({
            "msg":err
          })
        }else{
          var updatearr = ret.map((item,index)=>{
            return item.writer == req.session.user.username
          })
          for(i=0;i<ret.length;i++){
            if(updatearr[i]){
              Blog.updateMany({writer:req.session.user.username},{writerickname:body.nickname},(err)=>{
                if(err){
                  res.json({
                    "msg":"服务器错误"
                  })
                }
              })
            }
          }
        }
      })
    })
    .then(()=>{
      Comments.find((err,rut)=>{
        if(err){
          res.json({
            "msg":err
          })
        }else{
          // console.log(rut);
          var updatearr = rut.map((item,index)=>{
            return item.commer == req.session.user.username
          })
          for(i=0;i<rut.length;i++){
            if(updatearr[i]){
              Comments.updateMany({commer:req.session.user.username},{commernickname:body.nickname},(err)=>{
                if(err){
                  res.json({
                    "msg":"服务器错误"
                  })
                }
              })
            }
          }
        }
      })
    })
  }
  else{
    res.json({
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
    .then(()=>{
      Blog.find((err,ret)=>{
        if(err){
          res.json({
            "msg":err
          })
        }else{
          var updatearr = ret.map((item,index)=>{
            return item.writer == req.session.user.username
          })
          for(i=0;i<ret.length;i++){
            if(updatearr[i]){
              Blog.updateMany({writer:req.session.user.username},{headimg:body.headimg},(err)=>{
                if(err){
                  res.json({
                    "msg":"服务器错误"
                  })
                }
              })
            }
          }
        }
      })
    })
    .then(()=>{
      Comments.find((err,ret)=>{
        if(err){
          res.json({
            "msg":err
          })
        }else{
          var updatearr = ret.map((item,index)=>{
            return item.commer == req.session.user.username
          })
          for(i=0;i<ret.length;i++){
            if(updatearr[i]){
              Comments.updateMany({commer:req.session.user.username},{commerhead:body.headimg},(err)=>{
                if(err){
                  res.json({
                    "msg":"服务器错误"
                  })
                }
              })
            }
          }
        }
      })
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
router.post('/blog/writeblog',(req,res)=>{
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
    User.findOne({_id:req.session.user._id},(err,ret)=>{
      if(err){
        res.json({
          "msg":"查询用户错误"
        })
      }
      else{
        var blog = new Blog({
          title: req.body.title,
          text: req.body.text,
          writer: ret.username,
          writerickname:ret.nickname,
          headimg:ret.headimg,
          writedate:time,
          visitors:[]
        })
        blog.save((err,rut)=>{
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
        if (v){
        var isvisit = arrv.filter(item=>{
          return item.visitor == body.visitor
        })
        if(isvisit.length==0){
          arrv.push(v)
        } 
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
//查询评论
router.get('/blog/findcommentbyid',(req,res)=>{
  var body = req.query
  Comments.find({blogid:body.blogid},(err,ret)=>{
    if (err) {
      res.json({
        "msg":"获取评论列表失败"
      })
    }else{
      res.json({
        "code":200,
        "msg":"评论获取成功",
        "data":ret
      })
    }
  })
})
//发布评论
router.get('/blog/uploadcomment',(req,res)=>{
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length!==0){
    User.findOne({_id:req.session.user._id},(err,ret)=>{
      if(err){
        res.json({
          "msg":"查询用户错误"
        })
      }
      else{
        var body = req.query
    var comment = new Comments({
      blogid:body.blogid,
      content:body.comment,
      commernickname:ret.nickname,
      commer:ret.username,
      commerhead:ret.headimg,
    })
    comment.save((err,ret)=>{
      if (err) {
        res.json({
          "data":"评论失败"
        })
      }
      else{
        res.json({
          "code":200,
          "data":comment,
          "msg":"评论成功"
        })
      }
    })
      }
    })
    
  } 
  else{
    res.json({
      "msg":"先登录了啦～～～",
      "code":201
    })
  } 
})
//查找所有用户
router.get('/user/findAll',(req,res)=>{
  User.find((err,ret)=>{
    if (err) {
      res.json({
        "msg":"error了"
      })
    }else{
      res.json({
        "code":200,
        "msg":"查询成功",
        "data":ret
      })
    }
  })
})
//查询所有博客
router.get('/blog/findAll',(req,res)=>{
  Blog.find((err,ret)=>{
    if (err) {
      res.json({
        "msg":"error了"
      })
    }else{
      res.json({
        "code":200,
        "msg":"查询成功",
        "data":ret
      })
    }
  })
})
//收藏博客
router.get('/blog/collectblog',(req,res)=>{
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length!==0){
    var body = req.query
    var arrc = []
    var c = {
      blogid:body.blogid
    }
    User.findOne({_id:req.session.user._id},(err,ret)=>{
      if(err){
        res.json({
          "msg":"查询错误"
        })
      }
      else{
        arrc = ret.collections
        arrc.push(c)
        User.updateOne({_id:ret._id},{collections:arrc},(err,rut)=>{
          if(err){
            res.json({
              "msg":"收藏失败"
            })
          }
          else{
            res.json({
              "code":200,
              "msg":'收藏成功'
            })
          }
        })
      }
    })
  }
  else{
    res.json({
      "msg":"请先登录了啦～～～"
    })
  }
})
//取消收藏
router.get('/blog/discollectblog',(req,res)=>{
  issession = session.filter(item=>{
    return item._id == req.session.user._id
  })
  if(issession.length!==0){
    var body = req.query
    var discarr = []
    var disc = {
      blogid: body.blogid
    }
    User.findOne({_id: req.session.user._id},(err,ret)=>{
      if(err){
        res.jaon({
          "mag":"获取用户信息失败"
        })
      }else{
        discarr = ret.collections
        for(var dis = 0;dis<discarr.length;dis++){
          if(disc.blogid == discarr[dis].blogid){

            discarr.splice(dis,1)
          }
        }

        User.updateOne({_id:ret._id},{collections:discarr},(err,rut)=>{
          if(err){
            res.json({
              "msg":"收藏失败"
            })
          }
          else{
            res.json({
              "code":200,
              "msg":'取消收藏成功'
            })
          }
        })
      }
    })
  }
  else{
    res.json({
      "msg":"操作失败，用户登陆信息失效"
    })
  }
})
//检查博客是否被此用户收藏
router.get('/blog/isusercollect',(req,res)=>{
  User.findOne({username: req.session.user.username},(err,ret)=>{
    var body = req.query
    ret.collections.map(item=>{
      if (item.blogid == body.blogid) {
          res.json({
          "code":200,
          "msg":"查询收藏状态成功",
          "data":true 
        })
      }
    })
  })
})
//根据id查找博客
router.get('/blog/findbyid',(req,res)=>{
  var body = req.query
  Blog.find({_id: body.bgid},(err,ret)=>{
    if(err){
      res,json({
        "msg":"关注列表读取失败"
      })
    }
    else{
      res.json({
        "code":200,
        "msg":'关注获取成功',
        "data":ret
      })
    }
  })
})
//查找关注
router.get('/blog/findblogbycollect',(req,res)=>{
  User.findOne({_id:req.session.user._id},(err,ret)=>{
    if(err){
      res.json({
        "msg":"获取失败"
      })
    }
    else{
      if(ret.collections.length == 0){
        res.json({
          "msg":"还未收藏博客"
        })
      }
      else{
        var collblog = []
        ret.collections.map((item,index)=>{
          Blog.findOne({_id:item.blogid},(err,rut)=>{
            if(err){
                res.json({
                "msg":"这条博客已经消失"
              })
            }
            else{
              // console.log(index);
              collblog.push(rut)

              if(index==ret.collections.length-1){
                res.json({
                  "code":200,
                  "msg":"关注的博客查询成功",
                  "data":collblog
                })
              }
            }
          })
        })
        // for(var i = 0;i<ret.collections.length;i++){
        //     Blog.findOne({_id:ret.collections[i].blogid},(err,rut)=>{
        //       if(err){
        //         res.json({
        //           "msg":"这条博客已经消失"
        //         })
        //       }
        //       else{
        //         collblog.push(rut)
        //         // console.log(collblog);
        //         console.log(i);
        //       }
        //     })
        // }
      }
    }
  })
})
//查找个人博客
router.get('/blog/findpersonblog',(req,res)=>{
  Blog.find({writer: req.session.user.username},(err,ret)=>{
    if(err){
      res.json({
        "msg":'信息列表获取失败'
      })
    }
    else{
      res.json({
        "code":200,
        "msg":"信息列表获取成功",
        "data":ret
      })
    }
  })
})
module.exports = router;