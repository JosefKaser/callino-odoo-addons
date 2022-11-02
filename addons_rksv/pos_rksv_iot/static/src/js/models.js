odoo.define('pos_rksv_iot.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    models.load_fields("iot.box", "rksv_box");
});