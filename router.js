'use strict';

const KoaRouter = require('koa-router');
let router = new KoaRouter();

router.use('/wechat',require('./routers/wechat-api').routes());

module.exports = router;
