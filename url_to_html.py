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
        else:
            print('var not n query')
            return False


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
        return results


def fill_text(results, content):
    vars = results['head']['vars']
    bindings = results['results']['bindings'][0]
    for var in vars:
        var_value = bindings[var]['value']
        if len(var_value) > 0:
            content = content.replace(
                '<<<' + var + '>>>', bindings[var]['value'])
        else:
            # content = content.replace('<<<' + var + '>>>', '')
            content = ''
    return content


def simple_response(request_args):
    entity_ids = collect_uris(request_args)
    endpoint = request_args['sparql_endpoint']
    query = request_args['query']
    query = insert_uri_in_query(entity_ids, query)
    if query == False:
        content = ''
    else:
        content = request_args['content']
        results = query_data(endpoint, query)
        content = fill_text(results, content)
    return content


def complex_response(request_args):
    entity_ids = collect_uris(request_args)

    config_file_input = request_args.get('config_file')

    parsed_json = {}

    try:
        if isinstance(config_file_input, str):
            # Check if the config_file_input appears to be a URL
            if config_file_input.strip().startswith("http"):
                # If it's a URL, fetch the content from that URL
                resp = requests.get(config_file_input)
                parsed_json = json.loads(resp.text)
            else:
                # Otherwise, assume it's a raw JSON string passed directly
                parsed_json = json.loads(config_file_input)
        elif isinstance(config_file_input, dict):
            parsed_json = config_file_input
    except json.JSONDecodeError as e:
        return jsonify({"error": "Invalid JSON string", "message": str(e)}), 400

    content_blocks = parsed_json['content']
    content_dict = {}
    if 'style' in parsed_json:
        content_dict['style'] = parsed_json['style']
    blocks = {}
    for block, info in content_blocks.items():
        block_dict = {}
        type = info['type']
        endpoint = info['sparql_endpoint']
        query = info['query']
        query = insert_uri_in_query(entity_ids, query)
        if query == False:
            content = ''
        else:
            content = info['content']
            results = query_data(endpoint, query)
            if type == 'text':
                if len(results) == 0 or len(results['results']['bindings']) == 0:
                    content = ''
                else:
                    content = fill_text(results, content)
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

        block_dict['content'] = content
        blocks[block] = block_dict
    content_dict['dynamic_elements'] = blocks
    return content_dict
