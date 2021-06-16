# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    invoice_id = fields.Many2one('account.move', string='Invoice', readonly=True)

    @api.model
    def create(self, vals):
        line = super(PosOrderLine, self).create(vals)
        if 'invoice_id' in vals:
            line.order_id.write({
                'account_move': vals.get('invoice_id'),
            })
        return line

    def _export_for_ui(self, orderline):
        line = super(PosOrderLine, self)._export_for_ui(orderline)
        line['invoice_id'] = orderline.invoice_id.id if orderline.invoice_id else None
        return line
