# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.addons.point_of_sale.models.pos_config import PosConfig
from odoo.exceptions import UserError
import pytz
from datetime import datetime
import base64
import logging
import uuid
try:
    import simplejson as json
except ImportError:
    import json

_logger = logging.getLogger(__name__)


# We have to overwrite the original function with an monkey patch here
def _check_modules_to_install(self):
    # determine modules to install
    expected = [
        fname[7:]           # 'module_account' -> 'account'
        for fname in self.fields_get_keys()
        if fname.startswith('module_')
        if any(pos_config[fname] for pos_config in self)
    ]
    if 'pos_iot' in expected:
        # Do not auto install the pos_iot module
        expected.remove('pos_iot')
    if expected:
        STATES = ('installed', 'to install', 'to upgrade')
        modules = self.env['ir.module.module'].sudo().search([('name', 'in', expected)])
        modules = modules.filtered(lambda module: module.state not in STATES)
        if modules:
            modules.button_immediate_install()
            # just in case we want to do something if we install a module. (like a refresh ...)
            return True
    return False

# We have to monkey patch this here to allow the write for bmf_gemeldet and state
def pos_config_write(self, vals):
    if 'bmf_gemeldet' in vals or 'state' in vals or 'signature_provider_id' in vals or 'cashbox_mode' in vals or len(vals) == 0:
        return super(PosConfig, self).write(vals)
    opened_session = self.mapped('session_ids').filtered(lambda s: s.state != 'closed')
    if opened_session:
        raise UserError(_('Unable to modify this PoS Configuration because there is an open PoS Session based on it.'))
    result = super(PosConfig, self).write(vals)

    self.sudo()._set_fiscal_position()
    self.sudo()._check_modules_to_install()
    self.sudo()._check_groups_implied()
    return result

PosConfig.write = pos_config_write
PosConfig._check_modules_to_install = _check_modules_to_install


