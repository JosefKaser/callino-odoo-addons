# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.osv.expression import AND, OR
import logging

_logger = logging.getLogger(__name__)


class POSSession(models.Model):
    _name = 'pos.session'
    _inherit = 'pos.session'

    def _loader_params_res_company(self):
        params = super(POSSession, self)._loader_params_res_company()
        params['search_params']['fields'].extend(["bmf_tid", "bmf_benid", "bmf_pin", "bmf_hersteller_atu", "bmf_tax_number", "bmf_vat_number"])
        return params

    def _loader_params_product_product(self):
        params = super(POSSession, self)._loader_params_product_product()
        params['search_params']['domain'] = AND([params['search_params']['domain'], [('rksv_tax_mapping_correct', '=', True)]])
        return params

    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        if self.config_id.iface_rksv:
            new_model = 'signature.provider'
            if new_model not in result:
                result.append(new_model)
        return result

    def _loader_params_signature_provider(self):
        if len(self.config_id.available_signature_provider_ids) > 0:
            domain = [('id', 'in', self.config_id.available_signature_provider_ids.ids)]
        else:
            domain = []
        return {'search_params': {'domain': domain, 'fields': [], 'load': False}}

    def _get_pos_ui_signature_provider(self, params):
        providers = self.env['signature.provider'].search_read(**params['search_params'])
        return providers
