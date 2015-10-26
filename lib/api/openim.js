/**
 * openIM接口
 * Created by wuweixing on 15/10/23.
 */
'use strict';

var util = require('../util');

/**
 * 批量将账号导入IM服务器
 *
 * @see http://open.taobao.com/doc2/apiDetail.htm?apiId=24164
 * @param Userinfos []
 * @param callback
 * @returns {*}
 */
exports.taobao_openim_users_add = function (userinfos, callback) {
	var params = {
		userinfos: JSON.stringify(userinfos || null).replace(/\"(\w+)\":/g, "$1:")
	};
	var err = util.checkRequired(params, ['userinfos']);
	if (err) {
		return callback(err);
	}
	this.invoke('taobao.openim.users.add', params, ['openim_users_add_response', 'uid_succ'], null, 'POST', callback);
};

/**
 * 批量获取用户信息
 *
 * @see http://open.taobao.com/doc2/apiDetail.htm?apiId=24157
 * @param userids    String []
 * @param callback
 * @returns userinfos    Userinfos []
 */
exports.taobao_openim_users_get = function (userids, callback) {
	var userids = [].concat(userids).join(',');
	var params = {
		userids: userids
	};
	var err = util.checkRequired(params, ['userids']);
	if (err) {
		return callback(err);
	}
	this.invoke('taobao.openim.users.get', params, ['openim_users_get_response', 'userinfos'], null, 'POST', callback);
};

/**
 * 删除用户
 *
 * @see http://open.taobao.com/doc2/apiDetail.htm?apiId=24160
 * @param Userinfos []
 * @param callback
 * @returns {*}
 */
exports.taobao_openim_users_delete = function (userids, callback) {
	var userids = [].concat(userids).join(',');
	var params = {
		userids: userids
	};
	var err = util.checkRequired(params, ['userids']);
	if (err) {
		return callback(err);
	}
	this.invoke('taobao.openim.users.delete', params, ['openim_users_delete_response', 'result'], null, 'POST', callback);
};

/**
 * 批量更新用户信息
 *
 * @see http://open.taobao.com/doc2/apiDetail.htm?apiId=24161
 * @param Userinfos []
 * @param callback
 * @returns {*}
 */
exports.taobao_openim_users_update = function (userinfos, callback) {
	var params = {
		userinfos: JSON.stringify(userinfos || null).replace(/\"(\w+)\":/g, "$1:")
	};
	var err = util.checkRequired(params, ['userinfos']);
	if (err) {
		return callback(err);
	}
	this.invoke('taobao.openim.users.update', params, ['openim_users_update_response', 'uid_succ'], null, 'POST', callback);
};

