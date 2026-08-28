

import threading
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from io import BytesIO

from PIL import Image
from django.core.files.base import ContentFile



class Util:

    @staticmethod
    def send_email(data):
        threading.Thread(
            target=Util._send_email,
            args=(data,),
            daemon=True,
        ).start()

    @staticmethod
    def _send_email(data):
        subject = data["email_subject"]

        context = data.get(
            "context",
            {
                "subject": subject,
                "body": "",
                "otp": "",
                "cta_url": "",
                "cta_text": "",
            },
        )

        body = data.get("email_body", context.get("body", ""))

        email = EmailMultiAlternatives(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[data["to_email"]],
        )

        template_name = data.get(
            "template_name",
            "Authentication/email_template.html",
        )

        html_content = render_to_string(template_name, context)
        email.attach_alternative(html_content, "text/html")
        email.send()




    @staticmethod
    def optimize_image(
        image_file,
        max_size=(512, 512),
        quality=80,
    ):
        
        image = Image.open(image_file)

        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        image.thumbnail(
            max_size,
            Image.Resampling.LANCZOS,
        )

        output = BytesIO()

        image.save(
            output,
            format="WEBP",
            quality=quality,
            optimize=True,
        )

        filename = image_file.name.rsplit(".", 1)[0]

        return ContentFile(
            output.getvalue(),
            name=f"{filename}.webp",
        )



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

