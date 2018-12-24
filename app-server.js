'use strict'

const Koa = require('koa');
const koaBody = require('koa-bodyparser');
const lodash = require('lodash');
const cors = require('koa2-cors');
const convert = require('koa-convert');
const mongoose = require('mongoose')
const xmlParser = require('koa-xml-body');
const koaStatic = require('koa-static');
const session = require('koa-session');
const logger = require('./libs/httpLogger')
const requestLog = require('./middlewares/requestLog');
const serverInit = require('./libs/serverInit');

global._ = lodash;

const CONFIG = {
  key: 'koa:sess',
  maxAge: 7200000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false
};


(function start() {
  let router, app;
  return Promise.resolve(true)
    .then(() => serverInit())
    .then(() => {
      router = require('./router');
      app =
        new Koa()
          .use(logger({
            delegateConsole: true,
            separator: process.env.NODE_ENV === 'production' ? '§' : '\t'
          }))
          .use(cors({
            origin: '*',
            exposeHeaders: ['Content-Range']
          }))
          .use(requestLog())
          .use(xmlParser())
          .use(koaBody())
          /*
          .use(KoaBody({multipart: true}))
          */
          .use(router.routes())
          .use(router.allowedMethods())
    })
    .then(() => {
      let port = process.env.NODE_PORT || 8000;
      app.listen(port, function () {
        console.warn('App server started listening on port', port);
      });
    })
    .catch(err => console.error('App server init error:', err))

})();


function gracefulShutDown() {
  console.warn('App server exit.');
  process.exit(1);
}


process.on('unhandledRejection', err => {
  console.error('unhandledRejection: ', err);
})

process.on('SIGINT', gracefulShutDown);
