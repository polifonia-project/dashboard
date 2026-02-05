---
component-id: melody-software
type: WebApplication
name: MELODY
description: MELODY is a dashboarding system for designing and publishing data stories based on Linked Open Data.
work-package:
- WP1
project: polifonia-project
resource: https://github.com/polifonia-project/dashboard/releases
demo: https://projects.dharc.unibo.it/melody/
release-date: 2022/05/12
release-number: v0.1.1
release-link: https://github.com/polifonia-project/dashboard/releases/tag/v0.1.1
doi: 10.5281/zenodo.6637345
changelog: https://github.com/polifonia-project/dashboard/releases/latest
licence:
- IscLicense
contributors:
- Marilena Daquino <https://github.com/marilenadaquino>
- Giulia Renda <https://github.com/mondoboia>
related-components:
- serves: 
  - broadcast-concerts-knowledge-graph
  - led
  - meetups-knowledge-graph
  - musicbo-knowledge-graph
  - bells-knowledge-graph
  - musow-dataset
- documentation:
  - melody-prototypes
bibliography:
- main-publication:"Giulia Renda, Marilena Daquino, and Valentina Presutti (2023). Melody: A Platform for Linked Open Data Visualisation and Curated Storytelling. In Proceedings of the 34th ACM Conference on Hypertext and Social Media (HT '23). Association for Computing Machinery, New York, NY, USA, Article 27, 1–8. https://doi.org/10.1145/3603163.3609035"
- publication:
  - "Giulia Renda, Marilena Daquino (2023). Storytelling with Linked Open Data. In La memoria digitale: forme del testo e organizzazione della conoscenza. Atti del XII Convegno Annuale AIUCD. Siena: Università degli Studi di Siena. https://zenodo.org/doi/10.5281/zenodo.8070707"
---


# Polifonia Dashboard

