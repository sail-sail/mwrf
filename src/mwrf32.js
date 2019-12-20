var ffi = require('ffi-napi');
var ref = require('ref-napi');
var refArray = require('ref-array-napi');

var mwhrf_bj = ffi.Library(`${__dirname}/../lib/mwhrf_bj`, {
  "lib_ver": [ "int", [ "string" ] ],
  "rf_get_status": [ "int", [ "int", "string" ] ],
  "Open_USB": [ "int", [ ] ],
  "rf_beep": [ "int", [ "int", "uint32" ] ],
});

/**
 * 读取软件版本号
 */
exports.lib_ver = function() {
  var buf = Buffer.allocUnsafe(18);
  mwhrf_bj.lib_ver(buf);
  return buf.toString("ascii");
};

/**
 * 取得读写器硬件版本号
 * @param  {} icdev 通讯设备标识符
 */
exports.rf_get_status = function(icdev) {
  var buf = Buffer.allocUnsafe(18).fill(0);
  mwhrf_bj.rf_get_status(icdev, buf);
  return buf.toString("ascii");
};

/**
 * 打开读写器，并对读写器合法性进行验证
 */
exports.Open_USB = function() {
  var icdev = mwhrf_bj.Open_USB();
  return icdev;
};

/**
 * 蜂鸣
 * @param  {} icdev 通讯设备标识符
 * @param  {} _Msec 蜂鸣时间，单位是10毫秒
 */
exports.rf_beep = function(icdev, _Msec) {
  var status = mwhrf_bj.rf_beep(icdev, _Msec);
  return status;
};
