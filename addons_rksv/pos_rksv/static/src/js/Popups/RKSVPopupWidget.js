odoo.define('pos_rksv.RKSVPopupWidget', function (require) {
    "use strict";

    const { useState, useRef } = owl.hooks;
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');

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
                title: arguments[1].title,
                exec_button_title: arguments[1].exec_button_title,
                kundeninfo: arguments[1].kundeninfo,
                authorized: false,
                loading: false,
                failure: false,
                success: false,
                body: arguments[1].body,
                execute: arguments[1].execute,
            });
            this.passwordRef = useRef('password');
        }
        mounted() {
            this.passwordRef.el.focus();
        }
        execute() {
            if (this.state.execute) {
                this.state.execute(this);
            }
        }
        close() {

        }
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
        check_passwd() {
            var self = this;
            var pos_admin_passwd = this.env.pos.config.pos_admin_passwd;
            var entered_passwd = $(this.passwordRef.el).val();
            if (pos_admin_passwd === entered_passwd) {
                this.state.authorized = true;
                /*
                this.$('.message').html("Authorized");
                this.$('.passwd_input').hide();
                this.$('.authorize_button').hide();
                this.$('.kundeninfo').off();
                if ((!this.options['kundeninfo_required']) || (!this.kundeninfo)) {
                    this.$('.execute_button').show();
                } else if (this.options['kundeninfo_required']) {
                    this.$('.execute_button').show();
                    this.$('.execute_button').addClass('disabled');
                    this.$('.kundeninfo').on('input', function () {
                        if (self.$('.kundeninfo').val() > '') {
                            self.$('.execute_button').removeClass('disabled');
                        } else {
                            self.$('.execute_button').addClass('disabled');
                        }
                    });
                }
                if (this.kundeninfo)
                    this.$('.kundeninfo_div').show();
                return true;
                 */
            } else {
                this.state.authorized = false;
                /*
                this.$('.pos_admin_passwd').removeAttr('value');
                this.$('.message').html("Password incorrect.");
                this.$('.kundeninfo_div').hide();
                return false;

                 */
            }
        }
    }

    RKSVPopupWidget.template = 'RKSVPopupWidget';
    RKSVPopupWidget.defaultProps = {
        title: 'Title',
        exec_button_title: 'Ausführen',
        kundeninfo: '',
    };

    Registries.Component.add(RKSVPopupWidget);

    return RKSVPopupWidget;
    //gui.define_popup({name:'rksv_popup_widget', widget: RKSVPopUpWidget});
});