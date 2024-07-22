from SPARQLWrapper import SPARQLWrapper, JSON


def simple_response(request_args):
    entity_ids = {}
    for arg in request_args:
        if 'uri' in arg:
            entity_ids[arg] = request_args[arg]
    endpoint = request_args['sparql_endpoint']
    query = request_args['query']
    for var, entity in entity_ids.items():
        if var in query:
            query = query.replace(f'<<<{var}>>>', f'<{entity}>')
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
    pass
