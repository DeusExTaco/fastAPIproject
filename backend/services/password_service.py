
from typing import List

import bcrypt


class PasswordService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    @staticmethod
    def check_password_history(new_password: str, password_history: List[str]) -> bool:
        if not password_history:
            return True

        for old_password in password_history:
            if PasswordService.verify_password(new_password, old_password):
                return False
        return True

    @staticmethod
    def update_password_history(current_hash: str, history: List[str]) -> List[str]:
        if history is None:
            history = []
        new_history = history + [current_hash]
        return new_history[-5:]  # Keep last 5 passwords