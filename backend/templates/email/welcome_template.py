from typing import Tuple
import os
from email_utils import encode_token


def get_welcome_email_content(email: str, token: str, username: str) -> Tuple[str, str]:
    """
    Returns (plain_text, html) tuple for welcome email
    """
    setup_url = f"http://localhost:5173/reset-password?token={encode_token(token)}&welcome=true"
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

    return text, html


def send_welcome_email(email: str, token: str, username: str):
    from email_utils import create_mime_message, send_email

    current_dir = os.path.dirname(__file__)
    image_path = os.path.join(current_dir, 'assets', 'handshake.png')

    text_content, html_content = get_welcome_email_content(email, token, username)
    message = create_mime_message(
        to_email=email,
        subject="Welcome to Your Account - Set Up Your Password",
        text_content=text_content,
        html_content=html_content,
        image_path=image_path
    )

    send_email(email, message)