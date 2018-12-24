'use strict'

const Router = require('koa-router');
const router = new Router();
const service = require('../services/wechat-service');
const wechatHttp = require('../api-invoke/wechat-http');

router.get('/api', async ctx => {
  let qs = ctx.request.query;
  ctx.body = await service.checkWechatSign(qs);
});

router.post('/api', async ctx => {
  console.log('post---------------'+JSON.stringify({ok : true ,msg :'this is Post request api'}));
  let body = ctx.request.body;
  console.log('body:'+JSON.stringify(body));
  ctx.body = {ok : true ,msg :'this is Post request api'};
});


router.get('/test', async ctx => {
  let qs = ctx.request.query;
  let sign = qs.sign;
  let result;
  if(sign === 'get'){
    result = await wechatHttp.meGet({});
  }else if(sign === 'post'){
    result = await wechatHttp.meGetPost({});
  }else if(sign === 'acc'){
    result = await wechatHttp.getAccessToken();
  }else if(sign == 'accs'){
    result = await service.getAccessToken();
  }
  ctx.body = result;
});

module.exports = router;