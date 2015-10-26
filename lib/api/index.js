/**
 * Created by wuweixing on 15/10/23.
 */
'use strict';

module.exports = function (Client) {
	var oldApi = require('./old-api'),
		openIM = require('./openim');
	// 扩展原型方法
	Object.keys(oldApi).forEach(function (key) {
		Client.prototype[key] = oldApi[key];
	});
	Object.keys(openIM).forEach(function (key) {
		Client.prototype[key] = openIM[key];
	});
};
