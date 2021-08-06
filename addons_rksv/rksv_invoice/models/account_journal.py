# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
import uuid
from datetime import datetime
import pytz
import logging
from odoo.exceptions import UserError
import base64

_logger = logging.getLogger(__name__)


class AccountJournal(models.Model):
    _inherit = 'account.journal'

    @api.multi
    def _calc_cashregisterid(self):
        for config in self:
            if not config.cashregisterid or config.cashregisterid == '':
                config.cashregisterid = uuid.uuid1()

    cashregisterid = fields.Char(
        string='KassenID', size=36,
        compute='_calc_cashregisterid',
        store=True, readonly=True,
        copy=False
    )
    signature_provider_id = fields.Many2one(
        comodel_name='signature.provider',
        string='Signature Provider',
    )
    posbox_registered = fields.Boolean(string='Bei PosBox angemeldet', readonly=True, default=False)
    bmf_gemeldet = fields.Boolean(string='Registrierkasse beim BMF angemeldet', readonly=True)
    rksv_status_text = fields.Char(string="RKSV Status")
    rksv_at = fields.Boolean('RKSV AT', related='company_id.rksv_at', store=True)
    rksv_state = fields.Selection([
        ('new', 'Neu'),
        ('posbox_registered', 'An PosBox angemeldet'),
        ('bmf_registered', 'Beim BMF angemeldet'),
        ('ready', 'Bereit'),
        ('error', 'Fehler'),
    ], default='new', string="RKSV Status")
    bmf_test_mode = fields.Boolean(
        string='BMF Test Modus',
        default=True
    )
    _sql_constraints = [('cashregisterid_unique', 'unique(cashregisterid)', 'Cashregister ID must be unique.')]

    def _get_cashregister_params(self):
        self.ensure_one()
        timezone = pytz.timezone("Europe/Vienna")
        d = datetime.now()
        d_aware = timezone.localize(d)
        return {
            "test_mode": self.bmf_test_mode,
            "tid": self.company_id.bmf_tid,
            "benid": self.company_id.bmf_benid,
            "pin": self.company_id.bmf_pin,
            "pos_ts": d_aware.isoformat(),
            "kassenidentifikationsnummer": self.cashregisterid,
            "atu": self.company_id.vat,
            "hersteller_atu": self.company_id.bmf_hersteller_atu,
        }

    def update_rksv_status(self):
        for journal in self.filtered(lambda j: j.rksv_at):
            box = journal.signature_provider_id.box_id
            status = box.query_box("/hw_proxy/status_kasse", self._get_cashregister_params())
            journal.rksv_status_text = status['message']
            if not status['success']:
                journal.update({
                    'posbox_registered': False,
                    'bmf_gemeldet': False,
                    'rksv_state': 'error',
                })

    def create_rksv_on_posbox(self):
        for journal in self.filtered(lambda j: j.rksv_at and not j.posbox_registered):
            box = journal.signature_provider_id.box_id
            if not journal.cashregisterid:
                journal._calc_cashregisterid()
            result = box.query_box("/hw_proxy/register_cashbox", {
                "kassenidentifikationsnummer": journal.cashregisterid,
                "atu": journal.company_id.vat,
                "name": journal.name,
                "start_nr": "1"
            })
            _logger.info("Got Register Cashbox on PosBox Result: %s", result)
            if result['success'] or (not result['success'] and result['message'] == 'KassenID bereits gemeldet !'):
                journal.update({
                    'posbox_registered': True,
                    'rksv_state': 'posbox_registered',
                })

    def register_cashbox_bmf(self):
        for journal in self.filtered(lambda j: j.rksv_at and not j.bmf_gemeldet):
            box = journal.signature_provider_id.box_id
            params = self._get_cashregister_params()
            params.update({
                'name': self.name,
            })
            result = box.query_box("/hw_proxy/rksv_kasse_registrieren", params)
            _logger.info("Got Register Cashbox on BMF Result: %s", result)
            if result['success'] or (not result['success'] and result['message'] == 'BMF: BMF Fehler: (B1) Die Registrierkasse mit der angegebenen Kassenidentifikationsnummer ist bereits registriert.'):
                journal.update({
                    'bmf_gemeldet': True,
                    'posbox_registered': True,
                    'rksv_state': 'bmf_registered',
                })

    def _get_base_order_params(self):
        self.ensure_one()
        return {
            "uid": "1",
            "date": {
                "isostring": datetime.now().isoformat(),
            },
            "kassenidentifikationsnummer": self.cashregisterid,
        }

    def set_sprovider_posbox(self):
        for journal in self.filtered(lambda j: j.rksv_at and j.bmf_gemeldet):
            box = journal.signature_provider_id.box_id
            params = self._get_base_order_params()
            params.update({
                "null_receipt": True,
                "set_serial": journal.signature_provider_id.serial,
            })
            result = box.query_box("/hw_proxy/rksv_order", params)
            if not result['success']:
                journal.rksv_status_text = result['message']

    def delete_start_receipt(self):
        for journal in self.filtered(lambda j: j.rksv_at and j.bmf_gemeldet):
            box = journal.signature_provider_id.box_id
            params = self._get_cashregister_params()
            result = box.query_box("/hw_proxy/delete_start_receipt", params)
            if not result['success']:
                journal.rksv_status_text = result['message']

    def rksv_write_dep_crypt_container(self):
        for journal in self.filtered(lambda j: j.rksv_at and j.bmf_gemeldet):
            box = journal.signature_provider_id.box_id
            params = self._get_cashregister_params()
            result = box.query_box("/hw_proxy/rksv_write_dep_crypt_container", params)
            if not result['success']:
                journal.rksv_status_text = result['message']

    def cron_check_status(self):
        self.search([
            ('type', '=', 'cash'),
            ('rksv_at', '=', True),
        ]).check_status()

    def check_status(self):
        for journal in self.filtered(lambda j: j.rksv_at and j.bmf_gemeldet):
            box = journal.signature_provider_id.box_id
            params = {
                "rksv": {
                    "kassenidentifikationsnummer": journal.cashregisterid,
                }
            }
            result = box.query_box("/hw_proxy/status_json_rksv", params)
            _logger.info("Got Status for cashregister: %s", result)
            if result['rksv']['start_receipt_needed']:
                params = self._get_base_order_params()
                params.update({
                    "start_receipt": True,
                })
                result = box.query_box("/hw_proxy/rksv_order", params)
                _logger.info("Got Result on create start receipt: %s", result)
                if result['success']:
                    # Validate start receipt
                    params = self._get_cashregister_params()
                    result = box.query_box("/hw_proxy/rksv_startbeleg_registrieren", params)
                    _logger.info("Got Result on register start receipt: %s", result)
                    if result['success']:
                        journal.update({
                            'bmf_gemeldet': True,
                            'posbox_registered': True,
                            'rksv_state': 'ready',
                        })
                    else:
                        journal.update({
                            'rksv_status_text': result['message'],
                            'rksv_state': 'error',
                        })
                else:
                    journal.update({
                        'rksv_status_text': result['message'],
                        'rksv_state': 'error',
                    })
            elif not result['rksv']['has_valid_start_receipt']:
                # Start receipt does exists - but is not validated yet
                params = self._get_cashregister_params()
                result = box.query_box("/hw_proxy/rksv_startbeleg_registrieren", params)
                _logger.info("Got Result on register start receipt: %s", result)
                if not result['success'] and journal.bmf_test_mode:
                    # Force valid in test mode...
                    params = {
                        "kassenidentifikationsnummer": journal.cashregisterid,
                    }
                    result = box.query_box("/hw_proxy/valid_start_receipt", params)
                    if result['success']:
                        journal.update({
                            'bmf_gemeldet': True,
                            'posbox_registered': True,
                            'rksv_state': 'ready',
                        })
                elif not result['success']:
                    journal.update({
                        'rksv_status_text': result['message'],
                        'rksv_state': 'error',
                    })
                elif result['success']:
                    journal.update({
                        'bmf_gemeldet': True,
                        'posbox_registered': True,
                        'rksv_state': 'ready',
                    })
            elif result['rksv']['year_receipt_needed']:
                params = self._get_base_order_params()
                params.update({
                    "year_receipt": True,
                })
                result = box.query_box("/hw_proxy/rksv_order", params)
                _logger.info("Got Result on create year receipt: %s", result)
                if not result['success']:
                    journal.update({
                        'rksv_status_text': result['message'],
                        'rksv_state': 'error',
                    })
                else:
                    params = self._get_cashregister_params()
                    params.update({
                        'belegnr': result['receipt_id']
                    })
                    result = box.query_box("/hw_proxy/beleg_pruefung", params)
                    if not result['success']:
                        journal.update({
                            'rksv_status_text': result['message'],
                            'rksv_state': 'error',
                        })
            elif result['rksv']['month_receipt_needed']:
                params = self._get_base_order_params()
                params.update({
                    "month_receipt": True,
                })
                result = box.query_box("/hw_proxy/rksv_order", params)
                _logger.info("Got Result on create month receipt: %s", result)
                if not result['success']:
                    journal.update({
                        'rksv_status_text': result['message'],
                        'rksv_state': 'error',
                    })
                else:
                    params = self._get_cashregister_params()
                    params.update({
                        'belegnr': result['receipt_id']
                    })
                    result = box.query_box("/hw_proxy/beleg_pruefung", params)
                    if not result['success']:
                        journal.update({
                            'rksv_status_text': result['message'],
                            'rksv_state': 'error',
                        })
            elif result['rksv']['cashbox_mode'] == 'active':
                journal.update({
                    'rksv_status_text': 'Alles in Ordnung',
                    'rksv_state': 'ready',
                })

    def register_payment(self, payment):
        self.ensure_one()
        if self.rksv_at and self.rksv_state == 'ready':
            params = self._get_base_order_params()
            params.update({
                "ref": payment.name,
                "orderlines": [{
                    "rksv_product_type": "product",
                    "taxes": [{
                        "rksv_tax": True,
                        "rksv_tax_category": "taxSetNull"
                    }],
                    "price_with_tax": payment.amount
                }],
                "total_with_tax": payment.amount,
            })
            box = self.signature_provider_id.box_id
            result = box.query_box("/hw_proxy/rksv_order", params)
            _logger.info("Got Result on create receipt: %s", result)
            if not result['success']:
                self.update({
                    'rksv_status_text': result['message'],
                    'rksv_state': 'error',
                })
            else:
                del result['success']
                map = {
                    'qrcodeValue': 'qr_code_value',
                    'qrcodeImage': 'qr_code_image',
                    'ocrcodeValue': 'ocr_code_value',
                }
                for key in map.keys():
                    result[map[key]] = result[key]
                    del result[key]
                serial = int(result['signatureSerial'], 16)
                provider = self.env['signature.provider'].search([
                    ('serial', '=', serial),
                ], limit=1)
                result['provider_id'] = provider.id
                result['qr_code_image'] = result['qr_code_image'][22:]
                self.signature_provider_id = provider.id
                return result
