'use strict'


const wechatHttp = require('../api-invoke/wechat-http');
const mongoose = require('mongoose');
const AccessTokenModel = mongoose.model('AccessToken');

/**获取access_token
 * https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140183
 *
 * @returns {Promise<string>}
 */
async function getAccessToken(){

  let result ;
  let findeDbAccessTokens = await AccessTokenModel.find();

  console.log('_____________findeDbAccessToken:'+ JSON.stringify(findeDbAccessTokens));
  //1.从数据库取数据，并且判断可用性；若不可用则更新；
  if(findeDbAccessTokens){
    if(findeDbAccessTokens.length >0 ){
      let accessTokenHttpData = {};
      let dBData = findeDbAccessTokens[0];
      let isValid = true;
      if(isValid){
        console.log('_isValid:'+isValid);
        //2.从数据库取数据,可用
        result = dBData ;
      }else{
        //3.从数据库取数据,不可用，更新【删除原有数据，重新录入信息】
        for (let item of findeDbAccessTokens) {
          await AccessTokenModel.remove({_id : item._id});
        }
        let accessTokenHttpData = {
          accessToken :'',
          expiresIn : ''
        };
        let httpData = await wechatHttp.getAccessToken();
        console.log('httpData:'+JSON.stringify(httpData));
        accessTokenHttpData.accessToken = httpData.access_token;
        accessTokenHttpData.expiresIn = httpData.expires_in;
        console.log('isValid_:'+isValid);
        console.log('accessTokenHttpData:'+JSON.stringify(accessTokenHttpData));
        let accessTokenModel = new AccessTokenModel({
          accessToken : accessTokenHttpData.accessToken,
          expiresIn : accessTokenHttpData.expiresIn
        });
        await accessTokenModel.save();
        result = accessTokenModel;
      }
    }else{
      console.log('findeDbAccessTokens size == 0');
      //4.初始化数据
      console.log('init running, findeDbAccessTokens is null!');
      let accessTokenHttpData = {
        accessToken :'',
        expiresIn : ''
      };
      let httpData = await wechatHttp.getAccessToken();
      console.log('httpData:'+JSON.stringify(httpData));
      accessTokenHttpData.accessToken = httpData.access_token;
      accessTokenHttpData.expiresIn = httpData.expires_in;
      console.log('accessTokenHttpData:'+JSON.stringify(accessTokenHttpData));
      let accessTokenModel = new AccessTokenModel({
        accessToken : accessTokenHttpData.accessToken,
        expiresIn : accessTokenHttpData.expiresIn
      });
      await accessTokenModel.save();
      result = accessTokenModel;
    }
  }else{



    //5.初始化数据 =>数据库查询失败！！
    console.log('数据库查询失败 init running, findeDbAccessTokens is null!');
    let accessTokenHttpData ;
    let { access_token,expires_in } = await wechatHttp.getAccessToken();
    accessTokenHttpData.accessToken = access_token;
    accessTokenHttpData.expiresIn = expires_in;
    console.log('accessTokenHttpData:'+JSON.stringify(accessTokenHttpData));
    let accessTokenModel = new AccessTokenModel({
      accessToken : accessTokenHttpData.accessToken,
      expiresIn : accessTokenHttpData.expiresIn
    });
    await accessTokenModel.save();
    result = accessTokenModel;
  }
  return result;
}





module.exports = {
  getAccessToken
}