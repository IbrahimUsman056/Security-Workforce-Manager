"""
One-off script to reset every user's password to a new value.
Run from backend/ with venv activated:
    python change_all_passwords.py
"""
from sqlmodel import Session, select
from app.database import engine
from app.core.security import hash_password
from app.models.user import User

NEW_PASSWORD = "sossecurity2468"

def main():
    with Session(engine) as db:
        users = db.exec(select(User)).all()
        new_hash = hash_password(NEW_PASSWORD)

        for user in users:
            user.hashed_password = new_hash
            db.add(user)

        db.commit()
        print(f"Updated password for {len(users)} users to the new password.")

if __name__ == "__main__":
    main()