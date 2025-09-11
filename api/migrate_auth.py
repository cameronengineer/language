#!/usr/bin/env python3
"""
Database migration script for authentication features
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlmodel import create_engine, text
from core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_database():
    """Run database migration for authentication"""
    engine = create_engine(settings.database_url, echo=True)
    
    # Migration steps
    migrations = [
        # Add new columns to users table
        """
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        """,
        """
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT true;
        """,
        """
        ALTER TABLE users ADD COLUMN profile_picture_url TEXT;
        """,
        """
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        """,
        """
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
        """,
        
        # Create social_accounts table
        """
        CREATE TABLE social_accounts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_user_id TEXT NOT NULL,
            provider_email TEXT,
            provider_username TEXT,
            provider_name TEXT,
            raw_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(provider, provider_user_id)
        );
        """,
        
        # Create indexes
        """
        CREATE INDEX idx_users_is_active ON users(is_active);
        """,
        """
        CREATE INDEX idx_users_last_login ON users(last_login);
        """,
        """
        CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
        """,
        """
        CREATE INDEX idx_social_accounts_provider ON social_accounts(provider);
        """,
    ]
    
    with engine.connect() as conn:
        for i, migration in enumerate(migrations, 1):
            try:
                logger.info("Running migration {}/{}".format(i, len(migrations)))
                conn.execute(text(migration))
                conn.commit()
                logger.info("Migration {} completed successfully".format(i))
            except Exception as e:
                logger.error("Migration {} failed: {}".format(i, e))
                # Check if it's a "column already exists" error (safe to ignore)
                if "already exists" in str(e).lower():
                    logger.info("Migration {} skipped (already applied)".format(i))
                    continue
                else:
                    raise

if __name__ == "__main__":
    migrate_database()
    print("Database migration completed!")