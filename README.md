---
component-id: melody
name: melody
description: MELODY is a dashboarding system for designing and publishing data stories based on Linked Open Data.
type: software
release-date: 2022-06-13
release-number: 0.1.1
work-package: WP1
pilot: 
keywords:
  - storytelling
  - linked open data
  - dashboard
licence: ISC
release link: https://github.com/polifonia-project/dashboard/releases/latest
links: 
  - documentation https://polifonia-project.github.io/dashboard/
credits:
  - Giulia Renda, University of Bologna
  - Marilena Daquino, University of Bologna
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
