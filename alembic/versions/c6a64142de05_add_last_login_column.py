"""add last_login column

Revision ID: xxxx_add_last_login_column
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic
revision = 'xxxx_add_last_login_column'  # Alembic will generate this
down_revision = None  # Update this if you have previous migrations

def upgrade() -> None:
    # Add last_login column
    op.add_column('users',
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True)
    )

def downgrade() -> None:
    # Remove last_login column
    op.drop_column('users', 'last_login')