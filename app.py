from flask import Flask, render_template

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
        return render_template('ui-maps.html')
    else:
        return render_template('page-404.html')


# @app.route("/<string:page_name>")
# def index(page_name):
#     return render_template('index.html', title="page", jsonfile=json.dumps(access_data_sources(page_name)))


##  SPARQL QUERY
#
# ssl._create_default_https_context = ssl._create_unverified_context
# sparql_endpoint = 'https://query.wikidata.org/'
#
# count_01_query = """
# SELECT (COUNT(*) AS ?count)
# WHERE {
#   ?item wdt:P31 wd:Q5 .
# }
# """
#
# # set the endpoint
# sparql_wd = SPARQLWrapper(sparql_endpoint)
# # set the query
# sparql_wd.setQuery(count_01_query)
# # set the returned format
# sparql_wd.setReturnFormat(JSON)
# # get the results
# results = sparql_wd.query().convert()


