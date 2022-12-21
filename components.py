import bleach

v = ''

components = [
    {
        "name":"text",
        "regex_attr": "(text(?!search))",
        "value_type": "string",
        "postprocess_value": bleach.clean(v,
            tags=['h2', 'h3', 'p', 'em', 'u', 'strong', 'li', 'ul', 'ol', 'a'],
            attributes=['href'])
    },
    {
        "name":"textsearch",
        "regex_attr": "(textsearch)",
        "value_type": "string",
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
        "name":"tablevalueaction",
        "regex_attr": "(tablevalueaction)",
        "value_type": "string",
        "postprocess_value":""
    },
    {
        "name":"tablecomboaction",
        "regex_attr": "(tablecomboaction)",
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
        "name":"map_filter",
        "regex_attr": "(map_filter)",
        "value_type": "string",
        "postprocess_value":""
    },
    {
        "name":"operations",
        "regex_attr": "(action)",
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
