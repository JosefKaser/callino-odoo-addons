odoo.define('pos_product_reference.models', function (require) {
    "use strict";

    var { Order, Orderline } = require('point_of_sale.models');
    const Registries = require('point_of_sale.Registries');

    const RKSVOrderline = (Orderline) => class PosSaleOrderline extends Orderline {
        constructor(obj, options) {
            super(...arguments);
            this.product_ref_text = '';
        }
        clone() {
            var data = super.clone(...arguments);
            data.product_ref_text = this.product_ref_text;
            return data;
        }
        set_product_reference(ref) {
            this.product_ref_text = ref;
            this.pos.env.posbus.trigger('change',this);
        }
        get_product_reference() {
            return this.product_ref_text;
        }
        export_as_JSON() {
            var data = super.export_as_JSON(...arguments);
            data.product_ref_text = this.get_product_reference();
            return data;
        }
        init_from_JSON(json) {
            super.init_from_JSON(...arguments);
            this.product_ref_text = json.product_ref_text;
        }
        export_for_printing() {
            var data = super.export_for_printing(...arguments);
            data.product_ref_text = this.get_product_reference();
            return data;
        }
    };

    Registries.Model.extend(Orderline, RKSVOrderline);

});