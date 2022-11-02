odoo.define('pos_rksv_iot.devices', function (require) {
    "use strict";

    var RKSV = require('pos_rksv.rksv');
    var ProxyDevice = require('point_of_sale.devices').ProxyDevice;
    var rpc = require('web.rpc');
    var core = require('web.core');

    //var QWeb = core.qweb;
    var _t = core._t;

    ProxyDevice.include({
        // sorry - we have to complete overwrite this function
        status_loop: function () {
            var self = this;
            self._super();
            _.each(this.iot_boxes, function (iot_box) {
                self.connect(iot_box.ip_url);
                self.keepalive();
            });
            /*rpc.query({
                model: 'iot.device',
                method: 'search_read',
                fields: ['type'],
                domain: [['id', 'in', this.pos.config.iot_device_ids], ['connected', '=', true]],
            }).then(function (iot_devices) {
                if(iot_devices) {
                    self.set_connection_status('connected');
                }
            });*/
            /*_.each(this.iot_boxes, function (iot_box) {
                $.ajax({
                    url: iot_box.ip_url + '/hw_proxy/status_json_rksv',
                    type: "GET",
                    dataType: "jsonp",
                    contentType: "application/json",
                    timeout: 1000,
                    crossDomain: true,
                    processData: false,
                    cache: true,
                    data: JSON.stringify({
                        "rksv": {
                            "kassenidentifikationsnummer": self.pos.config.cashregisterid
                        }
                    })
                }).then(function (driver_status) {
                    self.set_connection_status('connected', driver_status);
                }).catch(function (err) {
                    self.set_connection_status('disconnected');
                });
            });*/
        },
    });
});