class POSConfig(models.Model):
    _inherit = 'pos.config'

    def action_dep_export(self):
        if not self.env.user._is_superuser():
            raise UserError('This feature is not yet available for everyone. Please contact your Odoo superadmin to fulfill this task.')
            return
        for config in self:
            DEP_EXPORT = {
                'Belege-Gruppe': []
            }
            receipts_all = config.mapped('session_ids').mapped('order_ids')
            receipts = receipts_all.filtered(lambda r: r.signedJWSCompactRep).sorted(key=lambda r: r.receipt_id)
            _logger.warning('There are %s receipts which are not signed or out of bounce', len(receipts_all) - len(receipts))

            sorted_receipts = {}
            last_id = False
            for receipt in receipts:
                if last_id and receipt.receipt_id != (last_id + 1):
                    _logger.warning('There is a receipt missing with receipt id %s', (last_id + 1))
                signature = self.env['signature.provider'].search([
                    ('serial', '=', int(receipt.signatureSerial, 16))
                ])
                last_id = receipt.receipt_id

                if signature not in sorted_receipts:
                    sorted_receipts[signature] = []
                sorted_receipts[signature].append(receipt.signedJWSCompactRep)

            public_key = ''
            provider_keys = []
            for signature, receipts_compact in sorted_receipts.items():
                DEP_EXPORT['Belege-Gruppe'].append({
                    'Signaturzertifikat': public_key,
                    'Zertifizierungsstellen': provider_keys,
                    'Belege-Kompakt': receipts_compact,
                })

            utc_now = datetime.now()
            datas = base64.encodestring(json.dumps(DEP_EXPORT, ensure_ascii=False).encode('utf-8'))
            datas_fname = '%s_%s_DEP_EXPORT.dep' % (utc_now.strftime('%Y-%m-%d'), config.cashregisterid)

            # Attachment for Report
            attach_vals = {
                'name': datas_fname,
                'datas': datas,
                'type': 'binary',
                'datas_fname': datas_fname,
                'res_model': self._name,
                'res_id': self.id,
            }

            attachments = config.env['ir.attachment'].with_context(
                default_msg='',
                default_datas=datas,
                default_datas_fname=datas_fname
            ).search([
                ('res_model', '=', config._name),
                ('res_id', '=', config.id)
            ])
            if attachments:
                attachments.write(attach_vals)
            else:
                attachments.create(attach_vals)

    def open_ui(self):
        for config in self:
            if not self.iface_rksv:
                # Do not check for rksv products if rksv is not activated for this pos.config
                continue
            if not (
                config.start_product_id.rksv_tax_mapping_correct and
                config.year_product_id.rksv_tax_mapping_correct and
                config.month_product_id.rksv_tax_mapping_correct and
                config.null_product_id.rksv_tax_mapping_correct and
                config.invoice_product_id.rksv_tax_mapping_correct
            ):
                raise UserError("All configuration products must be correctly configured before opening a PoS Session!")
        return super(POSConfig, self).open_ui()

    def _calc_cashregisterid(self):
        for config in self:
            _logger.info('do generate new uuid1 based uuid')
            if not config.cashregisterid or config.cashregisterid == '':
                config.cashregisterid = uuid.uuid1()

    def sync_jws(self, jws_sync):
        self.ensure_one()
        success = True
        message = 'All receipts in the Posbox are properly synchronized with your Odoo instance!'
        for signatureSerial, jws_dict in jws_sync.items():
            for receipt_id, jws_value in jws_dict.items():
                order = self.env['pos.order'].search([
                    ('config_id', '=', self.id),
                    ('signatureSerial', '=', signatureSerial),
                    ('receipt_id', '=', receipt_id)
                ], limit=1)
                if order and order.signedJWSCompactRep and order.signedJWSCompactRep in jws_value:
                    order.signedJWSCompactRep = jws_value

                else:
                    if self.jws_sync_dummy_creation:
                        payload = base64.b64decode(jws_value.split('.')[1]).decode('utf-8').split('_')
                        rka = payload[1]
                        cashregister = payload[2]
                        belnr = payload[3]
                        pldate = payload[4]
                        val_20 = payload[5].replace(",", ".")
                        val_10 = payload[6].replace(",", ".")
                        val_13 = payload[7].replace(",", ".")
                        val_0 = payload[8].replace(",", ".")
                        val_19 = payload[9].replace(",", ".")
                        coded_turnover = payload[10]
                        cert_serial = payload[11]
                        prev_sig = payload[12]
                        values = {
                            'jws_dummy': True,
                            'jws_dummy_ok': False,
                            'date_order': datetime.strptime(pldate, "%Y-%m-%dT%H:%M:%S"),
                            'config_id': self.id,
                            'signatureSerial': signatureSerial,
                            'receipt_id': receipt_id,
                            'session_id': self.env['pos.session'].search([('id', 'in', self.session_ids.ids), ('state', '=', 'opened')]).id,
                            'encryptedTurnOverValue': coded_turnover,
                            'chainValue': prev_sig,
                            'signedJWSCompactRep': jws_value,
                            'amount_tax': (float(val_20) * 0.2) + (float(val_10) * 0.1) + (float(val_13) * 0.13) + (float(val_0) * 0) + (float(val_19) * 0.19),
                            'amount_total': (float(val_20)) + (float(val_10)) + (float(val_13)) + (float(val_0)) + (float(val_19)),
                            'amount_paid': 0.0,
                            'amount_return': 0.0,
                            'typeOfReceipt': 'STANDARD_BELEG',
                            'lines': [],
                        }
                        if float(val_20) > 0.0:
                            values['lines'].append((0, 0, {
                                'name': "Umsätze 20%",
                                'product_id': self.env.ref('rksv_base.rksv_umsatz_20_receipt').id,
                                'price_unit': float(val_20) * 0.8,
                                'price_subtotal': float(val_20) * 0.8,
                                'price_subtotal_incl': float(val_20),
                                'qty': 1,
                                'tax_ids': [(6, 0, self.env.ref('rksv_base.rksv_umsatz_20_receipt').taxes_id.ids)]
                            }))
                        if float(val_10) > 0.0:
                            values['lines'].append((0, 0, {
                                'name': "Umsätze 10%",
                                'product_id': self.env.ref('rksv_base.rksv_umsatz_10_receipt').id,
                                'price_unit': float(val_10) * 0.9,
                                'price_subtotal': float(val_10) * 0.9,
                                'price_subtotal_incl': float(val_10),
                                'qty': 1,
                                'tax_ids': [(6, 0, self.env.ref('rksv_base.rksv_umsatz_10_receipt').taxes_id.ids)]
                            }))
                        if float(val_13) > 0.0:
                            values['lines'].append((0, 0, {
                                'name': "Umsätze 13%",
                                'product_id': self.env.ref('rksv_base.rksv_umsatz_13_receipt').id,
                                'price_unit': float(val_13) * 0.87,
                                'price_subtotal': float(val_13) * 0.87,
                                'price_subtotal_incl': float(val_13),
                                'qty': 1,
                                'tax_ids': [(6, 0, self.env.ref('rksv_base.rksv_umsatz_13_receipt').taxes_id.ids)]
                            }))
                        if float(val_0) > 0.0:
                            values['lines'].append((0, 0, {
                                'name': "Umsätze 0%",
                                'product_id': self.env.ref('rksv_base.rksv_umsatz_0_receipt').id,
                                'price_unit': float(val_0),
                                'price_subtotal': float(val_0),
                                'price_subtotal_incl': float(val_0),
                                'qty': 1,
                                'tax_ids': [(6, 0, self.env.ref('rksv_base.rksv_umsatz_0_receipt').taxes_id.ids)]
                            }))
                        if float(val_19) > 0.0:
                            values['lines'].append((0, 0, {
                                'name': "Umsätze 19%",
                                'product_id': self.env.ref('rksv_base.rksv_umsatz_19_receipt').id,
                                'price_unit': float(val_19) * 0.81,
                                'price_subtotal': float(val_19) * 0.81,
                                'price_subtotal_incl': float(val_19),
                                'qty': 1,
                                'tax_ids': [(6, 0, self.env.ref('rksv_base.rksv_umsatz_19_receipt').taxes_id.ids)]
                            }))
                        order = self.env['pos.order'].create(values)
                        pmp = self.env['pos.make.payment'].with_context(active_id=order.id).create({})
                        pmp.check()
                    else:
                        success = False
                        message = 'JWS could not be synced! Inconsistency predicted.'
                        _logger.error('JWS could not be synced! Inconsistency predicted.')
        return {
            'success': success,
            'message': message
        }

    def _get_unchecked_dummy_orders(self):
        for record in self:
            orders = self.env['pos.order'].search([
                ('config_id', '=', self.id),
                ('jws_dummy', '=', True),
                ('jws_dummy_ok', '=', False)
            ])
            record.unchecked_dummy_order_ids = [(6, 0, orders.ids)]
            record.unchecked_dummy_order_count = len(orders)

    @api.model
    def set_provider(self, serial, pos_config_id):
        sprovider = self.env['signature.provider'].search([('serial', '=', serial)])
        config = self.search([('id', '=', pos_config_id)])
        if not config:
            return {'success': False, 'message': "Invalid POS config."}
        if sprovider:
            config.signature_provider_id = sprovider.id
            return {'success': True, 'message': "Signature Provider set."}
        else:
            return {'success': False, 'message': "Invalid POS config or Signature Provider."}

    cashregisterid = fields.Char(
        string='KassenID', size=36,
        compute='_calc_cashregisterid',
        store=True, readonly=True,
        copy=False
    )
    signature_provider_id = fields.Many2one(
        comodel_name='signature.provider',
        string='Signature Provider',
        readonly=True
    )
    available_signature_provider_ids = fields.One2many(
        comodel_name='signature.provider',
        inverse_name='pos_config_id',
        string='Available Providers'
    )
    iface_rksv = fields.Boolean(string='RKSV', default=True, help="Use PosBox for RKSV")
    bound_signature = fields.Boolean(string='Bound')
    pos_admin_passwd = fields.Char(string='POS Admin Password')
    bmf_gemeldet = fields.Boolean(string='Registrierkasse beim BMF angemeldet')
    rksv_at = fields.Boolean('RKSV AT', related='company_id.rksv_at')
    bmf_test_mode = fields.Boolean(
        string='BMF Test Modus',
        default=True
    )
    jws_sync_dummy_creation = fields.Boolean(string="Bei fehlendem Eintrag im JWS Sync Dummy Eintrag erstellen")
    # Overwrite state field - instead of using our own field
    state = fields.Selection(
        string='State',
        selection=[
            ('inactive', 'Inactive'),
            ('setup', 'Setup'),
            ('active', 'Active'),
            ('failure', 'Fehler'),
            ('signature_failed', 'Fehler Signatureinheit'),
            ('posbox_failed', 'Fehler PosBox')
        ],
        default='setup',
        required=True,
        readonly=True,
        copy=False
    )

    start_product_id = fields.Many2one(
        comodel_name='product.product',
        string='Startbeleg (Produkt)',
        domain=[
            ('sale_ok', '=', True),
            ('available_in_pos', '=', True),
            ('rksv_tax_mapping_correct', '=', True),
            ('rksv_product_type', '=', 'startreceipt'),
        ],
        required=False,
    )
    month_product_id = fields.Many2one(
        comodel_name='product.product',
        string='Monatsbeleg (Produkt)',
        domain=[
            ('sale_ok', '=', True),
            ('available_in_pos', '=', True),
            ('rksv_tax_mapping_correct', '=', True),
            ('rksv_product_type', '=', 'monthreceipt'),
        ],
        required=False,
    )
    year_product_id = fields.Many2one(
        comodel_name='product.product',
        string='Jahresbeleg (Produkt)',
        domain=[
            ('sale_ok', '=', True),
            ('available_in_pos', '=', True),
            ('rksv_tax_mapping_correct', '=', True),
            ('rksv_product_type', '=', 'yearreceipt'),
        ],
        required=False,
    )
    null_product_id = fields.Many2one(
        comodel_name='product.product',
        string='Nullbeleg (Produkt)',
        domain=[
            ('sale_ok', '=', True),
            ('available_in_pos', '=', True),
            ('rksv_tax_mapping_correct', '=', True),
            ('rksv_product_type', '=', 'nullreceipt'),
        ],
        required=False,
    )
    invoice_product_id = fields.Many2one(
        comodel_name='product.product',
        string='Invoice (Product)',
        domain=[
            ('sale_ok', '=', True),
            ('available_in_pos', '=', True),
            ('rksv_tax_mapping_correct', '=', True),
            ('rksv_product_type', '=', 'nullreceipt')
        ],
        required=False,
    )
    unchecked_dummy_order_ids = fields.Many2many('pos.order', "Ungeprüfte Dummy Aufträge", compute="_get_unchecked_dummy_orders")
    unchecked_dummy_order_count = fields.Integer("Anzahl Ungeprüfte Dummy Aufträge", compute="_get_unchecked_dummy_orders")
    _sql_constraints = [('cashregisterid_unique', 'unique(cashregisterid)', 'Cashregister ID must be unique.')]

    @api.model
    def cashbox_registered_with_bmf(self, config_id):
        pos_config = self.env['pos.config'].search([('id', '=', config_id)])
        if pos_config:
            pos_config.write({'bmf_gemeldet': True})
            return True
        else:
            return False

    def create_cashregisterid(self):
        self._calc_cashregisterid()

    def set_failure(self):
        self.state = 'posbox_failed'

    def set_active(self):
        self.state = 'active'
        # Do generate a cashregisterid if there is not id attached already
        self._calc_cashregisterid()

    def set_inactive(self):
        self.state = 'inactive'

    def open_unchecked_dummy_order_ids(self):
        return {
            "type": "ir.actions.act_window",
            "name": _("Ungeprüfte Dummy Aufträge"),
            "res_model": "pos.order",
            "view_type": "form",
            "target": "self",
            "view_mode": "tree,form",
            "domain": [('id', 'in', self.unchecked_dummy_order_ids.ids)]
        }
