/*!
 * top - test/client.test.js
 * Copyright(c) 2012 - 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var should = require('should');
var mm = require('mm');
var urllib = require('urllib');
var fs = require('fs');
var path = require('path');
var top = require('../');

var REST_URL = 'http://gw.api.tbsandbox.com/router/rest';
var TBSANDBOX_REST_URL = 'http://gw.api.taobao.com/router/rest';

describe('client.test.js', function () {
	var client = top.createClient({
		appkey: '1021178166',
		appsecret: 'sandboxbc0042b2231100842349ad492',
		REST_URL: REST_URL
	});
	describe.skip('old api', function () {
		afterEach(mm.restore);

		describe('new Client()', function () {
			it('should return Client', function () {
				var client = new top.Client({appkey: 'key', appsecret: 'secret'});
				client.should.be.instanceof(top.Client);
				var clientWithoutNew = top.Client({appkey: 'key', appsecret: 'secret'});
				clientWithoutNew.should.be.instanceof(top.Client);
			});

			it('should throw error when miss appkey or appsecret', function () {
				(function () {
					top.createClient();
				}).should.throw('appkey or appsecret need!');
				(function () {
					top.createClient({appkey: 'test'});
				}).should.throw('appkey or appsecret need!');
				(function () {
					top.createClient({appsecret: 'test'});
				}).should.throw('appkey or appsecret need!');
			});
		});

		describe('sign() http://open.taobao.com/doc/detail.htm?id=111#s6', function () {
			it('should equal 990FD28323F67A1EEC29336EDF373C0E', function () {
				var c = top.createClient({
					appkey: 'test',
					appsecret: 'test'
				});
				var params = {
					method: 'taobao.user.get',
					timestamp: '2011-07-01 13: 52:03',
					format: 'xml',
					app_key: 'test',
					v: '2.0',
					fields: 'nick,location.state,location.city',
					nick: '商家测试帐号17',
					sign_method: 'md5',
				};
				c.sign(params).should.equal('990FD28323F67A1EEC29336EDF373C0E');
			});
		});

		describe('timestamp()', function () {
			it('should return yyyy-MM-dd HH:mm:ss format', function () {
				var s = client.timestamp();
				s.should.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/);
			});
		});

		describe('request()', function () {
			it('should request success', function (done) {
				client.request({
					method: 'taobao.user.get',
					fields: 'nick,seller_credit',
					nick: 'sandbox_c_1'
				}, function (err, result) {
					should.not.exist(err);
					var user = result.user_get_response.user;
					user.should.have.keys(['nick', 'seller_credit']);
					user.nick.should.equal('sandbox_c_1');
					done();
				});
			});

			it('should throw error when method miss', function (done) {
				client.request({}, function (err) {
					should.exist(err);
					err.message.should.equal('`method` required');
					done();
				});
			});

			it('should return error when method wrong', function (done) {
				client.request({method: 'not_exists'}, function (err, data) {
					should.exist(err);
					err.message.should.equal('Invalid method, code 22');
					err.code.should.equal(22);
					should.exist(err.data);
					var jsonResult = JSON.parse(err.data);
					should.exist(jsonResult.error_response);
					jsonResult.error_response.code.should.equal(22);
					jsonResult.error_response.msg.should.equal('Invalid method');
					should.exist(jsonResult.error_response.request_id);
					done();
				});
			});
		});

		describe('_wrapJSON()', function () {
			it('should convert long id number to string', function () {
				var s = fs.readFileSync(path.join(__dirname, 'fixtures', 'tmc_messages_consume_response.json')).toString();
				s = client._wrapJSON(s);
				var o = JSON.parse(s);
				// console.log('%s, %j', s, o.tmc_messages_consume_response.messages)
				o.tmc_messages_consume_response.messages.tmc_message[0].id.should.equal('7104300007405429232');
			});
		});

		describe('invoke()', function () {
			var _request = urllib.request;
			afterEach(function () {
				urllib.request = _request;
			});

			it('should mock urllib.request() error', function (done) {
				urllib.request = function (url, options, callback) {
					process.nextTick(function () {
						callback(new Error('mock error'));
					});
				};
				client.invoke('taobao.shop.get', {nick: 'abc', fields: '123'}, [], null, 'GET',
					function (err, item) {
						should.exist(err);
						should.not.exist(item);
						err.should.have.property('message', 'mock error');
						done();
					});
			});

			it('should mock urllib.request() json parse error', function (done) {
				urllib.request = function (url, options, callback) {
					process.nextTick(function () {
						callback(null, '{');
					});
				};
				client.invoke('taobao.shop.get', {nick: 'abc', fields: '123'}, [], null, 'GET',
					function (err, item) {
						should.exist(err);
						should.not.exist(item);
						err.should.have.property('message', 'Unexpected end of input');
						err.should.have.property('name', 'SyntaxError');
						done();
					});
			});
		});

		describe('taobao_user_buyer_get()', function () {
			var _request = urllib.request;
			afterEach(function () {
				urllib.request = _request;
			});
			it('should return buyer', function (done) {
				urllib.request = function (url, options, callback) {
					process.nextTick(function () {
						callback(null, JSON.stringify(require('./fixtures/user_buyer_get_response.json')));
					});
				};
				client.taobao_user_buyer_get({
					session: 'mock',
					fields: 'nick,sex,buyer_credit,avatar,has_shop,vip_info',
					nick: 'sandbox_c_1'
				}, function (err, user) {
					should.not.exist(err);
					user.should.have.keys('nick,sex,buyer_credit,avatar,has_shop,vip_info'.split(','));
					user.nick.should.equal('sandbox_c_1');
					done();
				});
			});

			it('should return null when session wrong', function (done) {
				client.taobao_user_buyer_get({session: 'mock', fields: 'sex,nick', nick: 'alipublic01notexists'},
					function (err, user) {
						should.exist(err);
						err.name.should.equal('TOPClientError');
						err.code.should.equal(27);
						err.sub_code.should.equal('INVALID_PARAMS');
						var jsonResult = JSON.parse(err.data);
						jsonResult.error_response.msg.should.startWith('Invalid session');
						jsonResult.error_response.sub_msg.should.startWith('INVALID_PARAMS:invalid AccessToken : mock');
						should.not.exist(user);
						done();
					});
			});

			it('should throw error when nick miss', function (done) {
				client.taobao_user_buyer_get({fields: 'sex,nick'}, function (err, user) {
					should.exist(err);
					err.message.should.equal('`session` required');
					done();
				});
			});
		});

		describe('taobao_user_seller_get()', function () {
			var _request = urllib.request;
			afterEach(function () {
				urllib.request = _request;
			});
			it('should return seller', function (done) {
				var fields = 'user_id,nick,sex,seller_credit,type,has_more_pic,item_img_num,item_img_size,prop_img_num,prop_img_size,auto_repost,promoted_type,status,alipay_bind,consumer_protection,avatar,liangpin,sign_food_seller_promise,has_shop,is_lightning_consignment,has_sub_stock,is_golden_seller,vip_info,magazine_subscribe,vertical_market,online_gaming';
				urllib.request = function (url, options, callback) {
					process.nextTick(function () {
						var user = require('./fixtures/user_seller_get_response.json');
						var keys = fields.split(',');
						var seller = {user_seller_get_response: {user: {}}};
						for (var i = 0; i < keys.length; i++) {
							var k = keys[i];
							seller.user_seller_get_response.user[k] = user.user_seller_get_response.user[k];
						}
						callback(null, JSON.stringify(seller));
					});
				};
				client.taobao_user_seller_get({
					session: 'mock',
					fields: fields,
					nick: 'hz0799'
				}, function (err, user) {
					should.not.exist(err);
					user.should.have.keys(fields.split(','));
					user.nick.should.equal('hz0799');
					done();
				});
			});

			it('should return err when session wrong', function (done) {
				client.taobao_user_seller_get({session: 'mock', fields: 'sex,nick', nick: 'alipublic01notexists'},
					function (err, user) {
						should.exist(err);
						err.name.should.equal('TOPClientError');
						var jsonResult = JSON.parse(err.data);
						jsonResult.error_response.msg.should.startWith('Invalid session');
						jsonResult.error_response.sub_msg.should.startWith('INVALID_PARAMS:invalid AccessToken : mock');
						should.not.exist(user);
						done();
					});
			});

			it('should throw error when nick miss', function (done) {
				client.taobao_user_seller_get({fields: 'sex,nick'}, function (err, user) {
					should.exist(err);
					err.message.should.equal('`session` required');
					done();
				});
			});
		});

		describe('taobao_user_get()', function () {
			it('should return user', function (done) {
				client.taobao_user_get({fields: 'seller_credit,nick', nick: 'sandbox_c_1'},
					function (err, user) {
						should.not.exist(err);
						user.should.have.keys(['seller_credit', 'nick']);
						user.nick.should.equal('sandbox_c_1');
						done();
					});
			});

			it('should return null when nick not exists', function (done) {
				client.taobao_user_get({fields: 'user_id,nick', nick: 'alipublic01notexists'},
					function (err, user) {
						should.not.exist(err);
						should.not.exist(user);
						done();
					});
			});

			it('should throw error when nick miss', function (done) {
				client.taobao_user_get({fields: 'user_id,nick'}, function (err, user) {
					should.exist(err);
					err.message.should.equal('`nick` required');
					done();
				});
			});
		});

		describe('taobao_users_get()', function () {
			it('should return users list', function (done) {
				client.taobao_users_get({fields: 'seller_credit,nick', nicks: 'sandbox_c_2,sandbox_c_1'},
					function (err, users) {
						should.not.exist(err);
						users.should.length(2);
						for (var i = users.length; i--;) {
							var user = users[i];
							user.should.have.keys(['seller_credit', 'nick']);
							user.nick.should.equal(i === 0 ? 'sandbox_c_2' : 'sandbox_c_1');
						}
						done();
					});
			});

			it('should return 4 length list when nicks are all same', function (done) {
				client.taobao_users_get({
					fields: 'nick',
					nicks: 'sandbox_c_1,sandbox_c_2,sandbox_c_3,sandbox_c_4'
				}, function (err, users) {
					should.not.exist(err);
					users.should.length(4);
					for (var i = users.length; i--;) {
						var user = users[i];
						user.should.have.keys(['nick']);
						user.nick.should.match(/sandbox_c_\d/);
					}
					done();
				});
			});

			it('should return 1 length list when one nick not exists', function (done) {
				client.taobao_users_get({fields: 'nick', nicks: 'sandbox_c_3,苏千notexists'},
					function (err, users) {
						should.not.exist(err);
						users.should.length(1);
						for (var i = users.length; i--;) {
							var user = users[i];
							user.should.have.keys(['nick']);
							user.nick.should.equal('sandbox_c_3');
						}
						done();
					});
			});

			it('should return [] no nick exists', function (done) {
				client.taobao_users_get({fields: 'user_id,nick', nicks: '苏千苏千notexists2,苏千notexists'},
					function (err, users) {
						should.not.exist(err);
						users.should.length(0);
						done();
					});
			});

			it('should throw error when nicks miss', function () {
				client.taobao_users_get({fields: 'user_id,nick'}, function (err, user) {
					should.exist(err);
					err.message.should.be.equal('`nicks` required');
				});
			});
		});

		describe('tmall_selected_items_search()', function () {
			var mockData = JSON.stringify({
				"tmall_selected_items_search_response": {
					"item_list": {
						"selected_item": [{
							"cid": 1101,
							"num_iid": 13088700250,
							"shop_id": 59227746,
							"item_score": "67.33659988217163"
						}]
					}
				}
			});
			var _request = urllib.request;
			after(function () {
				urllib.request = _request;
			});
			// api permission required
			it('should return items', function (done) {
				urllib.request = function (url, options, callback) {
					process.nextTick(function () {
						callback(null, mockData);
					});
				};
				client.tmall_selected_items_search({cid: 50016349}, function (err, items) {
					should.not.exist(err);
					should.exist(items);
					items.should.be.an.instanceof(Array).with.length(1);
					items[0].should.have.keys('cid', 'num_iid', 'shop_id', 'item_score');
					client.taobao_item_get({
						num_iid: items[0].num_iid,
						fields: 'item_img.url,title,price'
					}, done);
				});
			});

			it('should return parameter missing error', function (done) {
				client.tmall_selected_items_search({}, function (err, items) {
					should.exist(err);
					err.name.should.equal('ParameterMissingError');
					err.message.should.equal('`cid` required');
					done();
				});
			});
		});

		describe('taobao_jindoucloud_message_send()', function () {
			var mockData = JSON.stringify({
				"jindoucloud_message_send_response": {
					"send_results": {
						"send_result": [{
							"nick": "nick",
							"err_msg": "nick is null",
							"err_code": "isv.invalid-parameter",
							"is_success": "false"
						}]
					}
				}
			});

			before(function () {
				mm.data(urllib, 'request', mockData);
			});

			after(function () {
				mm.restore();
			});

			// api permission required
			it('should return items', function (done) {
				var params = {
					messages: [{
						"nick": "nick",
						"title": "title",
						"view_data": ["a", "b"],
						"biz_data": {"k1": "v1", "k2": "v2"},
						"biz_id": 0,
						"send_no": 0,
						"msg_category": "item",
						"msg_type": "ItemCreate"
					}]
				};
				client.taobao_jindoucloud_message_send(params, function (err, items) {
					should.not.exist(err);
					should.exist(items);
					items.should.be.an.instanceof(Array).with.length(1);
					items[0].should.have.keys('nick', 'err_msg', 'err_code', 'is_success');
					done();
				});
			});

			it('should return parameter missing error', function (done) {
				var params = {};
				client.taobao_jindoucloud_message_send(params, function (err, items) {
					should.exist(err);
					err.name.should.equal('ParameterMissingError');
					err.message.should.equal('`messages` required');
					done();
				});
			});
		});
	});
	describe('openim api', function () {
		var c = top.createClient({
			appkey: '23230789',
			appsecret: '2fdefa15665b7ca32e56f556f7d21c26',
			rest_url: REST_URL
		});
		it('taobao_openim_users_add', function (done) {
			c.taobao_openim_users_add(
				[{
					userid: '15068729212',
					nick: '吴伟星',
					password: 'wwx'
				}], function (err, data) {
					should.not.exist(err);
					should.exist(data);
					should.exist(data.string);
					data.string[0].should.be.eql('15068729212');
					done();
				});
		});
		it('taobao_openim_users_get', function (done) {
			c.taobao_openim_users_get(["15068729212"], function (err, data) {
				should.not.exist(err);
				should.exist(data);
				should.exist(data.userinfos);
				data.userinfos[0].userid.should.be.eql('15068729212');
				data.userinfos[0].nick.should.be.eql('吴伟星');
				done();
			});
		});
		it('taobao_openim_users_update', function (done) {
			c.taobao_openim_users_update([{
					userid: "15068729212",
					icon_url: '111'
				}]
				, function (err, data) {
					should.not.exist(err);
					should.exist(data);
					data.string.should.be.instanceof(Array)
						.and.have.not.lengthOf(0);
					data.string[0].should.be.eql('15068729212');
					done();
				});
		});
		it('taobao_openim_users_get', function (done) {
			c.taobao_openim_users_get(["15068729212"], function (err, data) {
				should.not.exist(err);
				should.exist(data);
				should.exist(data.userinfos);
				data.userinfos[0].userid.should.be.eql('15068729212');
				data.userinfos[0].icon_url.should.be.eql('111');
				done();
			});
		});
		it('taobao_openim_users_delete', function (done) {
			c.taobao_openim_users_delete(["15068729212"], function (err, data) {
				should.not.exist(err);
				should.exist(data);
				data.string.should.be.instanceof(Array)
					.and.have.not.lengthOf(0);
				data.string[0].should.be.eql('ok');
				done();
			});
		});

		it('taobao_openim_users_get', function (done) {
			c.taobao_openim_users_get(["15068729212"], function (err, data) {
				should.not.exist(err);
				should.exist(data);
				should.not.exist(data.userinfos);
				done();
			});
		});
	});
});
