import secrets
import string
from typing import Set, List


class PasswordGenerator:
    def __init__(self):
        self.generated_passwords: Set[str] = set()  # Store previously generated passwords

    @staticmethod
    def _secure_shuffle(seq: List[str]) -> None:
        """
        Cryptographically secure in-place shuffle of a sequence using secrets module.

        Args:
            seq: Sequence to shuffle
        """
        for i in range(len(seq) - 1, 0, -1):
            # Generate a secure random index and swap
            j = secrets.randbelow(i + 1)
            seq[i], seq[j] = seq[j], seq[i]

    def generate_password(self, length=12, use_upper=True, use_lower=True, use_numbers=True, use_special=True,
                          max_attempts=100):
        """
        Generate a cryptographically secure random password.

        Args:
            length (int): Length of the password
            use_upper (bool): Include uppercase letters
            use_lower (bool): Include lowercase letters
            use_numbers (bool): Include numbers
            use_special (bool): Include special characters
            max_attempts (int): Maximum number of attempts to generate a unique password

        Returns:
            str: A unique secure password

        Raises:
            ValueError: If invalid parameters are provided or unique password generation fails
        """
        if length < 8:  # Enforce minimum length for security
            raise ValueError("Password length must be at least 8 characters")

        if not any([use_upper, use_lower, use_numbers, use_special]):
            raise ValueError("At least one character type must be selected")

        # Create separate pools for each character type
        pools = []
        min_chars = []

        if use_upper:
            pools.append(string.ascii_uppercase)
            min_chars.append(secrets.choice(string.ascii_uppercase))
        if use_lower:
            pools.append(string.ascii_lowercase)
            min_chars.append(secrets.choice(string.ascii_lowercase))
        if use_numbers:
            pools.append(string.digits)
            min_chars.append(secrets.choice(string.digits))
        if use_special:
            pools.append(string.punctuation)
            min_chars.append(secrets.choice(string.punctuation))

        # Combine pools after using them for minimum requirements
        character_pool = ''.join(pools)

        attempts = 0
        while attempts < max_attempts:
            # Start with minimum required characters
            password_chars = min_chars.copy()

            # Fill remaining length with random characters
            remaining_length = length - len(password_chars)
            if remaining_length > 0:
                # Generate all remaining characters at once using secrets.choice
                password_chars.extend(
                    secrets.choice(character_pool)
                    for _ in range(remaining_length)
                )

            # Use our secure shuffle implementation
            self._secure_shuffle(password_chars)
            password = ''.join(password_chars)

            # Check if this password is unique
            if password not in self.generated_passwords:
                self.generated_passwords.add(password)
                return password

            attempts += 1

        raise ValueError(
            "Could not generate a unique password after maximum attempts. Consider increasing length or changing character requirements.")

    def clear_password_history(self):
        """Clear the history of generated passwords."""
        self.generated_passwords.clear()