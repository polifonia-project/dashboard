from SPARQLWrapper import SPARQLWrapper, JSON
import json
import requests
from flask import jsonify
from typing import Dict, List, Tuple, Any
import re


def collect_uris(request_args):
    entity_ids = {}
    for arg in request_args:
        if 'uri' in arg:
            entity_ids[arg] = request_args[arg]
    return entity_ids


def insert_uri_in_query(entity_ids, query):
    """Replace placeholder tokens <<<var>>> with <URI> when provided.

    Behavior:
    - If the query has no placeholders, return it unchanged (supports data_viz without restriction).
    - If placeholders exist, all must be provided in entity_ids; otherwise return False.
    - Replace all placeholders found with corresponding URIs.
    """
    # Find all placeholder variable names in the query
    placeholders = set(re.findall(r"<<<([^>]+)>>>", query))

    # No placeholders: nothing to do
    if not placeholders:
        return query

    # Ensure all placeholders have corresponding values
    missing = [name for name in placeholders if name not in entity_ids]
    if missing:
        print('Missing URI(s) for placeholder(s):', ', '.join(missing))
        return False

    # Perform replacements for all placeholders
    for name in placeholders:
        uri = entity_ids[name]
        query = query.replace(f'<<<{name}>>>', f'<{uri}>')

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


def _is_number(value: str) -> bool:
    try:
        float(value)
        return True
    except Exception:
        return False


def _infer_type(value: str) -> str:
    # Simple inference: number or string
    return 'number' if _is_number(value) else 'string'


def _coerce_value(value: str, inferred_type: str) -> Any:
    if inferred_type == 'number':
        try:
            # Prefer int when possible, else float
            as_float = float(value)
            if as_float.is_integer():
                return int(as_float)
            return as_float
        except Exception:
            return value
    return value


def _build_table_from_results(results: Dict, selected_vars: List[str] = None) -> Tuple[List[Dict], List[Dict]]:
    """Build a normalized columns/rows table from SPARQL JSON results.

    Args:
        results: SPARQLWrapper JSON
        selected_vars: optional subset/order of variables to include

    Returns:
        (columns, rows)
    """
    if not results or 'head' not in results or 'results' not in results:
        return [], []

    vars_list = results['head'].get('vars', [])
    if selected_vars:
        vars_list = [v for v in selected_vars if v in vars_list]

    bindings = results['results'].get('bindings', [])
    if not bindings:
        # No rows, but still return columns based on selected vars
        columns = [{'name': v, 'type': 'string'} for v in vars_list]
        return columns, []

    # Infer types from first row
    first = bindings[0]
    columns = []
    for v in vars_list:
        val = first.get(v, {}).get('value', '')
        inferred = _infer_type(val)
        columns.append({'name': v, 'type': inferred})

    # Build rows with coerced values
    rows = []
    for b in bindings:
        row = {}
        for col in columns:
            name = col['name']
            raw = b.get(name, {}).get('value', '')
            row[name] = _coerce_value(raw, col['type'])
        rows.append(row)

    return columns, rows


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
    # Add optional assets only if non-empty strings
    style_val = parsed_json.get('style')
    if isinstance(style_val, str) and style_val.strip():
        content_dict['style'] = style_val
    script_val = parsed_json.get('script')
    if isinstance(script_val, str) and script_val.strip():
        content_dict['script'] = script_val
    blocks = {}
    for block, info in content_blocks.items():
        block_dict = {}
        block_type = info.get('type')
        endpoint = info.get('sparql_endpoint')
        query = info.get('query', '')
        query = insert_uri_in_query(entity_ids, query)
        results = {}
        content = ''
        if query is not False and endpoint:
            results = query_data(endpoint, query)

        if block_type == 'text':
            content = info.get('content', '')
            if not results or not results.get('results', {}).get('bindings'):
                content = ''
            else:
                content = fill_text(results, content)
            block_dict['content'] = content

        elif block_type == 'data_viz':
            viz_type = info.get('viz_type', 'table')
            # Accept both 'encoding' and 'encodings' keys from config
            _encoding_single = info.get('encoding')
            _encoding_plural = info.get('encodings')
            encoding = _encoding_single or _encoding_plural
            title = info.get('title')
            x_label = info.get('xLabel')
            y_label = info.get('yLabel')

            errors = []
            columns: List[Dict] = []
            rows: List[Dict] = []
            meta: Dict[str, Any] = {}

            if title:
                meta['title'] = title
            if x_label:
                meta['xLabel'] = x_label
            if y_label:
                meta['yLabel'] = y_label

            if results and results.get('head') and results.get('results'):
                vars_in_result = results['head'].get('vars', [])

                if isinstance(encoding, dict) and len(encoding) > 0:
                    # Validate encoding vars exist in results
                    used_vars = []
                    for role, var_name in encoding.items():
                        # Some encodings may be non-string (e.g., colors arrays); include only string var names
                        if isinstance(var_name, str):
                            if var_name not in vars_in_result:
                                errors.append(
                                    f"Encoding var '{var_name}' not in result set")
                            else:
                                used_vars.append(var_name)
                    if errors:
                        # Fall back to a table view
                        columns, rows = _build_table_from_results(results)
                        viz_kind = 'table'
                    else:
                        columns, rows = _build_table_from_results(
                            results, used_vars)
                        viz_kind = viz_type
                        # Echo back the same encoding key as provided by the config
                        if _encoding_single is not None:
                            block_dict['encoding'] = encoding
                        elif _encoding_plural is not None:
                            block_dict['encodings'] = encoding
                else:
                    # No encoding provided: return table
                    columns, rows = _build_table_from_results(results)
                    viz_kind = 'table'
            else:
                # Empty or failed query: default empty dataset
                viz_kind = viz_type if isinstance(
                    encoding, dict) and len(encoding) > 0 else 'table'
                meta['empty'] = True

            if errors:
                meta['errors'] = errors

            block_dict.update({
                'type': 'data_viz',
                'viz_type': viz_kind,
                'columns': columns,
                'rows': rows,
                'meta': meta
            })
            # Provide content from configuration when present; else an HTML canvas placeholder
            cfg_content = info.get('content')
            if isinstance(cfg_content, str) and cfg_content.strip():
                block_dict['content'] = cfg_content
            else:
                block_dict['content'] = f"<canvas id='{block}'></canvas>"

        else:
            # Unknown type: keep as empty content
            block_dict['content'] = ''

        blocks[block] = block_dict
    content_dict['dynamic_elements'] = blocks
    return content_dict
