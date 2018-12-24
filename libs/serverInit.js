'use strict'

const mongoose = require('mongoose');
const requireDir = require('require-dir');
const loadConfigs = require('../config').loadConfigs;
const mongoDBCfg = loadConfigs.mongoDB;
console.log('mongoDBCfg:'+JSON.stringify(mongoDBCfg));

mongoose.Promise = global.Promise;

/**
 * 初始化数据库连接池
 * @returns {Promise<void>}
 */
module.exports = async function () {
  if (mongoose.connection.readyState === 0) {
    mongoose.connection.on('error', function (err) {
      console.error(err)
      console.info('Exit process.')
      process.exit(1)
    });

    /*
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
      const optionsString = options ? `, ${JSON.stringify(options, null, 2)}` : '';
      const msg = `${collectionName}.${method}(${JSON.stringify(query, null, 2)}, ${JSON.stringify(doc, null, 2)}${optionsString})`;
      console.log(`Mongoose: ${msg}`);
    });
    */


    await mongoose.connect(mongoDBCfg.url, mongoDBCfg.options);
    console.warn('Database connected.')
  }


  loadAllMongooseModel();
}

/**
 * 加载 MongooseModel
 */
function loadAllMongooseModel () {
  requireDir('../models')
}
