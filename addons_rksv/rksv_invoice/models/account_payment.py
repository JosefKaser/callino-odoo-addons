# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import UserError


class AccountPayment(models.Model):
    _inherit = 'account.payment'

    ocr_code_value = fields.Text(
        string="OCR Code Value",
        readonly=True
    )
    qr_code_value = fields.Text(
        string="QR Code Value",
        readonly=True
    )
    cashbox_mode = fields.Selection(
        selection=[
            ('active', 'Normal'),
            ('signature_failed', 'Signatureinheit ausgefallen'),
            ('posbox_failed', 'PosBox ausgefallen')
        ],
        string="Modus (Signatur)", readonly=True
    )
    qr_code_image = fields.Binary(
        string="QR Code",
        attachment=True, readonly=True
    )
    receipt_id = fields.Integer(
        string='Receipt ID', readonly=True
    )
    typeOfReceipt = fields.Selection(
        selection=[
            ('STANDARD_BELEG', 'Normaler Beleg'),
            ('START_BELEG', 'Startbeleg'),
            ('STORNO_BELEG', 'Stornobeleg'),
            ('TRAINING_BELEG', 'Trainingsbeleg'),
            ('NULL_BELEG', 'Nullbeleg'),
            ('NONE_BELEG', 'Kein Beleg'),
        ], string="Belegart",
        readonly=True
    )
    signatureSerial = fields.Char(
        string="Seriennummer (Signatur)", size=16,
        readonly=True
    )
    provider_id = fields.Many2one(
        comodel_name='signature.provider',
        string="Related provider",
        readonly=True,
    )
    encryptedTurnOverValue = fields.Char(
        string="Kodierter Summenspeicher", size=128,
        readonly=True
    )
    chainValue = fields.Char(
        string="Verkettungswert", size=128,
        readonly=True
    )
    signedJWSCompactRep = fields.Char(
        string="JWS", size=512,
        readonly=True
    )
    taxSetNormal = fields.Integer(
        string="20% in Cent",
        readonly=True
    )
    taxSetErmaessigt1 = fields.Integer(
        string="10% in Cent",
        readonly=True
    )
    taxSetErmaessigt2 = fields.Integer(
        string="13% in Cent",
        readonly=True
    )
    taxSetNull = fields.Integer(
        string="0% in Cent",
        readonly=True
    )
    taxSetBesonders = fields.Integer(
        string="19% in Cent",
        readonly=True
    )
    turnOverValue = fields.Integer(
        string="Summenspeicher",
        readonly=True
    )
    rksv_at = fields.Boolean(related='journal_id.rksv_at')

    @api.multi
    def post(self):
        if self.env.context.get('disable_rksv', False):
            return super(AccountPayment, self).post()
        self.rksv_sign_payment()
        return super(AccountPayment, self).post()

    def rksv_sign_payment(self):
        if self.env.context.get('disable_rksv', False):
            return
        for payment in self:
            if payment.journal_id.rksv_at and payment.journal_id.type == 'cash':
                if payment.journal_id.rksv_state != 'ready':
                    raise UserError('Belegsignatur meldet einen Fehler.')
                beleg = payment.journal_id.register_payment(payment)
                payment.update(beleg)
