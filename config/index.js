let loadDevConfigs = require('./development');
let loadConfigs = require('./production');
exports.loadConfigs = process.env.NODE_ENV === 'development' ? loadDevConfigs : loadConfigs;
