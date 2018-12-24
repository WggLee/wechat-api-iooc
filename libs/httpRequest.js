'use strict'

const fs = require('fs');
const retry = require('retry');
const Promise = require('bluebird');
const agent = {
  http: new (require('http').Agent)({keepAlive: false}),
  https: new (require('https').Agent)({keepAlive: false})
};
// 默认 request 选项
const request = require('request').defaults({
  agent: agent.http,
  method: 'GET',
  json: true
});
// 将 responseBody 和 response 组成数组后作为 resolve 的内容
exports.returnArray = false;

// 读取项目的名称
let rootPath = '';
if (fs.existsSync(__dirname + '/../.git')) {
  rootPath = __dirname + '/..';
} else {
  rootPath = __dirname + '/../../..';
}
let currentServiceName = '';
try {
  let packageInfo = JSON.parse(fs.readFileSync(rootPath + '/package.json'));
  currentServiceName = packageInfo.name;
} catch (err) {
  console.error(err);
}
// 读取项目当前 git 提交的 revision 信息
let currentGitRevision = '';
getGitCommitRevision((err, rev) => {
  if (err) return console.error(err);
  currentGitRevision = rev;
});



/*
    封装成 callback 和 promise 兼容的形式
    callback 形式可以拿到 node response 对象
    底层调用 request 包, options 的参数参考 https://github.com/request/request
 */
exports.request = function (options, callback) {
  if (typeof callback === 'function') {
    return requestCallback(options, callback);
  } else {
    return new Promise(function (resolve, reject) {
      requestCallback(options, function (err, body, resp) {
        // promise 形式忽略 node response 对象
        if (err) {
          reject(err);
        } else {
          exports.returnArray || options.returnArray ? resolve([body, resp]) : resolve(body) // body
        }
      })
    });
  }
};


/*
    callback 形式的请求函数
  */
function requestCallback(options, callback) {
  // 对请求参数进行预处理
  optionsWrapper(options);

  // 只有 GET 请求可以进行安全的重试操作. 重试的操作必须具有幂等性质
  if (options.method === 'GET') {
    let operation = retry.operation({
      'retries': 1,  // 最大重试3次
      'factor': 2, // 每次间隔时间按2的指数递增
      'minTimeout': 50, // 首次重试的间隔时间
      'maxTimeout': 500 // 两次重试之间的最大间隔
      // 每次延迟的计算公式:  Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
    });
    operation.attempt(_requests.bind(null, options, function(err) {
      let stopRetry = false;
      if (err) {
        if (err.status >= 400 && err.status < 500) {
          // 4xx 错误为客户端错误, 没有重试的必要. 连接错误或5xx错误重试才有意义
          stopRetry = true;
        } else if (/TIMEDOUT/i.test(err.code)){
          // 如果请求超时, 则将错误封装 504 状态码
          err.status = 504;
        }
      }
      if (!stopRetry && operation.retry(err)) { // 进行重试
        return;
      }
      if (stopRetry) { // 不需要重试时将 operation 关闭
        operation.stop();
      }
      // 记录重试的次数
      if (arguments[0]) {
        arguments[0].retries = operation.attempts();
      } else {
        arguments[2].retries = operation.attempts();
      }
      callback(...arguments); // 最终执行回调
    }));
  } else {
    _requests(options, function(err) {
      if (err && /TIMEDOUT/i.test(err.code)){
        err.status = 504;
      }
      callback(...arguments);
    });
  }
}


function optionsWrapper(options) {
  options.method = options.method || 'GET';
  options.method = options.method.toUpperCase();

  if (options.protocol === 'https:' || /^https:/.test(options.url)) {
    options.agent = agent.https;
  }

  options.headers = options.headers || {};
  // 将查询字符串 query string 中的无效值转为空字符串
  if (options.qs) {
    for (let key of Object.keys(options.qs)) {
      if ([null, undefined].includes(options.qs[key])) {
        options.qs[key] = '';
      }
    }
  }
  // 添加请求者的信息
  options.headers['x-caller'] = currentServiceName + ',' + currentGitRevision;
  // 对GET请求设定默认超时时间 5秒
  if (options.method === 'GET') {
    options.timeout = options.timeout || 5000;
  }
}

// 调用 request 包发送请求, 并对错误和状态码做基本分类, 处理错误信息
function _requests(options, callback) {
  request(options, function(err, resp, body) {
    if (err) {
      err.message = `call ${options.url} failed: ${err.message}`;
      callback(err);
    } else if (resp.statusCode >= 400) {
      let errorMessage = body instanceof Object ? (body.message || body.msg) : (body || resp.statusMessage);
      err = new Error(`call ${options.url} failed: ${errorMessage}`);
      err.upstreamBody = body;
      err.status = resp.statusCode;
      callback(err, body, resp);
    } else {
      callback(null, body, resp);
    }
  })
}

// 读取 git 当前提交的版本信息.
function getGitCommitRevision(callback) {
  fs.readFile(rootPath + '/.git/HEAD', function(err, content) {
    if (err) return callback(err);
    if (/^ref:/.test(content.toString())) {
      let ref = content.toString().split(/[\n ]/)[1];
      fs.readFile(rootPath + '/.git/' + ref, function(err, content) {
        if (err) return callback(err);
        return callback(err, content.toString().slice(0, 7));
      });
    } else {
      return callback(err, content.toString().slice(0, 7));
    }
  });
}
