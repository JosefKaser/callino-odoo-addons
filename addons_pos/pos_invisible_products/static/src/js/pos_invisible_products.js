odoo.define('pos_invisible_products.db', function (require) {
    "use strict";

    var PosDB = require("point_of_sale.DB");

    PosDB.include({
        invisible_filtered: function(products) {
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
        },
        // Filter out products which should be invisible
        get_product_by_category: function(category_id) {
            var product_ids  = this.product_by_category_id[category_id];
            var list = [];
            if (product_ids) {
                for (var i = 0, len = Math.min(product_ids.length, this.limit); i < len; i++) {
                    const product = this.product_by_id[product_ids[i]];
                    if (!(product.active && product.available_in_pos && !product.pos_product_invisible)) continue;
                    list.push(product);
                }
            }
            return list;
         },
        search_product_in_category: function(category_id, query){
            return this.invisible_filtered(this._super(category_id, query));
        },
        get_product_by_barcode: function(barcode){
            return this.invisible_filtered(this._super(barcode));
        }
    });
});