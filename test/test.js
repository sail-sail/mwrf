const mwrf = require("../src/mwrf32");

var icdev = mwrf.rf_init(0, 9600);
console.log("rf_init: " + icdev);
if(icdev === -0x20) {
  console.error("打开通信口失败");
  return;
}

// const status = mwrf.rf_get_status(icdev);
// console.log(status);

const snrBuf = mwrf.rf_card(icdev, 1);
console.log("rf_card: "+snrBuf.toString("hex"));

mwrf.rf_authentication(icdev, 0);

const data = mwrf.rf_read(icdev, 1);
console.log(data.toString("hex"));

mwrf.rf_exit(icdev);