from statistics import mode
from flask import Flask, render_template, request, url_for

import json

from itsdangerous import exc

# from SPARQLWrapper import SPARQLWrapper, JSON
# import ssl

app = Flask(__name__)


# deal with config file

with open('config.json') as config_form:
    c = json.load(config_form)


def access_data_sources(pilot_name):
    for source, details in c['data_sources'].items():
        if pilot_name == source:
            return details


@app.route("/pilot/<string:page_name>")
def index(page_name):
    details = access_data_sources(page_name)
    template = details['template_mode']
    if template == 'standard':
        title = True
        sub = True
        curator = True
        desc = True
        return render_template('index.html', details=details, title=title, sub=sub, curator=curator, desc=desc)
    elif template == 'alt':
        return render_template('charts.html', details=details)
    else:
        return render_template('page-404.html')


@app.route("/setup", methods=['POST', 'GET'])
def setup():
    if request.method == 'POST':
        try:
            form_data = request.form
            print(form_data)
            with open('config.json') as config_form:
                c = json.load(config_form)
            pilot_name = form_data['pilot']
            pilot_endpoint = form_data['endpoint']
            c['data_sources'][pilot_name]['sparql_endpoint'] = pilot_endpoint
            with open('config.json', 'w') as config_update:
                json.dump(c, config_update)
            # write_to_database(form_data)
            # with open('database.json') as database:
            #     data = json.load(database)
            #     pilot_details = access_data_sources(data['pilot'])
            #     pilot_details['chart'].append(pilot_details)
            return 'form submitted'
        except:
            return 'did not save to database'
    elif request.method == 'GET':
        return render_template('setup.html')
    else:
        return 'something went wrong, try again'


def write_to_database(data):
    with open('database.json', 'w') as database:
        json.dump(data, database)


# @app.route('/submit_form', )
# def submit_form():


# with open('database.json') as database:
#     data = json.load(database)
#     pilot_details = access_data_sources(data['pilot'])
#     print(type(pilot_details['chart']))
