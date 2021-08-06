# -*- coding: utf-8 -*-
from odoo import models, fields, api, _


class signature_provider(models.Model):
    _inherit = "signature.provider"

    pos_config_id = fields.Many2one(
        comodel_name='pos.config',
        string='Point of Sale'
    )

    @api.model
    def set_providers(self, providers, pos_config_id):
        for provider in providers:
            existing_provider = self.env['signature.provider'].search([('public_key', '=', provider['cin'])])
            vals = {
                'public_key': provider['cin'],
                'reader': provider['reader'],
                'subject': provider['subject'],
                'serial': provider['serial'],
                'valid_from': provider['valid_from'],
                'valid_until': provider['valid_until'],
                'x509': provider['x509'],
                'name': provider['cin'],
                'pos_config_id': pos_config_id['pos_config_id'],
            }
            if existing_provider:
                existing_provider.write(vals)
            else:
                self.env['signature.provider'].create(vals)

    @api.model
    def update_status(self, signaturedata):
        signature = self.search([('serial', '=', signaturedata['serial'])], limit=1)
        vals = {}
        vals['bmf_last_status'] = signaturedata['bmf_last_status'] if 'bmf_last_status' in signaturedata else 'UNBEKANNT'
        vals['bmf_last_update'] = signaturedata['bmf_last_update'] if 'bmf_last_update' in signaturedata else None
        vals['bmf_message'] = signaturedata['bmf_message'] if 'bmf_message' in signaturedata else ''
        signature.write(vals)
        return True
