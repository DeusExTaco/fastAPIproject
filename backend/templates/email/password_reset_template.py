from typing import Tuple
import os
from email_utils import encode_token


def get_password_reset_content(email: str, token: str) -> Tuple[str, str]:
    """
    Returns (plain_text, html) tuple for password reset email
    """
    reset_url = f"http://localhost:5173/reset-password?token={encode_token(token)}"
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

    return text, html


def send_recovery_email(email: str, token: str):
    from email_utils import create_mime_message, send_email

    current_dir = os.path.dirname(__file__)
    image_path = os.path.join(current_dir, 'assets', 'Security_Graphic.png')

    text_content, html_content = get_password_reset_content(email, token)
    message = create_mime_message(
        to_email=email,
        subject="Password Reset Requested",
        text_content=text_content,
        html_content=html_content,
        image_path=image_path
    )

    send_email(email, message)