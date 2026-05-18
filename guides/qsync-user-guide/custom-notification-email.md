---
title: Custom Emails
sidebar_position: 5
image: img/guides/qsync/qsync_og_image.jpg
---

# Custom Notifications Email

Clients may configure either:

* a custom self-hosted SMTP server
* [Google Workspace](https://workspace.google.com/?utm_source=chatgpt.com) SMTP

for platform notifications including:

* transactional emails
* OTPs
* support notifications
* alerts

Recommended sender addresses:

* `noreply@company.com`
* `support@company.com`
* `alerts@company.com`

---

# Estimated Infrastructure Cost

| Option                  | Estimated Cost |
| ----------------------- | -------------- |
| Self-hosted VPS SMTP    | ~$13/month     |
| Domain Name             | $13–20/year    |
| SSL Certificates        | -              |
| Thunderbird Mail Client | -              |
| Google Workspace        | ~$6/user/month |

Recommended mail client:

* [Mozilla Thunderbird](https://www.thunderbird.net/)

---

# Required SMTP Environment Variables

Please provide the following configuration values:

```env id="11b5gq"
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=
SMTP_SECURE=
```

---

# Example Configuration — Self-Hosted

```env id="p0t5yu"
SMTP_HOST=mail.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=strong_password
SMTP_FROM_EMAIL=noreply@company.com
SMTP_FROM_NAME=Company Notifications
SMTP_SECURE=false
```

---

# Example Configuration — Google Workspace

```env id="w57j18"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=google_app_password
SMTP_FROM_EMAIL=noreply@company.com
SMTP_FROM_NAME=Company Notifications
SMTP_SECURE=false
```

---

# Required DNS Configuration

Please confirm the following are configured:

* MX record
* SPF record
* DKIM
* DMARC
* PTR/reverse DNS (self-hosted only)
* SSL/TLS

---

# Mailboxes Required

Please ensure the following mailboxes exist:

```txt id="jlwmxl"
noreply@company.com
support@company.com
alerts@company.com
```

---

# Deliverables Required

Please provide:

```env id="9q1vy4"
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=
SMTP_SECURE=
```

and confirm:

* SMTP externally accessible
* SSL/TLS active
* DNS records configured
* mailbox credentials tested.
