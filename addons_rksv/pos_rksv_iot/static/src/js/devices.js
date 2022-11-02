odoo.define('pos_rksv_iot.devices', function (require) {
    "use strict";

    var RKSV = require('pos_rksv.rksv');
    var ProxyDevice = require('point_of_sale.devices').ProxyDevice;
    var rpc = require('web.rpc');
    var core = require('web.core');

    //var QWeb = core.qweb;
    var _t = core._t;

    ProxyDevice.include({
        status_loop: function () {
            var self = this;
            self._super();
            _.each(this.iot_boxes, function (iot_box) {
                if ((!iot_box.connected) && (iot_box.rksv_box)) {
                    self.connect(iot_box.ip_url);
                    self.keepalive();
                }
            });
        },
    });
});