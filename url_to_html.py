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


def query_data(endpoint, query):
    sparql = SPARQLWrapper(endpoint)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = {}
    try:
        results = sparql.query().convert()
        return results
    except Exception as e:
        print('ERROR for ', endpoint, e)
        return '<p>Impossible to retrieve information.</p>'


def fill_text_html(results, html_content):
    vars = results['head']['vars']
    bindings = results['results']['bindings'][0]
    for var in vars:
        var_value = bindings[var]['value']
        if len(var_value) > 0:
            html_content = html_content.replace(
                '<<<' + var + '>>>', bindings[var]['value'])
        else:
            html_content = html_content.replace('<<<' + var + '>>>', '')
    return html_content


def simple_response(request_args):
    entity_ids = collect_uris(request_args)
    endpoint = request_args['sparql_endpoint']
    query = request_args['query']
    query = insert_uri_in_query(entity_ids, query)
    html_content = request_args['html_content']
    results = query_data(endpoint, query)
    html_content = fill_text_html(results, html_content)
    return html_content


def complex_response(request_args):
    entity_ids = collect_uris(request_args)

    config_file_url = request_args['config_file']

    parsed_json = {}
    # Parse the raw JSON string
    try:
        resp = requests.get(config_file_url)
        parsed_json = json.loads(resp.text)
        content_blocks = parsed_json['content']
        content_dict = {}
        content_dict['style'] = parsed_json['style']
        blocks = {}
        for block, info in content_blocks.items():
            block_dict = {}
            type = info['type']
            endpoint = info['sparql_endpoint']
            query = info['query']
            query = insert_uri_in_query(entity_ids, query)
            html_content = info['html_content']
            results = query_data(endpoint, query)
            if type == 'text':
                html_content = fill_text_html(results, html_content)
            if type == 'data_viz':
                viz_type = info['viz_type']
                if viz_type == 'histogram':
                    data = {}
                    vars = results['head']['vars']
                    # Assume the first variable is the key and the second is the value
                    key_var = vars[0]
                    value_var = vars[1]
                    for result in results["results"]["bindings"]:
                        key = result[key_var]["value"]
                        value = int(result[value_var]["value"])
                        data[key] = value
                    block_dict['data'] = data

            block_dict['html_content'] = html_content
            blocks[block] = block_dict
        content_dict['blocks'] = blocks
        return content_dict
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON string", "message": str(e)}), 400
