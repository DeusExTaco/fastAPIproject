"""add_user_profile_and_address_tables

Revision ID: 84a962eb1f36
Revises: 170821aa5594
Create Date: 2024-11-03 23:37:34.369600+00:00

"""
from typing import Union, Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84a962eb1f36'
down_revision: Union[str, None] = '170821aa5594'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('date_of_birth', sa.String(length=10), nullable=True, comment='Format: YYYY-MM-DD'),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('avatar_url', sa.String(length=255), nullable=True),
        sa.Column('bio', sa.String(length=1000), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('social_media', sa.JSON(), nullable=True,
                  comment='Store social media links as {"platform": "url"}'),
        sa.Column('notification_preferences', sa.JSON(), nullable=True,
                  comment='Store notification settings as {"type": boolean}'),
        sa.Column('privacy_settings', sa.JSON(), nullable=True,
                  comment='Store privacy settings as {"setting": "value"}'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
                  nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name='fk_user_profiles_user_id',
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_profiles_user_id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        comment='Stores extended user profile information'
    )

    # Initialize JSON columns with default values after table creation
    op.execute("""
        UPDATE user_profiles 
        SET social_media = '{}',
            notification_preferences = '{"email": true, "push": false, "sms": false}',
            privacy_settings = '{"profile_visibility": "public", "show_email": false, "show_phone": false}'
        WHERE social_media IS NULL 
        OR notification_preferences IS NULL 
        OR privacy_settings IS NULL
    """)

    # Create user_addresses table
    op.create_table(
        'user_addresses',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('street', sa.String(length=255), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True),
                  server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
                  nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'],
                                name='fk_user_addresses_user_id',
                                ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci',
        comment='Stores user address information'
    )

    # Add indexes for common queries
    op.create_index('ix_user_addresses_id', 'user_addresses', ['id'], unique=False)
    op.create_index('ix_user_addresses_user_id', 'user_addresses', ['user_id'], unique=False)
    op.create_index('ix_user_profiles_id', 'user_profiles', ['id'], unique=False)
    op.create_index('ix_user_profiles_phone', 'user_profiles', ['phone'], unique=True)


def downgrade():
    # Drop foreign key constraints first
    op.drop_constraint('fk_user_addresses_user_id', 'user_addresses', type_='foreignkey')
    op.drop_constraint('fk_user_profiles_user_id', 'user_profiles', type_='foreignkey')

    # Drop indexes
    op.drop_index('ix_user_addresses_user_id', table_name='user_addresses')
    op.drop_index('ix_user_profiles_phone', table_name='user_profiles')
    op.drop_index('ix_user_addresses_id', table_name='user_addresses')
    op.drop_index('ix_user_profiles_id', table_name='user_profiles')

    # Drop tables
    op.drop_table('user_addresses')
    op.drop_table('user_profiles')