[![DOI](https://zenodo.org/badge/431529042.svg)](https://zenodo.org/badge/latestdoi/431529042)

MELODY - Make mE a Linked Open Data StorY is a dashboarding system that allows users familiar with Linked Open Data to create web-ready data stories.

 * Authenticate with GitHub to create a new story.
 * Access data from any SPARQL endpoint.
 * Select the layout template of your story.
 * Include charts, sections, filters, and descriptions.
 * Preview the final data story while creating it.
 * Embed or export your data story and single charts in several formats.

See the full documentation at https://polifonia-project.github.io/dashboard/.

## MELODY API (lightweight)

MELODY exposes a lightweight HTTP API that returns either a simple text response
or a full "data story" payload rendered by a template. It is useful for quickly
embedding a single text block, a small visualization, or a complete story in
external applications.

### Endpoint

```
GET /melody/api
POST /melody/api
```

### What you can do

1. Run a SPARQL query and inject values into a text template.
2. Return text, JSON, or HTML depending on your integration needs.
3. Provide a full "complex" configuration to build multi-block responses
   (text + charts) and optionally supply your own CSS/JS.

### Response formats

- Simple request (no `config_file`)
  - `format=html`: returns the filled text as `text/html` (no wrapper template).
  - Any other value (or no `format`): returns plain text as `text/plain`.

- Complex request (`config_file` provided)
  - `format=json`: returns JSON (the full payload).
  - `format=text`: returns the joined text blocks as `text/plain`.
  - Default (`format=html` or omitted): returns HTML rendered by `api_template.html`.

### Simple request parameters

Required:
- `sparql_endpoint`: SPARQL endpoint URL.
- `query`: SPARQL query string (may include placeholders like `<<<uri1>>>`).
- `content`: template with placeholders (plain text or one or more HTML elements, e.g., `Label: <<<label>>>` or `<h3>Label: <<<label>>></h3>`).
- One or more placeholder values (e.g., `uri1=http://example.org/item/1`).

Optional:
- `format`: `html` | `text` (default is `text` for simple requests).


### Complex request parameters

Required:
- `config_file`: a JSON string or URL to a JSON configuration.

Optional:
- `format`: `html` | `json` | `text` (default is `html` for complex requests).
- Any placeholder values referenced in the config (e.g., `uri1=...`).

Note: `format` and placeholder values are passed as request parameters (outside
the `config_file` JSON).

The `config_file` JSON can define:
- `content` blocks (text and/or data_viz)
- `style` (optional CSS URL)
- `script` (optional JS URL)

### Complex config structure (overview)

A complex config is a JSON object with a top-level `content` map. Each entry is
a block with:
- `type`: `text` or `data_viz`
- `sparql_endpoint`: SPARQL endpoint URL
- `query`: SPARQL query (can include placeholders like `<<<uri1>>>`)
- `content`: for text blocks, a template (plain text or HTML)
- `viz_type` and `encodings`: for data visualization blocks

A full, real-world example is provided in:
`documentation/api_complex_example.json`

Shortened example (first two blocks only):
```json
{
  "content": {
    "01": {
      "type": "text",
      "sparql_endpoint": "http://localhost:3030/chad-kg/sparql",
      "query": "SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1",
      "content": "<h1><<<label>>></h1>"
    },
    "02": {
      "type": "text",
      "sparql_endpoint": "http://localhost:3030/chad-kg/sparql",
      "query": "SELECT ?item ?label WHERE { VALUES ?item {<<<uri1>>>} ?item rdfs:label ?label }",
      "content": "<p>Label: <<<label>>></p>"
    }
  }
}
```

Data visualization block example:
```json
{
  "content": {
    "timeline1": {
      "type": "data_viz",
      "viz_type": "timeline",
      "sparql_endpoint": "http://localhost:3030/chad-kg/sparql",
      "query": "SELECT ?item ?begin ?end WHERE { ?item <http://www.cidoc-crm.org/cidoc-crm/P4_has_time-span> ?ts . ?ts <http://www.cidoc-crm.org/cidoc-crm/P82a_begin_of_the_begin> ?begin ; <http://www.cidoc-crm.org/cidoc-crm/P82b_end_of_the_end> ?end . }",
      "encodings": {
        "item": "item",
        "begin": "begin",
        "end": "end",
        "colors": [
          "#A62176"
        ]
      }
    }
  }
}
```

To call the API, pass `format` and placeholder values outside the config:
```bash
curl -G "http://127.0.0.1:5000/melody/api" \
  --data-urlencode "format=json" \
  --data-urlencode "config_file={...}" \
  --data-urlencode "uri1=http://example.org/item/1"
```

### Examples

Simple request (plain text)
```bash
curl -G "http://127.0.0.1:5000/melody/api" \
  --data-urlencode "sparql_endpoint=http://localhost:3030/chad-kg/sparql" \
  --data-urlencode "query=SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1" \
  --data-urlencode "content=Label: <<<label>>>" \
  --data-urlencode "uri1=http://example.org/item/1"
```

Simple request (HTML response)
```bash
curl -G "http://127.0.0.1:5000/melody/api" \
  --data-urlencode "format=html" \
  --data-urlencode "sparql_endpoint=http://localhost:3030/chad-kg/sparql" \
  --data-urlencode "query=SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1" \
  --data-urlencode "content=<h3>Label: <<<label>>></h3>" \
  --data-urlencode "uri1=http://example.org/item/1"
```

Complex request (HTML by default, custom style/script)
```bash
curl -G "http://127.0.0.1:5000/melody/api" \
  --data-urlencode "config_file={\"style\":\"https://example.org/app.css\",\"script\":\"https://example.org/app.js\",\"content\":{\"block1\":{\"type\":\"text\",\"sparql_endpoint\":\"http://localhost:3030/chad-kg/sparql\",\"query\":\"SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1\",\"content\":\"<h2>Label: <<<label>>></h2>\"}}}" \
  --data-urlencode "uri1=http://example.org/item/1"
```

Complex request (JSON)
```bash
curl -G "http://127.0.0.1:5000/melody/api" \
  --data-urlencode "format=json" \
  --data-urlencode "config_file={\"content\":{\"block1\":{\"type\":\"text\",\"sparql_endpoint\":\"http://localhost:3030/chad-kg/sparql\",\"query\":\"SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1\",\"content\":\"Label: <<<label>>>\"}}}" \
  --data-urlencode "uri1=http://example.org/item/1"
```

Embed in a webpage (iframe)
```html
<iframe
  src="http://127.0.0.1:5000/melody/api?format=html&sparql_endpoint=http%3A%2F%2Flocalhost%3A3030%2Fchad-kg%2Fsparql&query=SELECT%20%3Flabel%20WHERE%20%7B%20%3C%3C%3Curi1%3E%3E%3E%20rdfs%3Alabel%20%3Flabel%20%7D%20LIMIT%201&content=%3Ch3%3ELabel%3A%20%3C%3C%3Clabel%3E%3E%3E%3C%2Fh3%3E&uri1=http%3A%2F%2Fexample.org%2Fitem%2F1"
  width="100%"
  height="300"
  style="border:0;">
</iframe>
```

Embed from another app (fetch + custom rendering)
```js
const params = new URLSearchParams({
  format: "json",
  config_file: JSON.stringify({
    style: "https://example.org/app.css",
    script: "https://example.org/app.js",
    content: {
      block1: {
        type: "text",
        sparql_endpoint: "http://localhost:3030/chad-kg/sparql",
        query: "SELECT ?label WHERE { <<<uri1>>> rdfs:label ?label } LIMIT 1",
        content: "<h2>Label: <<<label>>></h2>"
      }
    }
  }),
  uri1: "http://example.org/item/1"
});

fetch(`/melody/api?${params.toString()}`)
  .then(r => r.json())
  .then(console.log);
```

## Quickstart

> **Step #1 - Get the source code**

- Download the ZIP
- Use GIT tool in the terminal/powershel/bash to clone the source code

> **Step #2 - Set up the environment**

1. Python3 should be installed properly in the workstation. If you are not sure if Python is 
properly installed, please open a terminal and type python --version.
2. Enter the project folder using the terminal/powershel/bash.
3. Install modules using a [Virtual Environment](https://docs.python.org/3/library/venv.html)

```bash

#MacOS/Linux
$ cd myproject
$ python3 -m venv venv
$ . venv/bin/activate

#Windows
> cd myproject
> py -3 -m venv venv
> venv\Scripts\activate
```


> **Step #3 - Install requirements**

`pip install -r requirements.txt`

> **Step #4 - Run the application**
```bash
#bash
$ export FLASK_APP=app
$ flask run
* Running on http://127.0.0.1:5000/

#CMD
> set FLASK_APP=app
> flask run
* Running on http://127.0.0.1:5000/

#Powershell
> $env:FLASK_APP = "app"
> flask run
* Running on http://127.0.0.1:5000/
```

MELODY is part of [Polifonia](https://polifonia-project.eu) H2020 project (described in Deliverable 1.9). Cite this repository as follows:

```
Renda Giulia, and Marilena Daquino. (2022). MELODY: Beta release (v0.1.1). DOI: 10.5281/zenodo.6637346
```
