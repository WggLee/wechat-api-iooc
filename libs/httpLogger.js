'use strict'

const os = require('os')
const util = require('util')
const Transform = require('stream').Transform

const defaultOptions = {
  separator: '§',
  excludePath: [
    '/'
  ],
  delegateConsole: false
}
const options = {}

let delegateMethods = ['info', 'log', 'warn', 'error', 'dir', 'trace', 'debug']
let originConsoleMethods = {}

module.exports = function (opts) {
  Object.assign(options, defaultOptions, opts)
  options.hostname = os.hostname()
  options.pid = process.pid

  if (opts.delegateConsole) {
    delegateConsole()
  }

  return async function logger (ctx, next) {
    const start = Date.now()
    try {
      ctx._logObject = {}
      // 在 ctx 上加入一个打日志的插件.
      ctx.toLog = function (key, vals) {
        ctx._logObject[key] = vals.length === 1 ? vals[0] : vals
      }
      // 给所有Response添加 X-Server-Info Header, 用于识别处理请求的 server
      ctx.set('X-Server-Info', `${options.hostname};${options.pid}`)

      await next()
      // 计算 response 的长度, 需要考虑流式响应的情况
      let length = ctx.response.length || (ctx.body && ctx.body.length) || 0
      if (length === 0 && ctx.body && ctx.body.readable) {
        ctx.body = ctx.body.pipe(new Transform({
          'transform': function (chunk, encoding, callback) {
            length += chunk.length
            this.push(chunk)
            callback()
          }
        }))
      }

      // 请求结束后打日志
      ctx.res.on('finish', () => log(ctx, start, length, null))
      ctx.res.on('close', () => log(ctx, start, length, null))
    } catch (err) {
      // 异常, 打印错误信息
      log(ctx, start, 0, err)
    }
  }
}

/**
 * Log helper.
 */
function log (ctx, start, len, err) {
  if (options.excludePath.includes(ctx.originalUrl)) {
    return // 不需要记录日志的情况
  }

  // 判断相应码
  const status = err
    ? (err.status || 500)
    : (ctx.status || 404)

  // 访问日志的输出内容与格式.
  let props = [
    new Date().toJSON(), // 时间
    '', // git commit 版本号 (已废弃, 保留空串占位)
    options.pid, // 进程id
    ctx.method, // HTTP method
    ctx.path, // URL Path, 不包括 queryString
    status, // HTTP 响应码
    (Date.now() - start) + 'ms', // 服务器响应时间
    len + 'B', // 响应体的 size
    ctx.request.headers['x-caller'] || '', // 调用者信息(在 wormhole 中定义的 header), 请不要删除
    ctx.request.headers['client-type'] || '', // 客户端类型
    ctx.request.headers['client-version'] || '' // 客户端版本
  ]

  // 对于异常信息的处理, 包括日志输出, 响应格式化, 发送钉钉消息等. 保持和 http-assert http-error 的兼容性
  if (err) {
    if (status >= 500) { // 5xx 需要输出到 error log 中
      errorTrace(ctx, err, props)
      ctx.status = err.status || 500
      ctx.body = err.message
    } else { // 4xx 仅需要输出到 access log 中
      ctx.status = err.status
      ctx.body = {
        'ok': false,
        'message': err.message
      }
      err.msg && (ctx.body.msg = err.msg)
    }
    logDetails(ctx) // 如果出现错误(4xx, 5xx), 都需要在 access-log 中记录详细信息
  }

  // 如果设置了 NODE_LOG=VERBOSE 环境变量, 则在访问日志中打印详细请求和响应信息. 通常用在开发测试环境下
  if (/verbose/i.test(process.env.NODE_LOG)) {
    logDetails(ctx)
  }

  props.push(JSON.stringify(ctx._logObject)); // 额外日志信息

  (originConsoleMethods.info || console.info)(props.join(options.separator)) // unicode of section sign (§) is U+00a7
}

function logDetails (ctx) {
  ctx._logObject.headers = ctx.headers
  ctx._logObject.body = ctx.request.body
  ctx._logObject.query = ctx.request.query
  ctx._logObject.params = ctx.request.params
  ctx._logObject.response = ((ctx.body && ctx.body.readable !== undefined) || ctx.body instanceof Buffer) ? {} : ctx.body // 流式响应不输出内容(压缩或下载资源等情况)
}

/*
 * 打印详细错误信息到  stderr
 */
function errorTrace (ctx, err, props) {
  let ctxInfo = {}
  ctxInfo.request = ctx.request
  ctxInfo.body = ctx.request.body
  ctxInfo.query = ctx.request.query
  ctxInfo.status = ctx.status
  ctxInfo.response = ctx.body
  ctxInfo = JSON.stringify(ctxInfo, null, 4)
  let trace = [
    props.join(options.separator),
    util.inspect(err),
    'Context: ',
    ctxInfo
  ];

  (originConsoleMethods.error || console.error)(trace.join('\n'))
}

/*
   代理 console. 目的是控制台输出的行首加上时间戳, 该时间戳可能会用来做正则首行匹配.
 */
function delegateConsole () {
  delegateMethods.forEach(methodName => {
    if (!originConsoleMethods[methodName]) {
      originConsoleMethods[methodName] = console[methodName]
    }
    console[methodName] = function () {
      Array.prototype.unshift.call(arguments, new Date().toJSON()) // 例 2017-11-13T08:58:10.922Z some log
      originConsoleMethods[methodName].apply(this, arguments)
    }
  })
}
