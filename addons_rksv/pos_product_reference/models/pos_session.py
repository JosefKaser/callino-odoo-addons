# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.osv.expression import AND, OR
import logging

_logger = logging.getLogger(__name__)


class POSSession(models.Model):
    _name = 'pos.session'
    _inherit = 'pos.session'

    def _loader_params_product_product(self):
        params = super(POSSession, self)._loader_params_product_product()
        params['search_params']['domain'] = AND([params['search_params']['domain'], [('rksv_tax_mapping_correct', '=', True)]])
        params['search_params']['fields'].extend(
            ["product_ref", "product_ref_textarea"])
        return params
