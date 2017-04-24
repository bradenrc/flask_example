from sqlite3 import dbapi2 as sqlite3

def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect('flaskr.db')
    rv.row_factory = sqlite3.Row
    return rv


def init_db():
    """Initializes the database."""
    db = get_db()
    with open('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()


def get_db():
    sqlite_db = connect_db()
    return sqlite_db


init_db()