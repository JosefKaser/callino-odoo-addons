odoo.define('pos_product_reference.models', function (require) {
    "use strict";

    var models = require('point_of_sale.models');

    /*
      Here we do add the fields and the models we need to load from the server
    */
    models.load_fields("product.product", ["product_ref", "product_ref_textarea"]);

    var OrderlineSuper = models.Orderline;
    models.Orderline = models.Orderline.extend({
        initialize: function (attr, options) {
            this.product_ref_text = '';
            // Supercall must be after the var init step - because it does load the values from json
            OrderlineSuper.prototype.initialize.call(this, attr, options);
        },
        clone: function () {
            var data = OrderlineSuper.prototype.clone.call(this);
            data.product_ref_text = this.product_ref_text;
            return data;
        },
        set_product_reference: function (ref) {
            this.product_ref_text = ref;
            this.trigger('change',this);
        },
        get_product_reference: function () {
            return this.product_ref_text;
        },
        export_as_JSON: function () {
            var data = OrderlineSuper.prototype.export_as_JSON.call(this);
            data.product_ref_text = this.get_product_reference();
            return data;
        },
        init_from_JSON: function(json) {
            OrderlineSuper.prototype.init_from_JSON.call(this, json);
            this.product_ref_text = json.product_ref_text;
        },
        export_for_printing: function () {
            var data = OrderlineSuper.prototype.export_for_printing.call(this);
            data.product_ref_text = this.get_product_reference();
            return data;
        }
    });

});