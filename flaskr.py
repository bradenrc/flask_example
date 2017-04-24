# -*- coding: utf-8 -*-
import os
from sqlite3 import dbapi2 as sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash
import urllib3, requests, json, os


app = Flask(__name__)

# Load default config and override config from an environment variable
app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'flaskr.db'),
    DEBUG=True,
    SECRET_KEY='development key',
    USERNAME='admin',
    PASSWORD='default'
))
app.config.from_envvar('FLASKR_SETTINGS', silent=True)



"""
    All of the watson API pieces are in the function below
"""
def predict_purchase(gender, age, marital, job):
    id = "09171b0e-d473-4f0e-9d11-73bcd330ca67"
    version = "https://ibm-watson-ml.mybluemix.net/v2/artifacts/models/09171b0e-d473-4f0e-9d11-73bcd330ca67/versions/7e684513-a525-4510-90d5-a87ba6d22ab7"

    service_path = 'https://ibm-watson-ml.mybluemix.net'
    username = "35f91983-2730-4f14-8f4c-b821bf7c4c5a"
    password = "babcc6ca-c50e-414a-8cc3-535afb5f1fb8"

    headers = urllib3.util.make_headers(basic_auth='{}:{}'.format(username, password))
    url = '{}/v2/identity/token'.format(service_path)
    response = requests.get(url, headers=headers)
    mltoken = json.loads(response.text).get('token')

    header_online = {'Content-Type': 'application/json', 'Authorization': mltoken}
    scoring_href = "https://ibm-watson-ml.mybluemix.net/32768/v2/scoring/2080"

    # gender = "M"
    # age = 55
    # marital = "Single"
    # job = "Executive"

    age = int(age)
    payload_scoring = {"record":[gender, age, marital, job]}

    response_scoring = requests.put(scoring_href, json=payload_scoring, headers=header_online)
    result = response_scoring.text
    return result



def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv


def init_db():
    """Initializes the database."""
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()


def get_db():
    """Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db


@app.teardown_appcontext
def close_db(error):
    """Closes the database again at the end of the request."""
    if hasattr(g, 'sqlite_db'):
        g.sqlite_db.close()


@app.route('/wapi')
def show_wapi():
    db = get_db()
    cur = db.execute('select name, gender, marital, age, job, plabel, ppred from wapi order by id desc')
    results = cur.fetchall()
    return render_template('wapi.html', results=results)

@app.route('/wapi_add', methods=['POST'])
def add_result():
    name = request.form['name']
    gender = request.form['gender']
    married = request.form['married']
    age = request.form['age']
    job = request.form['job']
    result = json.loads(predict_purchase(gender, age, married, job))

    plabel = result['result']['predictedLabel']
    ppred = result['result']['prediction']

    db = get_db()
    db.execute('insert into wapi (name, gender, marital, age, job, plabel, ppred) values (?, ?, ?, ?, ?, ?, ?)',
               [name, gender, married, age, job, plabel, ppred])
    db.commit()
    flash('New entry was successfully posted')
    return redirect(url_for('show_wapi'))


@app.route('/')
def show_entries():
    db = get_db()
    cur = db.execute('select title, text from entries order by id desc')
    entries = cur.fetchall()
    return render_template('show_entries.html', entries=entries)

@app.route('/add', methods=['POST'])
def add_entry():
    if not session.get('logged_in'):
        abort(401)
    db = get_db()
    db.execute('insert into entries (title, text) values (?, ?)',
               [request.form['title'], request.form['text']])
    db.commit()
    flash('New entry was successfully posted')
    return redirect(url_for('show_entries'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != app.config['USERNAME']:
            error = 'Invalid username'
        elif request.form['password'] != app.config['PASSWORD']:
            error = 'Invalid password'
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('show_entries'))
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('show_entries'))


port = os.getenv('PORT', '5000')
if __name__ == "__main__":
	app.run(host='0.0.0.0', port=int(port))
