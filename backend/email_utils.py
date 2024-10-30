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
            mime_image.add_header('Content-ID', '<security_graphic>')
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


def send_welcome_email(email: str, token: str, username: str):
    """
    Send welcome email to new user with password setup link
    """
    try:
        current_dir = os.path.dirname(__file__)
        image_path = os.path.join(current_dir, 'assets', 'Security_Graphic.png')

        sender_email = os.getenv("EMAIL_USERNAME")
        sender_password = os.getenv("EMAIL_PASSWORD")
        email_host = os.getenv("EMAIL_HOST")
        email_port = int(os.getenv("EMAIL_PORT", "587"))

        # Create the root MIME message
        message = MIMEMultipart('related')
        message["Subject"] = "Welcome to Your Account - Set Up Your Password"
        message["From"] = sender_email
        message["To"] = email

        # Create the multipart/alternative child
        msg_alternative = MIMEMultipart('alternative')
        message.attach(msg_alternative)

        # Encode and prepare the token for the URL
        encoded_token = base64.urlsafe_b64encode(token.encode()).decode()
        url_safe_token = urllib.parse.quote(encoded_token)
        # Using reset-password route for both initial setup and reset
        setup_url = f"http://localhost:5173/reset-password?token={url_safe_token}&welcome=true"
        website_url = "https://google.com"

        # Plain text version
        text = f"""
            Welcome to Your Account, {username}!

            Your account has been created successfully. To get started, you'll need to set up your password.
            Please click the following link to set up your password: {setup_url}

            This link will expire in 24 hours for security purposes.

            If you didn't create this account, please contact our support team immediately.
        """

        # HTML version
        html = f"""
        <html lang="en">
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f8; color: #333; margin: 0; padding: 20px; text-align: left;">
            <div style="max-width: 800px; background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); margin: auto;">   
              <img src="cid:security_graphic" alt="Security Graphic" style="width:25%; max-width:75px; height:25%; max-height:75px; border-radius: 8px;">
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <h2 style="color: #333; font-size: 28px; margin-bottom: 10px;">Welcome to Your Account, {username}!</h2>
              <p style="font-size: 20px; line-height: 1.6;">Your account has been created successfully. To get started, you'll need to set up your password.</p>
              <p style="font-size: 20px; line-height: 1.6;">Click the button below to set up your password for your account:</p>
              <a href="{setup_url}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #007bff; color: #fff; text-decoration: none; font-size: 20px; border-radius: 5px;">Set Up Password</a>
              <p style="font-size: 16px; color: #666; margin-top: 20px;">This link will expire in 24 hours for security purposes.</p>
              <p style="font-size: 16px; color: #666;">If you didn't create this account, please contact our support team immediately.</p>

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

        # Attach the image
        with open(image_path, 'rb') as img:
            mime_image = MIMEImage(img.read())
            mime_image.add_header('Content-ID', '<security_graphic>')
            mime_image.add_header('Content-Disposition', 'inline', filename='Security_Graphic.png')
            message.attach(mime_image)

        # Send the email
        with smtplib.SMTP(email_host, email_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, email, message.as_string())

        logging.info(f"Welcome email sent successfully to {email}")

    except Exception as e:
        logging.error(f"Failed to send welcome email to {email}: {str(e)}")
        raise