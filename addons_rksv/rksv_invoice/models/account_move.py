from odoo import api, fields, models


class AccountMove(models.Model):
    _inherit = 'account.move'

    def _get_rksv_payments(self):
        self.ensure_one()
        payments = []
        for partial, amount, counterpart_line in self._get_reconciled_invoices_partials():
            if counterpart_line.payment_id.receipt_id > 0:
                payments.append(counterpart_line.payment_id)
        return payments
