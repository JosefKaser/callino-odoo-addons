# -*- coding: utf-8 -*-

from odoo import fields, api, models


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    product_ref_text = fields.Char('Reference')

    def _export_for_ui(self, orderline):
        line = super(PosOrderLine, self)._export_for_ui(orderline)
        line['product_ref_text'] = orderline.product_ref_text
        return line
