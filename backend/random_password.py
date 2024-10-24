import secrets
import string

class PasswordGenerator:
    def __init__(self):
        self.generated_passwords = set()  # Store previously generated passwords

    def generate_password(self, length=12, use_upper=True, use_lower=True, use_numbers=True, use_special=True):
        if length <= 0:
            raise ValueError("Password length must be greater than 0")

        # Create the character pool based on user preferences
        character_pool = ''
        password = []

        if use_upper:
            character_pool += string.ascii_uppercase
            password.append(secrets.choice(string.ascii_uppercase))  # Ensure at least one uppercase
        if use_lower:
            character_pool += string.ascii_lowercase
            password.append(secrets.choice(string.ascii_lowercase))  # Ensure at least one lowercase
        if use_numbers:
            character_pool += string.digits
            password.append(secrets.choice(string.digits))  # Ensure at least one digit
        if use_special:
            character_pool += string.punctuation
            password.append(secrets.choice(string.punctuation))  # Ensure at least one special character

        # Ensure at least one character type is selected
        if not character_pool:
            raise ValueError("At least one character type must be selected")

        # Fill in the rest of the password length
        while len(password) < length:
            password.append(secrets.choice(character_pool))

        # Shuffle to avoid predictable patterns
        secrets.SystemRandom().shuffle(password)

        password = ''.join(password)

        if password not in self.generated_passwords:  # Check for uniqueness
            self.generated_passwords.add(password)  # Add to set if unique
            return password  # Return unique password