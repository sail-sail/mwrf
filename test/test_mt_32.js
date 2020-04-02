const mt_32 = require("../src/mt_32");

var icdev = mt_32.open_device(0, 115200);
console.log(icdev);
if(icdev === -21 || icdev === 0) {
  console.error("打开通信口失败");
  return;
}
// const { sSnr } = mt_32.rf_card(icdev);
// console.log(sSnr);

var stopFn = mt_32.rf_cardCb({ icdev, notBeep: true }, function(snr) {
  console.log(snr.toString("hex"));
});

// mt_32.close_device(icdev);