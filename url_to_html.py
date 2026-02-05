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
    print('Querying SPARQL endpoint:', endpoint)
    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)
    results = {}
    try:
        results = sparql.query().convert()
        return results
    except Exception as e:
        print('ERROR for ', endpoint, e, query)
        return results


def fill_text(results, content):
    vars = results['head']['vars']
    bindings = results['results']['bindings'][0]
    for var in vars:
        binding = bindings.get(var)
        if binding is None:
            content = ''
            break
        var_value = _normalize_temporal_value(binding, var)
        if len(var_value) > 0:
            content = content.replace('<<<' + var + '>>>', var_value)
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


_TEMPORAL_KEYWORDS = (
    '#date', '#datetime', '#time', '#gyear', '#gyearmonth',
    'xmlschema#date', 'xmlschema#datetime', 'xmlschema#time'
)
_EDTF_KEYWORDS = ('edtf', 'extended')
_END_FIELD_HINTS = ('end', 'finish', 'to', 'latest', 'upper', 'stop')
_EDTF_YEAR_RE = re.compile(r'^Y([+-]?\d+)(?:[-/T ].*)?$', flags=re.IGNORECASE)
_SIGNED_YEAR_RE = re.compile(r'^([+-]?\d+)(?:[-/T ].*)?$')


def _strip_literal_wrappers(value: str) -> str:
    stripped = value.strip()
    if '^^' in stripped:
        stripped = stripped.split('^^', 1)[0].strip()
    if (stripped.startswith('"') and stripped.endswith('"')) or (stripped.startswith("'") and stripped.endswith("'")):
        stripped = stripped[1:-1]
    return stripped


def _is_end_field(name: str) -> bool:
    lowered = (name or '').lower()
    return any(h in lowered for h in _END_FIELD_HINTS)


_EDTF_PREFIX_RE = re.compile(r'^Y[+\-]?\d')


def _looks_like_edtf(datatype: str, value: str) -> bool:
    dtype = (datatype or '').lower()
    if any(keyword in dtype for keyword in _EDTF_KEYWORDS):
        return True
    return bool(_EDTF_PREFIX_RE.match(value))


def _binding_is_temporal(binding: Dict[str, Any], value: str) -> bool:
    datatype = (binding.get('datatype') or '').lower()
    if any(keyword in datatype for keyword in _TEMPORAL_KEYWORDS):
        return True
    return _looks_like_edtf(datatype, value)


def _ensure_timezone(value: str) -> str:
    if value.endswith('Z') or re.search(r'[+\-]\d{2}:?\d{2}$', value):
        return value
    return value + 'Z'


def _append_missing_time(value: str, is_end: bool) -> str:
    suffix = 'T23:59:59Z' if is_end else 'T00:00:00Z'
    return value + suffix


def _normalize_temporal_value(binding: Dict[str, Any], var_name: str = '') -> str:
    if not isinstance(binding, dict):
        return binding
    raw_value = binding.get('value', '')
    if not isinstance(raw_value, str):
        return raw_value
    sanitized = _strip_literal_wrappers(raw_value)
    if not sanitized:
        return sanitized
    if not _binding_is_temporal(binding, sanitized):
        return sanitized
    datatype = binding.get('datatype') or ''
    if _looks_like_edtf(datatype, sanitized):
        if 'T' not in sanitized:
            return _append_missing_time(sanitized, _is_end_field(var_name))
        return _ensure_timezone(sanitized)
    if 'T' in sanitized:
        return _ensure_timezone(sanitized)
    return _append_missing_time(sanitized, _is_end_field(var_name))


def _extract_year_number(value: Any) -> Any:
    if value is None:
        return None
    raw_val = value
    if isinstance(value, dict):
        raw_val = value.get('value')
    if raw_val is None:
        return None
    sanitized = _strip_literal_wrappers(str(raw_val))
    if not sanitized:
        return None
    m = _EDTF_YEAR_RE.match(sanitized)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    m = _SIGNED_YEAR_RE.match(sanitized)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    return None


def _to_snake_case(name: str) -> str:
    if not name:
        return ''
    # Convert camelCase/PascalCase to snake_case
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    snake = re.sub('([a-z0-9])([A-Z])', r'\1_\2',
                   s1).replace('__', '_').lower()
    return snake


def _to_camel_case(name: str) -> str:
    if not name:
        return ''
    if '_' not in name:
        return name[0].lower() + name[1:] if name else name
    parts = [p for p in name.split('_') if p]
    if not parts:
        return ''
    first = parts[0].lower()
    rest = ''.join(p.capitalize() for p in parts[1:])
    return first + rest


def _store_year_variants(row: Dict[str, Any], field_name: str, year_value: Any) -> None:
    if year_value is None:
        return
    keys = set()
    snake = _to_snake_case(field_name)
    camel = _to_camel_case(field_name)
    if snake:
        keys.add(f'{snake}_year')
    if camel:
        keys.add(f'{camel}Year')
    # Also keep direct suffix without conversion when useful
    keys.add(f'{field_name}_year')
    keys.add(f'{field_name}Year')
    for key in keys:
        if key and key not in row:
            row[key] = year_value


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
            binding_val = b.get(name, {})
            raw = _normalize_temporal_value(binding_val, name)
            row[name] = _coerce_value(raw, col['type'])
            year_number = _extract_year_number(binding_val)
            if year_number is None and isinstance(raw, str):
                year_number = _extract_year_number(raw)
            _store_year_variants(row, name, year_number)
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
    print('Processing complex_response with args:', request_args)
    entity_ids = collect_uris(request_args)
    primary_item_uri = entity_ids.get('uri1')
    if not primary_item_uri and entity_ids:
        primary_item_uri = next(iter(entity_ids.values()), '')

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
        print(query)
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
                block_dict['title'] = title
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
            if primary_item_uri:
                block_dict['item_uri'] = primary_item_uri
            # No HTML content for data_viz here; canvas is created in the template

        else:
            # Unknown type: keep as empty content
            block_dict['content'] = ''

        blocks[block] = block_dict
    content_dict['dynamic_elements'] = blocks
    return content_dict


def join_text_blocks(content_dict):
    """Join text block contents into a single plain-text response."""
    if not isinstance(content_dict, dict):
        return ''
    dynamic_elements = content_dict.get('dynamic_elements')
    if not isinstance(dynamic_elements, dict):
        return ''
    parts = []
    for _, block in dynamic_elements.items():
        if isinstance(block, dict) and block.get('type') == 'text':
            content = block.get('content', '')
            if isinstance(content, str) and content.strip():
                parts.append(content.strip())
    return '\n\n'.join(parts)
