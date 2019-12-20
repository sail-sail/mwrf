const mwrf32 = require("../src/mwrf32");
var str = mwrf32.lib_ver();
console.log(str);
var icdev = mwrf32.Open_USB();
// mwrf32.rf_beep(icdev, 10);
var rfVersion = mwrf32.rf_get_status(icdev);
console.log(rfVersion);

