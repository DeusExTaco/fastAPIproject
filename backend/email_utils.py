import base64
import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import urllib.parse


def send_recovery_email(email: str, token: str):
    current_dir = os.path.dirname(__file__)
    image_path = os.path.join(current_dir, 'assets', 'Security_Graphic.png')

    sender_email = os.getenv("EMAIL_USERNAME")
    sender_password = os.getenv("EMAIL_PASSWORD")
    email_host = os.getenv("EMAIL_HOST")
    email_port = int(os.getenv("EMAIL_PORT", "587"))

    # Create the root MIME message
    message = MIMEMultipart('related')
    message["Subject"] = "Password Reset Requested"
    message["From"] = sender_email
    message["To"] = email

    # Create the multipart/alternative child
    msg_alternative = MIMEMultipart('alternative')
    message.attach(msg_alternative)

    # Encode the token and URL encode it to ensure safe transmission
    encoded_token = base64.urlsafe_b64encode(token.encode()).decode()
    url_safe_token = urllib.parse.quote(encoded_token)
    reset_url = f"http://localhost:5173/reset-password?token={url_safe_token}"
    website_url = "https://google.com"

    # Plain text version
    text = f"Click the following link to reset your password: {reset_url}"

    # HTML version
    html = f"""
    <html lang="en">
      <body style="font-family: Arial, sans-serif; background-color: #f4f4f8; color: #333; margin: 0; padding: 20px; text-align: left;">
        <div style="max-width: 800px; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); margin: auto;">   
          <img src="cid:security_graphic" alt="Security Graphic" style="width:25%; max-width:75px; height:25%; max-height:75px; border-radius: 8px;">
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <h2 style="color: #333; font-size: 28px; margin-bottom: 10px;">Reset Your Password</h2>
          <p style="font-size: 20px; line-height: 1.6;">Click on the button below within the next 60 minutes to reset your password for your account {email}</p>
          <a href="{reset_url}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #007bff; color: #fff; text-decoration: none; font-size: 20px; border-radius: 5px;">Reset Password</a>
          <p style="font-size: 20px; line-height: 1.6; margin-top: 20px;">If you didn't request this, you can safely ignore this message.</p>

          <!-- Footer Section -->
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <footer style="font-size: 14px; color: #888;">
            <p style="margin: 0;">Visit our <a href="{website_url}" style="color: #007bff; text-decoration: none;">Website</a> for more information.</p>
            <p style="margin: 5px 0;">&copy; 2024 Your Company Name. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    msg_alternative.attach(part1)
    msg_alternative.attach(part2)

    try:
        # Attach the image with proper headers for Outlook compatibility
        with open(image_path, 'rb') as img:
            mime_image = MIMEImage(img.read())
            mime_image.add_header('Content-ID', '<security_graphic>')  # Note the angle brackets
            mime_image.add_header('Content-Disposition', 'inline', filename='Security_Graphic.png')
            message.attach(mime_image)

        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())
        logging.info(f"Recovery email sent successfully to {email}")
    except Exception as e:
        logging.error(f"Failed to send recovery email to {email}: {str(e)}")
        raise