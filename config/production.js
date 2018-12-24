'use strict'

const config_model ={
  port: process.env.NODE_PORT || 8005,

  wechat : {
    appId : 'wxeae6c171a983e1f4',
    appSecret : '2a4af6ea9cb089d243829338b3f86d6a',
    token : 'e9ukx1wnnapm7vdizudvkml2l1a2uqnv'
  },

  mongoDB: {
    uri : 'mongodb://153.0.0.1/wechat-iooc',
    options: {
      useMongoClient: true,
      keepAlive: 1,
      poolSize: 10
    }
  },

  jwt: {
    secret: 'follow your heart&intuition',
    options: {
      expiresIn: 7200
    }
  }

};

module.exports = config_model ;