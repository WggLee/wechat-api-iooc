'use strict'

const sha1 = require('sha1');
const loadConfigs = require('../config').loadConfigs;
const wechatApi = require('../libs/wechat-api');


const wechatInfo = loadConfigs.wechat;
const wehatConfig ={
  wechat :{
    appId : wechatInfo.appId,
    appSevret : wechatInfo.appSecret,
    token : wechatInfo.token
  }
};

/**
 * 验证消息的确来自微信服务器
 * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421135319
 *
 * signature	微信加密签名，signature结合了开发者填写的token参数和请求中的timestamp参数、nonce参数。
 * timestamp	时间戳
 * nonce	随机数
 * echostr	随机字符串
 *
 * @param params
 * @returns {Promise<void>}
 */
async function checkWechatSign(params ){
  console.log('wehatConfig:'+ JSON.stringify(wehatConfig));
  console.log('qs:'+JSON.stringify(params));
  let token = wechatInfo.token;
  let {signature,timestamp,nonce,echostr} = params;

  let sortStr = [token,timestamp,nonce].sort().join('');
  let sign = sha1(sortStr);

  if(sign === signature){
    return echostr +''
  }else{
    return 'check wechat api config wrong!'
  }
}


/**
 *
 * @returns {Promise<{accessToken: string}>}
 *  {
 *    "__v":0,
 *    "updated":"2018-12-24T04:14:24.526Z",
 *    "created":"2018-12-24T04:14:24.526Z",
 *    "accessToken":"16_xggrDliCI63KsKkBg81pYiWF0igsSYg-tiPGScs-
 *        lIPa0lI_qRwowAi3MAIHU9fxLhekGuTIIC2cHGmUOr0A0mLGu9LQznbmac
 *        D0tonfks35VTXhn-OoVzw-slOZI85TXIV7BYcvU7sdRJZJVRPbAGAKGE",
 *    "expiresIn":"7200",
 *    "_id":"5c205d207cbea0521ad913eb"
 *  }
 *
 */
async function getAccessToken(){
  let accessTokenData = await wechatApi.getAccessToken();
  console.log('----service----getAccessToken:'+JSON.stringify(accessTokenData));

  let result = {
    accessToken : accessTokenData.accessToken
  };
  return result;
}



module.exports = {
  checkWechatSign,
  getAccessToken
}
