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

var mt_32 = ffi.Library(`${__dirname}/../lib/mt_32`, {
  "device_open": [ "int", [ "string", "int16", "ulong" ] ],
  "device_version": [ "int16", [ "int", "byte", "string", "string" ] ],
  "rf_card": [ "int", [ "int", "ushort", "string", "string" ]]
});

var rf_card = function(icdev, delaytime) {
  var cardType = Buffer.allocUnsafe(1);
  var cardID =  Buffer.allocUnsafe(4);
  if(!delaytime) {
    delaytime = Buffer.allocUnsafe(2);
    delaytime[0] = 0x00;
    delaytime[1] = 0x00;
  }
  mt_32.rf_card(icdev, delaytime, cardType, cardID);
  return { cardType, cardID };
};
exports.rf_card = rf_card;

var device_open = function(name, port, baud) {
  return mt_32.device_open(name, port, baud);
};
exports.device_open = device_open;

var device_version = function(icdev) {
  var moduleStr = Buffer.allocUnsafe(1);
  moduleStr[0] = 0x01;
  var verlen = Buffer.allocUnsafe(1);
  var verdata = Buffer.allocUnsafe(100);
  mt_32.device_version(icdev, moduleStr, verlen, verdata);
  return { verlen, verdata };
};
exports.device_version = device_version;