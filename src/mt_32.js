var ffi = require('ffi-napi');
// var ref = require('ref-napi');
// var refArray = require('ref-array-napi');

/*
node-ffi数据类型
int8       Signed 8-bit Integer
uint8      Unsigned 8-bit Integer
int16      Signed 16-bit Integer
uint16     Unsigned 16-bit Integer
int32      Signed 32-bit Integer
uint32     Unsigned 32-bit Integer
int64      Signed 64-bit Integer
uint64     Unsigned 64-bit Integer
float      Single Precision Floating Point Number (float)
double     Double Precision Floating Point Number (double)
pointer     Pointer Type
string     Null-Terminated String (char *)

除了基本类型外，还有常见的C语言类型；
byte       unsigned char
char       char
uchar      unsigned char
short      short
ushort     unsigned short
int        int
uint       unsigned int
long       long
ulong      unsigned long
longlong    long
ulonglong   unsigned long long
size_t     platform-dependent, usually pointer size
*/

var mt_32 = ffi.Library(`${ __dirname.replace('app.asar', 'app.asar.unpacked') }/../lib/mt_32`, {
  "open_device": [ "int", [ "uchar", "ulong" ] ],
  "close_device": [ "int", [ "int" ] ],
  "get_version": [ "int16", [ "int", "string", "string" ] ],
  "rf_card": [ "int", [ "int", "uchar", "string" ]],
  "dev_beep": [ "int", [ "int", "uchar", "uchar", "uchar" ] ],
});

var rf_card = function(icdev, nMode) {
  var sSnr =  Buffer.alloc(4);
  var nMode = Buffer.alloc(1);
  mt_32.rf_card(icdev, nMode, sSnr);
  return sSnr;
};
exports.rf_card = rf_card;

/**
 * 打开读写器
 * icdev = open_device (0,9600)
 * @param  {} port 串口号,0 对应 COM1,1 对应 COM2……，取值范围 0~31
 * @param  {} baud 通讯波特率，9600bps（缺省设置），19200bps，38400bps，57600bps，115200bps
 */
var open_device = function(port, baud) {
  port = port == null ? 2 : port;
  baud = baud || 115200;
  var icdev = mt_32.open_device(port, baud);
  return icdev;
};
exports.open_device = open_device;

//关闭读写器
var close_device = function(icdev) {
  return mt_32.close_device(icdev);
};
exports.close_device = close_device;

//获取读写器版本信息
var get_version = function(icdev) {
  var verlen = Buffer.allocUnsafe(1);
  var verdata = Buffer.allocUnsafe(100);
  mt_32.get_version(icdev, verlen, verdata);
  return verdata.slice(0, verlen[0]).toString();
};
exports.get_version = get_version;

/**
 * 控制读写器蜂鸣器的单声鸣叫延迟时间和鸣叫次数
 * st=dev_beep( icdev,2,5,2);
 * @param  {number} icdev 通讯设备标识符
 * @param  {} nMsec 1 字节，一次鸣叫持续时间（单位时间 100ms）
 * @param  {} nMsec_end 1字节，一次鸣叫停止时间(多次蜂鸣时的间隔时间，单位时间100ms)
 * @param  {} nTime 1 字节，蜂鸣器鸣叫次数
 */
var dev_beep = function(icdev, nMsec, nMsec_end, nTime) {
  nMsec = nMsec || 1;
  nMsec_end = nMsec_end || 1;
  nTime = nTime || 1;
  mt_32.dev_beep(icdev, nMsec, nMsec_end, nTime);
};
exports.dev_beep = dev_beep;

var buf0 = Buffer.alloc(4);
exports.rf_cardCb = function(opt, callback) {
  if(typeof(opt) === "function") {
    callback = opt;
    opt = undefined;
  }
  var stop = false;
  var icdev = opt && opt.icdev;
  var prevSnr = "";
  var timeout = undefined;
  var tmpFn = async function () {
    while(true) {
      if(stop) break;
      await new Promise((resolve) => setTimeout(resolve, opt && opt.intv || 500));
      var snr = rf_card(icdev);
      if(snr.equals(buf0)) continue;
      if(prevSnr.equals(snr)) continue;
        prevSnr = snr;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          prevSnr = "";
        }, opt && opt.intv2 || 3000);
      if(!opt || opt.notBeep !== true) {
        dev_beep(icdev);
      }
      try {
        await callback(snr);
      } catch (err) {
        console.error(err);
      }
    }
  };
  tmpFn();
  var stopFn = function() {
    stop = true;
  };
  return stopFn;
}