odoo.define('pos_rksv.chrome', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var _t = core._t;

    chrome.Chrome.include({
        replace_widget: function(name, widget_config) {
            for (var i=0; i < this.widgets.length; i++) {
                if (this.widgets[i]['name'] == name) {
                    this.widgets[i] = widget_config;
                }
            }

        }
    });


    /*
    Lets extend the Debug Widget - so we can add our own functions here
     */

    // TODO
    /*
    var DebugWidget = chrome.DebugWidget.extend({
        start: function () {
            // Supercall using prototype
            this._super();
            if (!this.pos.config.iface_rksv) {
                this.disable_rksv();
            } else {
                this.install_rksv_eventhandler();
            }
        },
        disable_rksv: function() {
            this.$('.rksvdebug').hide();
        },
        install_rksv_eventhandler: function() {
            var self = this;
            // Now do register our own events
            this.$('.button.rksv_firstreport').click(function(){
                self.pos.rksv.fa_first_report();
            });
            this.$('.button.rksv_status').click(function(){
                self.pos.gui.show_screen('rksv_status', {
                    'stay_open': true,
                });
            });
            this.$('.button.rksv_kasse_registrieren').click(function(){
                self.pos.rksv.bmf_kasse_registrieren();
            });
            this.$('.button.bmf_status_rk').click(function(){
                self.pos.rksv.bmf_status_rk();
            });
            this.$('.button.bmf_register_start_receipt').click(function(){
                self.pos.rksv.bmf_register_start_receipt();
            });
            this.$('.button.rksv_reset_dep').click(function(){
                self.pos.rksv.rksv_reset_dep();
            });
            this.$('.button.rksv_export_dep_crypt').click(function(){
                self.pos.rksv.rksv_write_dep_crypt_container();
            });
            this.$('.button.rksv_reprint_start_receipt').click(function(){
                self.pos.rksv.rksv_reprint_special_receipt('start', 'Startbeleg');
            });
            this.$('.button.rksv_reprint_month_receipt').click(function(){
                self.pos.rksv.rksv_reprint_special_receipt('month', 'Monatsbeleg');
            });
            this.$('.button.rksv_reprint_year_receipt').click(function(){
                self.pos.rksv.rksv_reprint_special_receipt('year', 'Jahresbeleg');
            });
            this.$('.button.rksv_create_null_receipt').click(function(){
                self.pos.rksv.rksv_create_null_receipt();
            });
        }
    });
    chrome.Chrome.prototype.replace_widget('debug', {
        'name':   'debug',
        'widget': DebugWidget,
        'append':  '.pos-content'
    });
    */
     */
});

