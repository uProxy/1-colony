/* globals cordova, window, Promise */

window.vpn = {};

window.vpn._genericHandler = function(method, params) {
  "use strict";
  var args = Array.prototype.slice.call(arguments, 1);
  return new Promise(function(resolve, reject) {
    cordova.exec(resolve, reject, "OpenVPN", method, args);
  });
};

window.vpn.startVPN = window.vpn._genericHandler.bind({}, "startVPN");
window.vpn.stopVPN = window.vpn._genericHandler.bind({}, "stopVPN");
