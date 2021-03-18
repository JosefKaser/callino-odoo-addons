from odoo import api, fields, models
import base64


class PosOrder(models.Model):
    _inherit = 'pos.order'

    def _prepare_done_order_for_pos(self):
        self.ensure_one()
        order = super(PosOrder, self)._prepare_done_order_for_pos()
        order.update({
            'receipt_id': self.receipt_id,
            'qrcodevalue': self.qr_code_value,
            'cashbox_mode': self.cashbox_mode,
            'qr_code_image': 'data:image/gif;base64,%s' % self.qr_code_image.decode('utf-8'),
        })
        return order
