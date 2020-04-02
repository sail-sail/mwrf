const mwrf = require("../src/mwrf32");
// const mt_32 = require("../src/mt_32");
var str = mwrf.lib_ver();
console.log(str);

// mwrf.rf_beep(icdev, 10);
// var rfVersion = mwrf.rf_get_status(icdev);
// console.log(rfVersion);
// var stopFn = mwrf.rf_anticollCb({ icdev }, function(snc) {
//   console.log(snc);
// });
// setTimeout(function() {
//   stopFn();
// }, 10000);

var icdev = mwrf.Open_USB();
console.log(icdev);
if(icdev === -0x20) {
  console.error("打开通信口失败");
  return;
}


var stopFn = mwrf.rf_cardCb({ icdev }, function(snr) {
  console.log(snr.toString("hex"));
});

// var icdev = mt_32.device_open("USB", 0, 9600);
// console.log(icdev);
// var verObj = mt_32.device_version(icdev);
// console.log(verObj);

