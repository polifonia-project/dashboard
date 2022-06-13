# Polifonia Dashboard

[![DOI](https://zenodo.org/badge/431529042.svg)](https://zenodo.org/badge/latestdoi/431529042)


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
running-instance:
credits:
  - Giulia Renda, University of Bologna
  - Marilena Daquino, University of Bologna

--- 


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
** To see something, visit http://127.0.0.1:5000/musow

#CMD
> set FLASK_APP=app
> flask run
* Running on http://127.0.0.1:5000/
** To see something, visit http://127.0.0.1:5000/musow

#Powershell
> $env:FLASK_APP = "app"
> flask run
* Running on http://127.0.0.1:5000/
** To see something, visit http://127.0.0.1:5000/musow
```
