

import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


class Util:

    # @staticmethod
    # def send_email(data):
    #     threading.Thread(
    #         target=Util._send_email,
    #         args=(data,),
    #         daemon=True,
    #     ).start()

    @staticmethod
    def send_email(data):
        subject = data["email_subject"]

        context = data.get(
            "context",
            {
                "subject": subject,
                "body": "",
                "cta_url": "",
                "cta_text": "",
            },
        )

        body = data.get("email_body", context["body"])

        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [data["to_email"]]

        email = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=from_email,
            to=to_email,
        )

        template_name = data.get(
            "template_name",
            "Authentication/email_template.html",
        )

        html_content = render_to_string(template_name, context)
        email.attach_alternative(html_content, "text/html")
        email.send()


# class Util:
#     @staticmethod
#     def send_email(data):
#         subject = data['email_subject']
#         context = data.get("context", {})
#         body = data.get("email_body",context.get("body", ""))
#         from_email = os.environ.get('EMAIL_USER')
#         to_email = [data['to_email']]

#         email = EmailMultiAlternatives(
#             subject=subject,
#             body=body,
#             from_email=from_email,
#             to=to_email,
#         )

#         template_name = data.get('template_name', 'Authentication/email_template.html')
#         context = data.get('context', {
#             'subject': subject,
#             'body': body,
#             'cta_url': data.get('cta_url', ''),
#             'cta_text': data.get('cta_text', ''),
#         })

#         html_content = render_to_string(template_name, context)
#         email.attach_alternative(html_content, 'text/html')
#         email.send()





# from rest_framework_simplejwt.token_blacklist.models import (
#     OutstandingToken,
#     BlacklistedToken
# )

