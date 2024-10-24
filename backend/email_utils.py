import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

def send_recovery_email(email: str, token: str):
    sender_email = os.getenv("EMAIL_USERNAME")
    sender_password = os.getenv("EMAIL_PASSWORD")
    email_host = os.getenv("EMAIL_HOST")
    email_port = int(os.getenv("EMAIL_PORT", "587"))

    message = MIMEMultipart("alternative")
    message["Subject"] = "Password Recovery"
    message["From"] = sender_email
    message["To"] = email

    reset_url = f"http://localhost:5173/reset-password?token={token}"
    text = f"Click the following link to reset your password: {reset_url}"
    html = f"""
    <html>
      <body>
        <p>Click the following link to reset your password:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    message.attach(part1)
    message.attach(part2)

    try:
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        logging.info(f"Recovery email sent successfully to {email}")
    except Exception as e:
        logging.error(f"Failed to send recovery email to {email}: {str(e)}")
        raise