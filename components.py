import bleach

def clean_text(v):
    bleach.clean(v,
        tags=['h2', 'h3', 'p', 'em', 'i', 'u', 'strong', 'b', 'li', 'ul', 'ol', 'a'],
        attributes=['href'],strip=True)
    v = v.replace('<p><br></p>','')
    return v

components = [
    {
        "name":"text",
        "regex_attr": "(text(?!search))",
        "value_type": "string",
        "postprocess_value": 'clean_text'
    },
    {
        "name":"textsearch",
        "regex_attr": "(textsearch(?!_col_))",
        "value_type": "string",
        "postprocess_value": ""
    },
    {
        "name":"textsearch",
        "regex_attr": "(textsearch_col_)",
        "value_type": "dict",
        "regex_key": "textsearch_col_(.+)_action_",
        "list_value": "true",
        "postprocess_value": ""
    },
    {
        "name":"count",
        "regex_attr": "(count)",
        "value_type": "string",
        "postprocess_value": ""
    },
    {
        "name":"chart",
        "regex_attr": "(chart(?!_label))",
        "value_type": "string",
        "postprocess_value": ""
    },
    {
        "name":"chart_legend",
        "type":"subcomponent",
        "regex_attr": "(chart_label)",
        "value_type": "dict",
        "regex_key": "chart_label_(.)",
        "postprocess_value": ""
    },
    {
        "name":"table",
        "regex_attr": "(table_)",
        "value_type": "string",
        "postprocess_value":""
    },
    {
        "name":"action",
        "regex_attr": "(action)",
        "value_type": "string",
        "postprocess_value":""
    },
    {
        "name":"map",
        "regex_attr": "(map(?!_filter))",
        "value_type": "string",
        "postprocess_value":""
    },
    {
        "name":"map_filters",
        "regex_attr": "(map_filter)",
        "donothing": True
    },
    {
        "name":"operations",
        "regex_attr": "(operation)",
        "donothing": True
    },
    {
        "name":"extra_queries",
        "regex_attr": "(extra)",
        "donothing": True
    },
    {
        "name":"section_title",
        "regex_attr": "(section_title)",
        "value_type": "string",
        "postprocess_value":""
    }
]
