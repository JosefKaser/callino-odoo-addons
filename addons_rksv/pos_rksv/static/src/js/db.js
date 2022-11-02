odoo.define('pos_rksv.db', function (require) {
    "use strict";

    var PosDB = require("point_of_sale.DB");

    // This is still ok for odoo pos v14
    const RKSVPosDB = (PosDB) =>
        class extends PosDB {
        invisible_filtered(products) {
            if (products instanceof Array) {
                return _.filter(products, function (product) {
                    return !product['pos_product_invisible'];
                }, this);
            } else {
                if (products === undefined || products['pos_product_invisible'] === true) {
                    return undefined;
                } else {
                    return products;
                }
            }
        }
        // Filter out products which should be invisible
        get_product_by_category(category_id) {
            var products = this._super(category_id);
            return this.invisible_filtered(products);
        }
        search_product_in_category(category_id, query){
            var products = this._super(category_id, query);
            return this.invisible_filtered(products);
        }
        get_product_by_barcode(barcode){
            var products = this._super(barcode);
            return this.invisible_filtered(products);
        }
    };
});