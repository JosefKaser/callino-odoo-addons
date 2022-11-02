odoo.define('pos_rksv.RKSVPopupWidget', function (require) {
    "use strict";

    const { useState } = owl;
    const { useListener } = require("@web/core/utils/hooks");
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    const { useRef } = owl;

    /*
    RKSV Generic Popup Widget
    - does provide POS Admin Password Handling
    - does provide a customer info input box
    - configureable buttons
     */
    class RKSVPopupWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({
                title: arguments[0].title,
                exec_button_title: arguments[0].exec_button_title,
                kundeninfo: arguments[0].kundeninfo,
                kundeninfo_title: arguments[0].kundeninfo_title,
                authorized: false,
                execute_available: false,
                loading: false,
                failure: false,
                success: false,
                body: arguments[0].body,
                execute: arguments[0].execute,
            });
            this.passwordRef = useRef('password');
            this.kundeninfo = useRef('kundeninfo');
        }
        mounted() {
            this.passwordRef.el.focus();
        }
        execute() {
            if (this.state.execute) {
                this.state.execute_available = false;
                this.state.execute(this);
            }
        }
        /*
        show(show_options, title, exec_button_title, kundeninfo) {
            this.kundeninfo = kundeninfo;
            this._super(show_options);
            // Do set default values
            this.$('.title').html(title);
            this.$('.execute_button').html(exec_button_title ? exec_button_title : 'Ausführen');
            this.$('.kundeninfo').val('');
            this.$('.execute_button').hide();
            this.$('.close_button').show();
            if (show_options['kundeninfo_title']) {
                this.$('.kundeninfo_title').html(show_options['kundeninfo_title']);
            }
            this.installEventHandler();
        }
        hide() {
            if (this.$el) {
                this.$el.addClass('oe_hidden');
            }
            this.$('.content').removeClass('oe_hidden');
            this.$('.loading').addClass('oe_hidden');
            this.$('.message').html("");
            this.$('.passwd_input').show();
            this.$('.authorize_button').show();
            this.$('.execute_button').hide();
            this.$('.pos_admin_passwd').val('');
        }
        loading(message) {
            this.$('.execute_button').hide();
            this.$('.content').addClass('oe_hidden');
            this.$('.loading').removeClass('oe_hidden');
            this.$('.loading').html(message);
        }
        loading_done() {
            this.$('.content').removeClass('oe_hidden');
            this.$('.loading').addClass('oe_hidden');
            this.$('.kundeninfo_div').hide();
        }
        success(message) {
            this.loading_done();
            this.$('.message').html(message);
        }
        failure(message) {
            this.loading_done();
            this.$('.message').html('<p style="color: red;">' + message + '</p>');
        }
         */
        check_passwd() {
            var pos_admin_passwd = this.env.pos.config.pos_admin_passwd;
            var entered_passwd = $(this.passwordRef.el).val();
            if (pos_admin_passwd === entered_passwd) {
                this.state.authorized = true;
                this.state.execute_available = true;
            } else {
                this.state.authorized = false;
            }
        }
    }

    RKSVPopupWidget.template = 'RKSVPopupWidget';
    /*RKSVPopupWidget.defaultProps = {
        title: 'Title',
        exec_button_title: 'Ausführen',
        kundeninfo: '',
    };*/

    Registries.Component.add(RKSVPopupWidget);

    return RKSVPopupWidget;
});