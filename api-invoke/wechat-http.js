'use strict'

const httpRequest = require('../libs/httpRequest');
const config = require('../config').loadConfigs;

const wechatCfg = config.wechat;

/**
 * {
 *   "access_token":"16_KfcL9-I6pJ4NgHKq41Mplc2UQKQELNkPgWtHBagVnvFLaydqEjNVH55wNAuVMmP4i7KDzjSBCtIdlTLX2V9bZ7NjJxH7
 *   -G6BJbZ-i-XWdGguJh5Vv12S2y1Rb806oHHZFwuVzeCOslbR2UYDBPGgADAXLC",
 *   "expires_in":7200
 * }
 *
 * @param callback
 * @returns {*|*}
 */
function getAccessToken(callback) {
  let qs = {
    grant_type : 'client_credential',
    appid : wechatCfg.appId,
    secret : wechatCfg.appSecret
  };
  let options = {
    url: wechatCfg.api.getAccessTokenUrl,
    method: 'GET',
    qs: qs,
  };
  return httpRequest.request(options,callback);
}


/**
 *
 * @param params
 * @param callback
 * @returns {*|*}
 */
function meGet(params,callback) {
  let qs = {
    sign:'fdfdf',nihao:'dsdfdfefe'
  };
  let options = {
    url: `http://www.wgg-net.cn/wechat/iooc/wechat/api`,
    method: 'GET',
    qs: qs,
  };
  return httpRequest.request(options,callback);
}

/**
 *
 * @param params
 * @param callback
 * @returns {*|*}
 */
function meGetPost(params,callback) {
  let body = {
    sign:'fdfdf',nihao:'dsdfdfefe'
  };
  let options = {
    url: `http://www.wgg-net.cn/wechat/iooc/wechat/api`,
    method : 'POST',
    body : body
  };
  return httpRequest.request(options,callback);
}

module.exports = {
  meGet,
  meGetPost,
  getAccessToken
}
