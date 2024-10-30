import base64
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import urllib.parse
from typing import Optional


def create_mime_message(
        to_email: str,
        subject: str,
        text_content: str,
        html_content: str,
        image_path: Optional[str] = None
) -> MIMEMultipart:
    sender_email = os.getenv("EMAIL_USERNAME")

    # Create the root MIME message
    message = MIMEMultipart('related')
    message["Subject"] = subject
    message["From"] = sender_email
    message["To"] = to_email

    # Create the multipart/alternative child
    msg_alternative = MIMEMultipart('alternative')
    message.attach(msg_alternative)

    # Attach text and HTML versions
    msg_alternative.attach(MIMEText(text_content, "plain"))
    msg_alternative.attach(MIMEText(html_content, "html"))

    # Attach image if provided
    if image_path:
        try:
            with open(image_path, 'rb') as img:
                mime_image = MIMEImage(img.read())
                mime_image.add_header('Content-ID', '<security_graphic>')
                mime_image.add_header('Content-Disposition', 'inline', filename='Security_Graphic.png')
                message.attach(mime_image)
        except Exception as e:
            logging.warning(f"Failed to attach image {image_path}: {str(e)}")

    return message


def send_email(to_email: str, message: MIMEMultipart):
    sender_email = os.getenv("EMAIL_USERNAME")
    sender_password = os.getenv("EMAIL_PASSWORD")
    email_host = os.getenv("EMAIL_HOST")
    email_port = int(os.getenv("EMAIL_PORT", "587"))

    try:
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, message.as_string())
        logging.info(f"Email sent successfully to {to_email}")
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        raise


def encode_token(token: str) -> str:
    encoded_token = base64.urlsafe_b64encode(token.encode()).decode()
    return urllib.parse.quote(encoded_token)