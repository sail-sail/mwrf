const mwrf = require("../src/mwrf32");
var str = mwrf.lib_ver();
console.log(str);

// mwrf.rf_beep(icdev, 10);
// var rfVersion = mwrf.rf_get_status(icdev);
// console.log(rfVersion);

var icdev = mwrf.Open_USB();
var stopFn = mwrf.rf_anticollCb({ icdev }, function(snc) {
  console.log(snc);
});
// setTimeout(function() {
//   stopFn();
// }, 10000);
