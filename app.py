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
    with open('config.json') as config_form:
        c = json.load(config_form)
    if request.method == 'GET':
        template_data = []
        for item in c['templates']:
            template_data.append(c['templates'][item])
        return render_template('setup.html', template_data=template_data)
    elif request.method == 'POST':
        try:
            # get data
            form_data = request.form
            template_mode = form_data['template_mode']
            pilot_title = form_data['title']
            pilot_endpoint = form_data['sparql_endpoint']
            # create new pilot instance
            new_pilot = {}
            new_pilot['sparql_endpoint'] = pilot_endpoint
            new_pilot['template_mode'] = template_mode
            new_pilot['title'] = pilot_title
            # add to config file
            c['data_sources'][pilot_title.lower().replace(" ", "_")] = new_pilot
            print(c['data_sources'])
            with open('config.json', 'w') as config_update:
                json.dump(c, config_update)
            return 'form submitted'
        except:
            return 'did not save to database'
    else:
        return 'something went wrong, try again'


def write_to_database(data):
    with open('database.json', 'w') as database:
        json.dump(data, database)
