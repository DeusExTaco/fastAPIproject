import unittest
from random_password import PasswordGenerator

class TestPasswordGenerator(unittest.TestCase):

    def setUp(self):
        self.generator = PasswordGenerator()

    def test_default_password_generation(self):
        # Test password generation with default parameters
        password = self.generator.generate_password()
        self.assertEqual(len(password), 12)
        self.assertTrue(any(c.isupper() for c in password))
        self.assertTrue(any(c.islower() for c in password))
        self.assertTrue(any(c.isdigit() for c in password))
        self.assertTrue(any(c in "!@#$%^&*()_+-=[]{}|;':,.<>/?`~" for c in password))

    def test_custom_length_password(self):
        # Test password generation with custom length
        password = self.generator.generate_password(length=16)
        self.assertEqual(len(password), 16)

    def test_no_uppercase(self):
        # Test password generation without uppercase characters
        password = self.generator.generate_password(use_upper=False)
        self.assertFalse(any(c.isupper() for c in password))

    def test_no_lowercase(self):
        # Test password generation without lowercase characters
        password = self.generator.generate_password(use_lower=False)
        self.assertFalse(any(c.islower() for c in password))

    def test_no_numbers(self):
        # Test password generation without numbers
        password = self.generator.generate_password(use_numbers=False)
        self.assertFalse(any(c.isdigit() for c in password))

    def test_no_special_characters(self):
        # Test password generation without special characters
        password = self.generator.generate_password(use_special=False)
        self.assertFalse(any(c in "!@#$%^&*()_+-=[]{}|;':,.<>/?`~" for c in password))

    def test_no_character_types_selected(self):
        # Test that ValueError is raised when no character types are selected
        with self.assertRaises(ValueError):
            self.generator.generate_password(use_upper=False, use_lower=False, use_numbers=False, use_special=False)

    def test_zero_length_password(self):
        # Test that ValueError is raised when length is 0
        with self.assertRaises(ValueError):
            self.generator.generate_password(length=0)

    def test_password_uniqueness(self):
        # Test that passwords are unique
        password1 = self.generator.generate_password()
        password2 = self.generator.generate_password()
        self.assertNotEqual(password1, password2)

if __name__ == '__main__':
    unittest.main(verbosity=2)  # Use verbosity=2 for detailed output