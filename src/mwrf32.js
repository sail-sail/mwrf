var ffi = require('ffi-napi');
var ref = require('ref-napi');
var refArray = require('ref-array-napi');

var mwhrf_bj = ffi.Library(`${__dirname}/../lib/mwhrf_bj`, {
  "lib_ver": [ "int", [ "string" ] ],
  "rf_get_status": [ "int", [ "int", "string" ] ],
  "Open_USB": [ "int", [ ] ],
  "Close_USB": [ "int", [ "int" ] ],
  "rf_gettime": [ "int", [ "int", "string" ] ],
  "rf_gettimehex": [ "int", [ "int", "string" ] ],
  "rf_anticoll": [ "int", [ "int", "string", "string" ] ],
  "rf_beep": [ "int", [ "int", "uint32" ] ],
  "rf_reset": [ "int", [ "int", "uint32" ] ],
  "rf_halt": [ "int", [ "int" ] ],
  "rf_request": [ "int", [ "uint", "uint32", "string" ] ],
  "rf_select": [ "int", [ "int", "string", "string" ] ],
  "rf_card": [ "int", [ "int", "string", "string" ] ]
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
 * 关闭读写器，释放相关资源
 */
exports.Close_USB = function(icdev) {
  mwhrf_bj.Close_USB(icdev);
};

/**
 * 蜂鸣
 * @param  {} icdev 通讯设备标识符
 * @param  {} _Msec 蜂鸣时间，单位是10毫秒
 */
var rf_beep = function(icdev, _Msec) {
  mwhrf_bj.rf_beep(icdev, _Msec);
};
exports.rf_beep = rf_beep

/**
 * 读取读写器日期、星期、时间
 * @returns {Buffer} 返回数据，长度为7个字节，格式为“年、星期、月、日、时、分、秒”
 */
exports.rf_gettime = function(icdev) {
  var buf = Buffer.allocUnsafe(7);
  mwhrf_bj.rf_gettime(icdev, buf);
  return buf;
};

/**
 * 读取读写器日期、星期、时间
 * @returns {Buffer} 长度为14个字节,均为数字
 * datetime为“99040520133010”，
 * 表示99年星期四5月20日13时30分10秒
 */
exports.rf_gettimehex = function(icdev) {
  var buf = Buffer.allocUnsafe(15);
  mwhrf_bj.rf_gettimehex(icdev, buf);
  return buf.toString("ascii");
};

/**
 * 射频读写模块复位
 * @param  {} icdev 通讯设备标识符
 * @param  {} _Msec 复位时间，0～500毫秒有效
 */
var rf_reset = function(icdev, _Msec) {
  mwhrf_bj.rf_reset(icdev, _Msec);
};
exports.rf_reset = rf_reset;

/**
 * 中止对该卡操作
 * 执行该命令后如果是ALL寻卡模式则必须重新寻卡才能够对该卡操作，如果是IDLE模式则必须把卡移开感应区再进来才能寻得这张卡。
 * @param  {} icdev 通讯设备标识符
 */
exports.rf_halt = function(icdev) {
  mwhrf_bj.rf_halt(icdev);
};

/**
 * 寻卡请求
 * @param  {} icdev 通讯设备标识符
 * @param  {} _Mode 寻卡模式分三种情况：IDLE模式、ALL模式及指定卡模式。
 * 0——表示IDLE模式，一次只对一张卡操作；
 * 1——表示ALL模式，一次可对多张卡操作；
 * 2——表示指定卡模式，只对序列号等于snr的卡操作（高级函数才有）
 * @returns {Buffer} 卡类型值，0x0004为M1卡，0x0010为ML卡
 */
exports.rf_request = function(icdev) {
  var buf = Buffer.allocUnsafe(2);
  var _MsecBuf = Buffer.allocUnsafe(1);
  _MsecBuf[0] = 0x01;
  mwhrf_bj.rf_request(icdev, _Msec, buf);
  return buf;
};

/**
 * 寻卡请求
 * @param  {} icdev 通讯设备标识符
 * @returns {Buffer} 返回的卡序列号地址
 */
exports.rf_anticoll = function(icdev) {
  var buf = Buffer.allocUnsafe(4).fill(0);
  var buf1 = Buffer.allocUnsafe(1);
  buf1[0] = 0x00;
  mwhrf_bj.rf_anticoll(icdev, buf1, buf);
  return buf;
};

/**
 * 从多个卡中选取一个给定序列号的卡
 * @param {} icdev 通讯设备标识符
 * @param {} _Snr 卡序列号
 * @returns {Buffer} 指向返回的卡容量的数据
 */
exports.rf_select = function(icdev, _Snr) {
  var buf = Buffer.allocUnsafe(1);
  mwhrf_bj.rf_select(icdev, buf1, buf);
  return buf;
};

var rf_card = function(icdev) {
  var snr = Buffer.allocUnsafe(4).fill(0);
  var mode = Buffer.allocUnsafe(1);
  mode[0] = 0x00;
  mwhrf_bj.rf_card(icdev, mode, snr);
  return snr;
}
exports.rf_card = rf_card;

exports.rf_cardCb = function(opt, callback) {
  if(typeof(opt) === "function") {
    callback = opt;
    opt = undefined;
  }
  var stop = false;
  var icdev = opt && opt.icdev;
  var tmpFn = async function () {
    while(true) {
      if(stop) break;
      // rf_reset(icdev, 0);
      await new Promise((resolve) => setTimeout(resolve, opt && opt.intv || 500));
      var snr = rf_card(icdev);
      if(snr.toString("hex") === "00000000") continue;
      if(!opt || opt.notBeep !== true) {
        rf_beep(icdev, 10);
      }
      callback(snr);
    }
  };
  tmpFn();
  var stopFn = function() {
    stop = true;
  };
  return stopFn;
}

exports.rf_anticollCb = function(opt, callback) {
  if(typeof(opt) === "function") {
    callback = opt;
    opt = undefined;
  }
  var stop = false;
  var icdev = opt && opt.icdev;
  var mwrf = exports;
  var prevSnc = "";
  var timeout = undefined;
  var tmpFn = async function () {
    while(true) {
      if(stop) break;
      await new Promise((resolve) => setTimeout(resolve, opt && opt.intv || 1000));
      mwrf.rf_reset(icdev, 0);
      var buf = mwrf.rf_request(icdev);
      if(
        (buf[0] === 0x04 && buf[1] === 0x00) ||
        (buf[0] === 0x00 && buf[1] === 0x10) 
      ) {
        var snc = mwrf.rf_anticoll(icdev).toString("hex");
        if(snc.startsWith("0") && snc.endsWith("000000")) continue;
        if(prevSnc === snc) continue;
        prevSnc = snc;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          prevSnc = "";
        }, opt && opt.intv2 || 3000);
        if(!opt || opt.notBeep !== true) {
          mwrf.rf_beep(icdev, 10);
        }
        callback(snc);
      }
      // mwrf.rf_halt(icdev);
    }
  };
  tmpFn();
  var stopFn = function() {
    stop = true;
  };
  return stopFn;
}
