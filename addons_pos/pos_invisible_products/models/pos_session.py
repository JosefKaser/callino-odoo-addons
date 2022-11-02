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
        params['search_params']['fields'].extend(
            ["pos_product_invisible"])
        return params
