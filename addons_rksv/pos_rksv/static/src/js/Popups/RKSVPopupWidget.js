odoo.define('pos_rksv.RKSVPopupWidget', function (require) {
    "use strict";
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
            // Display kundeninfo textarea or not
            //kundeninfo: false
        }
        // Do install default event handlers
        installEventHandler() {
            var self = this;
            // Install close button event handler
            this.$('.close_button').off();
            this.$('.close_button').on('click', function () {
                self.hide();
            });
            // Install event handler for authorize button
            this.$('.authorize_button').off();
            this.$('.authorize_button').on('click', function () {
                self.check_passwd();
            });
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
            var pos_admin_passwd = this.pos.config.pos_admin_passwd;
            var entered_passwd = this.$('.pos_admin_passwd').val();
            if (pos_admin_passwd === entered_passwd) {
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
            } else {
                this.$('.pos_admin_passwd').removeAttr('value');
                this.$('.message').html("Password incorrect.");
                this.$('.kundeninfo_div').hide();
                return false;
            }
        }
    }

    RKSVPopupWidget.template = 'RKSVOperationPopupWidget';

    Registries.Component.add(RKSVPopupWidget);

    return RKSVPopupWidget;
    //gui.define_popup({name:'rksv_popup_widget', widget: RKSVPopUpWidget});
});