from SPARQLWrapper import SPARQLWrapper, JSON
import json
import requests
from flask import jsonify


def collect_uris(request_args):
    entity_ids = {}
    for arg in request_args:
        if 'uri' in arg:
            entity_ids[arg] = request_args[arg]
    return entity_ids


def insert_uri_in_query(entity_ids, query):
    for var, entity in entity_ids.items():
        if var in query:
            query = query.replace(f'<<<{var}>>>', f'<{entity}>')
    return query


def simple_response(request_args):
    entity_ids = collect_uris(request_args)
    endpoint = request_args['sparql_endpoint']
    query = request_args['query']
    query = insert_uri_in_query(entity_ids, query)
    html_content = request_args['html_content']

    sparql = SPARQLWrapper(endpoint)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = {}
    try:
        results = sparql.query().convert()
        vars = results['head']['vars']
        bindings = results['results']['bindings'][0]
        for var in vars:
            var_value = bindings[var]['value']
            if len(var_value) > 0:
                html_content = html_content.replace(
                    '<<<' + var + '>>>', bindings[var]['value'])
            else:
                html_content = html_content.replace(
                    '<<<' + var + '>>>', '')
        return html_content
    except Exception as e:
        print('ERROR for ', endpoint, e)
        return '<p>Impossible to retrieve information.</p>'


def complex_response(request_args):
    entity_ids = collect_uris(request_args)

    config_file_url = request_args['config_file']

    # Parse the raw JSON string
    try:
        resp = requests.get(config_file_url)
        parsed_json = json.loads(resp.text)
        print(parsed_json)
        return '<p>Ciao</p>'
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON string", "message": str(e)}), 400
