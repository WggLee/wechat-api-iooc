'use strict'

/**
 * request log
 */
module.exports = function log () {
  return async function (ctx, next) {
    const { query, headers } = ctx.request
    // TODO: 输出格式优化
    ctx.toLog('headers', headers)
    ctx.toLog('qs', query)
    await next()
    ctx.toLog('body', ctx.request.body)
    ctx.toLog('resp-headers', ctx.response.headers)
    if (ctx.body instanceof Buffer) {
      ctx.toLog('return', {})
    } else {
      ctx.toLog('return', ctx.body)
    }
    console.log('-------------------')
  }
}
