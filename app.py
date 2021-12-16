from flask import Flask, render_template, request, url_for

import json

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


@app.route("/<string:page_name>")
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


# @app.route("/<string:page_name>")
# def index(page_name):
#     return render_template('index.html', title="page", jsonfile=json.dumps(access_data_sources(page_name)))
