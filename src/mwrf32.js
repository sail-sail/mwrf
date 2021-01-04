const ffi = require('ffi-napi');

//RF-EYE系列非接触式 IC 卡读写器 API 函数
const mwrf32 = ffi.Library(`${ __dirname.replace('app.asar', 'app.asar.unpacked') }/../lib/mwrf32`, {
  "rf_init": [ "int", [ "int", "int" ] ],
  "rf_get_status": [ "char", [ "int", "string" ] ],
  "rf_exit": [ "char", [ "int" ] ],
  "rf_card": [ "char", [ "int", "int", "string" ] ],
  "rf_authentication": [ "char", [ "int", "int", "int" ] ],
  "rf_read": [ "char", [ "int", "int", "string" ] ],
  "rf_beep": [ "int", [ "int", "uint32" ] ],
});

/**
 * 该函数用于建立读写器与 PC 机之间的连接，首先搜索无驱接口读写器，如果找到 设备，则建立连接并返回。
 * 如果没有发现无驱接口读写器，则用选定的与 PC 机通 讯的串口和波特率初始化读写器，这是操作读写器的第一步，这样可以获得通讯用 的设备描述符供以后使用。 
 * 参 数: port: 通讯口号(0～250) ，对于无驱设备该参数无效 
 *   Baud: baudrate 通讯波特率(9600～115200)，对于无驱设备该参数无效 
 * 返 回:
 *   ≥0: 成功则返回设备描述符(≥0) 
 *   <0: 失败 
 * 例:
 *   int icdev;
 *   icdev=rf_init(1,115200);// 波特率:115200,端口:com2 
 */
exports.rf_init = function(port, baudrate) {
  const icdev = mwrf32.rf_init(port, baudrate);
  return icdev;
};

/**
 * 功 能: 获取读写器的版本号。
 * 参 数: 
 *   icdev: rf_init()返回的设备描述符
 *   _Status: 返回读写器版本信息，长度为18字节
 * 返 回:
 *   =0: 成功
 *   <>0: 失败
 * 例:
 *   int st;
 *   unsigned char status[19];
 *   st=rf_get_status(icdev,status); 
 */
exports.rf_get_status = function(icdev) {
  const statusBuf = Buffer.alloc(18);
  const st = mwrf32.rf_get_status(icdev, statusBuf);
  if(st !== 0) throw `rf_get_status: st=${st}`;
  return statusBuf.toString();
};

/**
 * 功 能:  断开 PC 机与读写器之间的连接，并释放相关设备描述符。
 * 参 数: icdev:  rf_init()返回的设备描述符
 * 返 回: 
 *   =  0:   成功
 *   <>0: 失败
 * 例: int  st; st=rf_exit(icdev); 
 */
exports.rf_exit = function(icdev) {
  const st = mwrf32.rf_exit(icdev);
  if(st !== 0) throw `rf_exit: st=${st}`;
  return st;
};

/**
 * 功 能:   寻卡并返回卡片的系列号，它可以完成低级函数 rf_request, rf_anticoll 和 rf_select 的功能。
 * 参 数:  
 *   icdev: rf_init()返回的设备描述符
 *   Mode: 寻卡模式 0: IDLE  模式，一次只操作一张卡 1: ALL 模式，一次可操作多张卡
 *   Snr: 返回卡片的系列号 
 * 返 回:
 *   =0 : 成功
 *   <>0 : 失败 
 * 例: 
 *   int st; unsigned char Mode=0;
 *   IDLE mode unsigned long snr;
 *   st=rf_card(icdev,Mode,&snr);
 * 注：
 *   rf_card()是三个低级函数的组合:rf_request(),rf_select() 和 rf_anticoll()。
 *   注 意：选用 IDLE 模式寻卡时，完成对卡片的操作后调用 rf_halt 函数来停止操作， 此 后读写器不能找到卡片，除非 卡片离开操作区域并再次重新进入。
 *   选用 ALL 模式寻卡时，完成对卡片的操作后调用 rf_halt 函数来停止操作， 此后读写器仍能找 到该卡片，无须离开操作区域并再次重新进入。 
 * 
 */
exports.rf_card = function(icdev, mode) {
  const snrBuf = Buffer.alloc(4);
  const st = mwrf32.rf_card(icdev, mode, snrBuf);
  if(st !== 0) throw `卡不存在!`;
  return snrBuf;
};

/**
 * 功 能:
 *   验证读写器中的密码与需要访问的卡片的同一扇区(0~15)的密码是否一 致。
 *   如果 读写器中选择的密码（可用 rf_load_key  函数修改）与卡片 的相匹配，密码验证 通过，传输的数据将用以下的命令加密。 
 * 参 数:
 *   icdev: rf_init()返回的设备描述符
 *   _Mode: 验证密码类型：
 *     0 —  用 KEY A 验证
 *     4 —  用 KEY B 验证
 *   SecNr: 将要访问的卡片扇区号(0~15)
 * 返 回:
 *   = 0: 成功 
 *   <> 0: 失败
 * 例：
 *   int st; //authentication the 5th sector whit th
 *   st=rf_authentication(icdev,0,5); 
 */
exports.rf_authentication = function(icdev, mode, sector) {
  const st = mwrf32.rf_authentication(icdev, mode, sector);
  if(st !== 0) throw `扇区密码验证错误!`;
};

/**
 * 功 能:
 *   从一张选定并通过密码验证的卡片读取一块共16个字节的数据。
 *   参 数:
 *     icdev: rf_init()返回的设备描述符
 *     _Adr: 读取数据的块号(0~63)
 *     _Data:读取的数据， PC 机上 RAM 的地址空间由调用该函数来分配。
 * 返 回:
 *   = 0: 成功
 *   <>0: 失败
 * 例:
 *   int st;
 *   unsigned char data[16];
 *   st=rf_read(icdev,1,data);
 */
exports.rf_read = function(icdev, adr) {
  const dataBuf = Buffer.alloc(16);
  const st = mwrf32.rf_read(icdev, adr, dataBuf);
  if(st !== 0) throw `读取卡号失败!`;
  return dataBuf;
};

/**
 * 蜂鸣
 * @param  {} icdev 通讯设备标识符
 * @param  {} _Msec 蜂鸣时间，单位是10毫秒
 */
exports.rf_beep = function(icdev, _Msec) {
  mwrf32.rf_beep(icdev, _Msec);
};