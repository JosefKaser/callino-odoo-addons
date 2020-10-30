odoo.define('pos_product_reference.Orderline', function (require) {
    "use strict";

    var Orderline = require('point_of_sale.Orderline');
    const Registries = require('point_of_sale.Registries');


    const ProductRefOrderline = (Orderline) =>
        class extends Orderline {
            captureProductRefChange(event) {
                this.props.line.set_product_reference(event.target.value);
            }
        };

    Registries.Component.extend(Orderline, ProductRefOrderline);

    return Orderline;
});