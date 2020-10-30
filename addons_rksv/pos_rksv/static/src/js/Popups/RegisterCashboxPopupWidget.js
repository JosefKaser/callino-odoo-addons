odoo.define('pos_rksv.RegisterCashboxPopupWidget', function (require) {
    "use strict";

    const RKSVPopupWidget = require('pos_rksv.RKSVPopupWidget');
    const Registries = require('point_of_sale.Registries');

    class RegisterCashboxPopupWidget extends RKSVPopupWidget {
        show(show_options, title, exec_button_title, kundeninfo){
            this._super(show_options, title, exec_button_title, kundeninfo);
            // Hide the additional data fields per default
            this.$('.startreceipt_div').hide();
        }
        check_passwd() {
            var valid = this._super();
            if (valid) {
                // Show the additional data fields on valid password
                this.$('.startreceipt_div').show();
            }
        }
        loading(message) {
            this._super(message);
            this.$('.startreceipt_div').hide();
        }
    }
    RegisterCashboxPopupWidget.template = 'RegisterCashboxPopupWidget';
    Registries.Component.add(RegisterCashboxPopupWidget);

    return RegisterCashboxPopupWidget;

    //gui.define_popup({name:'rksv_register_cashbox_widget', widget: RegisterCashboxPopupWidget});
});