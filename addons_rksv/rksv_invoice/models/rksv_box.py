from odoo import api, fields, models
from odoo.exceptions import UserError
import requests
from datetime import datetime
import time
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
import re


class RKSVBox(models.Model):
    _name = 'rksv.box'
    _rec_name = 'name'
    _description = 'RKSV Box'

    @api.depends('ipv4', 'proto')
    def _compute_host(self):
        for box in self:
            box.host = "%s://%s" % (box.proto, box.ipv4, )

    name = fields.Char(string="Name")
    state = fields.Selection([
        ('unknown', 'Unknown'),
        ('error', 'Error'),
        ('ready', 'Ready'),
    ], default='unknown', string="Status")
    ipv4 = fields.Char(string="IPv4")
    proto = fields.Selection([
        ('http', 'HTTP'),
        ('https', 'HTTPS'),
    ], default='https', string="Proto")
    timeout = fields.Integer('Timeout (sec)', default=5)
    host = fields.Char(string='Host', compute='_compute_host', store=False)
    available = fields.Boolean('Available', readonly=True)
    last_ping = fields.Datetime('Last Ping')
    signature_provider_ids = fields.One2many('signature.provider', 'box_id', string="Signaturen")


    def _getBasePostData(self, params={}):
        self.ensure_one()
        return {
            "jsonrpc": "2.0",
            "method": "call",
            "params": params,
            "id": int(time.time())
        }

    def query_box(self, path, params={}):
        self.ensure_one()
        postData = self._getBasePostData(params=params)
        response = requests.post('%s%s' % (self.host, path, ),
                                 json=postData,
                                 timeout=self.timeout,
                                 verify=False
                                 )
        if response.status_code == 200:
            return response.json()['result']
        else:
            raise UserError(response.text)

    def button_query_box(self):
        '''
{
    "jsonrpc": "2.0",
    "id": 635555732,
    "result": [
        {
            "atr": "3B DF 18 00 81 31 FE 58 80 31 90 52 41 01 64 05 C9 03 AC 73 B7 B1 D4 44",
            "reader": "Gemalto USB Shell Token V2 (4DFF77C7) 00 00",
            "cin": "4424754587030001",
            "serial": 1031827635,
            "issuer": "C=AT, CN=A-Trust Registrierkasse.CA, O=A-Trust Ges. f. Sicherheitssysteme im elektr. Datenverkehr GmbH, OU=A-Trust Registrierkasse.CA",
            "valid_from": "2017-01-27 08:41:23",
            "valid_until": "2022-01-27 07:41:23",
            "subject": "C=AT, CN=UID ATU62732644, serialNumber=442475458703",
            "x509": "-----BEGIN CERTIFICATE-----\r\nMIIFPDCCAySgAwIBAgIEPYBwszANBgkqhkiG9w0BAQsFADCBoTELMAkGA1UEBhMC\r\nQVQxSDBGBgNVBAoMP0EtVHJ1c3QgR2VzLiBmLiBTaWNoZXJoZWl0c3N5c3RlbWUg\r\naW0gZWxla3RyLiBEYXRlbnZlcmtlaHIgR21iSDEjMCEGA1UECwwaQS1UcnVzdCBS\r\nZWdpc3RyaWVya2Fzc2UuQ0ExIzAhBgNVBAMMGkEtVHJ1c3QgUmVnaXN0cmllcmth\r\nc3NlLkNBMB4XDTE3MDEyNzA4NDEyM1oXDTIyMDEyNzA3NDEyM1owPjELMAkGA1UE\r\nBhMCQVQxGDAWBgNVBAMMD1VJRCBBVFU2MjczMjY0NDEVMBMGA1UEBRMMNDQyNDc1\r\nNDU4NzAzMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEsh1CCmfUD1dgmIGE49ER\r\nqivSoWgCjRfDZb77vvIzDDp5a8C9Ezn0iGNnifKj6mKzm6p29PXJ4+q5odETZn6w\r\nmKOCAacwggGjMH8GCCsGAQUFBwEBBHMwcTBGBggrBgEFBQcwAoY6aHR0cDovL3d3\r\ndy5hLXRydXN0LmF0L2NlcnRzL0EtVHJ1c3QtUmVnaXN0cmllcmthc3NlLUNBLmNl\r\ncjAnBggrBgEFBQcwAYYbaHR0cDovL29jc3AuYS10cnVzdC5hdC9vY3NwMA4GA1Ud\r\nDwEB/wQEAwIGwDARBgNVHQ4ECgQIT9xEyRfV1rUwRQYDVR0fBD4wPDA6oDigNoY0\r\naHR0cDovL2NybC5hLXRydXN0LmF0L2NybC9BLVRydXN0LVJlZ2lzdHJpZXJrYXNz\r\nZS5DQTAJBgNVHRMEAjAAMFgGA1UdIARRME8wTQYGKigAEQEYMEMwQQYIKwYBBQUH\r\nAgEWNWh0dHA6Ly93d3cuYS10cnVzdC5hdC9kb2NzL2NwL0EtVHJ1c3QtUmVnaXN0\r\ncmllcmthc3NlMBMGA1UdIwQMMAqACEBHnq7jkN+2MB4GA1UdEQQXMBWBE3dwaWNo\r\nbGVyQGNhbGxpbm8uYXQwHAYHKigACgELAQQRDA9VSUQgQVRVNjI3MzI2NDQwDQYJ\r\nKoZIhvcNAQELBQADggIBAB+0g12jxBX+NR8arRUhVw1MC1fbo4aW4oCnaZGur74d\r\n/J52+tWTJqF8eVuT88LhAD91M+jttImiBUV9HR6hCNUXBP8MqmirzDMWG6CvnRcS\r\nFp7aEQhm/2JCT42T0iuj5WiPArCVwLVrz01DArgrTbEz1UuZbu+ZNi/ek5KCp4/n\r\n9aZBD8UuaQ6Ka1cVU/3+3k3J3iuvEJNvXP9SacOu7H/Asa4hNQ+dgm7d4/8zRymd\r\nhs8ClpXMIayXCFWC5dzR3KCEBgKJMgT3X9CK/wowapFA8hS/1eaho6kQtYZAHA2a\r\nVKgQYpuk3ZkFgCfuYZ5JD+9VeY43W4dPc5pq1MSN/RBK+xdeXsE8Sdplp8Ms1gJd\r\nGs3frBq5JDxNKXK1lDbrMlsu/lEGZblIFNMgXqpsnWLeQ+pfPn30vGYvHoG2WMVI\r\nHr2MkcmoqIHucL6+4uI69AXOWwyz5Sub3yvSpMMjiY6ubEN5lSqRhmPmLqsZZVNN\r\nyUWUbJZjxfJlh14G9Dt9/4MevFvXK+jWXbcKd5MN2vBFDe05S/hceASsvzDFQ0hC\r\nLG/EKDr9FpHwm2WkBDnZjG9PdfXLpFOcb5kaEYBJbdQjOXrsHRzamFi8/QxmxQWV\r\n/JWOlG/khlhi/UQxVDfBpJ6CCNZLzv+UKzqczwNp+SHAjzTAB5Iznm4I0cua8cyN\r\n\r\n-----END CERTIFICATE-----\r\n",
            "x509base64": "MIIFPDCCAySgAwIBAgIEPYBwszANBgkqhkiG9w0BAQsFADCBoTELMAkGA1UEBhMCQVQxSDBGBgNVBAoMP0EtVHJ1c3QgR2VzLiBmLiBTaWNoZXJoZWl0c3N5c3RlbWUgaW0gZWxla3RyLiBEYXRlbnZlcmtlaHIgR21iSDEjMCEGA1UECwwaQS1UcnVzdCBSZWdpc3RyaWVya2Fzc2UuQ0ExIzAhBgNVBAMMGkEtVHJ1c3QgUmVnaXN0cmllcmthc3NlLkNBMB4XDTE3MDEyNzA4NDEyM1oXDTIyMDEyNzA3NDEyM1owPjELMAkGA1UEBhMCQVQxGDAWBgNVBAMMD1VJRCBBVFU2MjczMjY0NDEVMBMGA1UEBRMMNDQyNDc1NDU4NzAzMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEsh1CCmfUD1dgmIGE49ERqivSoWgCjRfDZb77vvIzDDp5a8C9Ezn0iGNnifKj6mKzm6p29PXJ4+q5odETZn6wmKOCAacwggGjMH8GCCsGAQUFBwEBBHMwcTBGBggrBgEFBQcwAoY6aHR0cDovL3d3dy5hLXRydXN0LmF0L2NlcnRzL0EtVHJ1c3QtUmVnaXN0cmllcmthc3NlLUNBLmNlcjAnBggrBgEFBQcwAYYbaHR0cDovL29jc3AuYS10cnVzdC5hdC9vY3NwMA4GA1UdDwEB/wQEAwIGwDARBgNVHQ4ECgQIT9xEyRfV1rUwRQYDVR0fBD4wPDA6oDigNoY0aHR0cDovL2NybC5hLXRydXN0LmF0L2NybC9BLVRydXN0LVJlZ2lzdHJpZXJrYXNzZS5DQTAJBgNVHRMEAjAAMFgGA1UdIARRME8wTQYGKigAEQEYMEMwQQYIKwYBBQUHAgEWNWh0dHA6Ly93d3cuYS10cnVzdC5hdC9kb2NzL2NwL0EtVHJ1c3QtUmVnaXN0cmllcmthc3NlMBMGA1UdIwQMMAqACEBHnq7jkN+2MB4GA1UdEQQXMBWBE3dwaWNobGVyQGNhbGxpbm8uYXQwHAYHKigACgELAQQRDA9VSUQgQVRVNjI3MzI2NDQwDQYJKoZIhvcNAQELBQADggIBAB+0g12jxBX+NR8arRUhVw1MC1fbo4aW4oCnaZGur74d/J52+tWTJqF8eVuT88LhAD91M+jttImiBUV9HR6hCNUXBP8MqmirzDMWG6CvnRcSFp7aEQhm/2JCT42T0iuj5WiPArCVwLVrz01DArgrTbEz1UuZbu+ZNi/ek5KCp4/n9aZBD8UuaQ6Ka1cVU/3+3k3J3iuvEJNvXP9SacOu7H/Asa4hNQ+dgm7d4/8zRymdhs8ClpXMIayXCFWC5dzR3KCEBgKJMgT3X9CK/wowapFA8hS/1eaho6kQtYZAHA2aVKgQYpuk3ZkFgCfuYZ5JD+9VeY43W4dPc5pq1MSN/RBK+xdeXsE8Sdplp8Ms1gJdGs3frBq5JDxNKXK1lDbrMlsu/lEGZblIFNMgXqpsnWLeQ+pfPn30vGYvHoG2WMVIHr2MkcmoqIHucL6+4uI69AXOWwyz5Sub3yvSpMMjiY6ubEN5lSqRhmPmLqsZZVNNyUWUbJZjxfJlh14G9Dt9/4MevFvXK+jWXbcKd5MN2vBFDe05S/hceASsvzDFQ0hCLG/EKDr9FpHwm2WkBDnZjG9PdfXLpFOcb5kaEYBJbdQjOXrsHRzamFi8/QxmxQWV/JWOlG/khlhi/UQxVDfBpJ6CCNZLzv+UKzqczwNp+SHAjzTAB5Iznm4I0cua8cyN\n"
        }
    ]
}
        :return:
        '''
        for box in self:
            try:
                providers = self.query_box("/hw_proxy/cashbox/providers")
                for provider in providers:
                    sprovider = self.env['signature.provider'].search([
                        ('box_id', '=', box.id),
                        ('serial', '=', provider['serial']),
                    ])
                    subject = provider['subject']
                    matches = re.search('CN=UID\s(.*),\s', subject)
                    atu = matches.group(0)
                    company = self.env['res.company'].search([
                        ('vat', '=', atu)
                    ])
                    sproviderData = {
                        'name': provider['cin'],
                        'serial': provider['serial'],
                        'public_key': provider['cin'],
                        'reader': provider['reader'],
                        'x509': provider['x509'],
                        'valid_from': datetime.strptime(provider['valid_from'], DEFAULT_SERVER_DATETIME_FORMAT),
                        'valid_until': datetime.strptime(provider['valid_until'], DEFAULT_SERVER_DATETIME_FORMAT),
                        'subject': provider['subject'],
                        'issuer': provider['issuer'],
                        'x509': provider['x509'],
                        'company_id': company.id if company else None,
                        'box_id': box.id,
                        'state': 'ready',
                    }
                    if not sprovider:
                        sprovider = self.env['signature.provider'].create(sproviderData)
                    else:
                        sprovider.write(sproviderData)
                    sprovider.fetch_bmf_status()
                box.state = 'ready'
            except:
                box.state = 'error'
