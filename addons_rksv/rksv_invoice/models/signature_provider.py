# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from datetime import datetime
import pytz
import logging
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class SignatureProvider(models.Model):
    _inherit = "signature.provider"

    box_id = fields.Many2one('rksv.box', string="Box")
    bmf_test_mode = fields.Boolean('BMF Test Mode', default=True)

    def fetch_bmf_status(self):
        for provider in self:
            pass

    def _get_signature_params(self):
        self.ensure_one()
        timezone = pytz.timezone("Europe/Vienna")
        d = datetime.now()
        d_aware = timezone.localize(d)
        journal = self.env['account.journal'].search([
            ('signature_provider_id', '=', self.id),
        ], limit=1)
        return {
            "test_mode": self.bmf_test_mode,
            "tid": self.company_id.bmf_tid,
            "benid": self.company_id.bmf_benid,
            "pin": self.company_id.bmf_pin,
            "pos_ts": d_aware.isoformat(),
            "serial": self.serial,
            "kassenidentifikationsnummer": journal.cashregisterid,
            "hersteller_atu": self.company_id.bmf_hersteller_atu,
        }

    def status_signatureinheit(self):
        for signature in self:
            box = signature.box_id
            params = signature._get_signature_params()
            result = box.query_box("/hw_proxy/status_signatureinheit", params)
            if result['success']:
                signature.update({
                    'bmf_message': result['status']['status'],
                    'bmf_last_status': result['status']['ts_status'],
                })
            _logger.info("Got Result: %s", result)
