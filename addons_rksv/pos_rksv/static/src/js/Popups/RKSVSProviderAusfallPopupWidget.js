odoo.define('pos_rksv.RKSVSProviderAusfallPopupWidget', function (require) {
    "use strict";

    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RKSVSProviderAusfallPopupWidget extends RKSVPopupWidget {
        // Extend show function to also hide the begruendung division on show
        show(show_options, title, exec_button_title, kundeninfo) {
            this._super(show_options, title, exec_button_title, kundeninfo);
            this.$('.begruendung_div').hide();
        }
        // Extend password check - on correct password do display begruendung_div
        check_passwd() {
            var password_ok = this._super();
            if (password_ok) {
                this.$('.begruendung_div').show();
            } else {
                this.$('.begruendung_div').hide();
            }
            return password_ok;
        }
        // Do extend loading done to also hide the begruendung_div
        loading_done() {
            this._super();
            this.$('.begruendung_div').hide();
        }
    }
    RKSVSProviderAusfallPopupWidget.template = 'RKSVSProviderAusfallPopupWidget';
    Registries.Component.add(RKSVSProviderAusfallPopupWidget);

    return RKSVSProviderAusfallPopupWidget;

    //gui.define_popup({name:'rksv_sprovider_ausfall_popup', widget: RKSVSProviderAusfallPopupWidget});
});