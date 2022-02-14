from itertools import count
from statistics import mode
from flask import Flask, render_template, request, url_for, redirect

import json

from itsdangerous import exc

# from SPARQLWrapper import SPARQLWrapper, JSON
# import ssl

app = Flask(__name__)


def read_json(file_name):
    '''
    open and read json file
    '''
    with open(file_name) as config_form:
        data = json.load(config_form)
        return data


def update_json(file_name, json_read):
    '''
    update and dump json file
    '''
    with open(file_name, 'w') as config_update:
        json.dump(json_read, config_update)


def access_data_sources(pilot_name, file_name):
    '''
    this function access a specific pilot data in the config file based on its name
    '''
    for source, details in read_json(file_name)['data_sources'].items():
        if pilot_name == source:
            return details

# access the welcome page


@app.route("/")
@app.route("/index.html")
def welcome():
    return render_template('index.html')

# access any pilot page


@app.route("/pilot/<string:pilot_name>")
def pilot(pilot_name):
    '''
    opens the config file, checks if pilot_name is inside data_sources and returns its page with the data(pilot_data)
    to be displayed.
    '''
    pilot_data = access_data_sources(pilot_name, 'config.json')
    if pilot_data:
        return render_template('pilot.html', pilot_data=pilot_data)
    else:
        return render_template('page-404.html')


@app.route("/setup", methods=['POST', 'GET'])
def setup():
    c = read_json('config.json')
    if request.method == 'GET':
        template_data = []
        for item in c['templates']:
            template_data.append(c['templates'][item])
        return render_template('setup.html', template_data=template_data)
    elif request.method == 'POST':
        try:
            # get data
            form_data = request.form
            template_mode = form_data['template_mode']
            pilot_title = form_data['title']
            pilot_endpoint = form_data['sparql_endpoint']
            color_code = ''
            for item in c['templates']:
                if c['templates'][item]['name'] == template_mode:
                    color_code = c['templates'][item]['default_color']
            # create new pilot instance
            new_pilot = {}
            new_pilot['sparql_endpoint'] = pilot_endpoint
            new_pilot['template_mode'] = template_mode
            new_pilot['title'] = pilot_title
            new_pilot['color_code'] = color_code
            # add to config file
            clean_title = pilot_title.lower().replace(" ", "_")
            c['data_sources'][clean_title] = new_pilot
            update_json('config.json', c)
            pilot_data = access_data_sources(clean_title, 'config.json')
            # the correct template opens based on the name
            return render_template(template_mode+'.html', pilot_data=pilot_data)
        except:
            return 'did not save to database'
    else:
        return 'something went wrong, try again'


@app.route("/send_data", methods=['POST', 'GET'])
def send_data():
    c = read_json('config.json')
    if request.method == 'POST':
        try:
            # get data and add to existing pilot instance in config
            # transform ImmutableMultiDict into regular dict
            form_data = request.form.to_dict(flat=True)
            print(form_data)
            pilot_title = form_data['title']
            text_dict = {}
            query_list = []
            label_list = []
            count_list = []
            for source, pilot_data in c['data_sources'].items():
                # with the title we check where to insert data
                if pilot_data['title'] == pilot_title:
                    for k, v in form_data.items():
                        if "text" in k:
                            text_dict[k] = v
                        elif "query" in k:
                            query_list.append((k, v))
                        elif "label" in k:
                            label_list.append((k, v))
                        else:
                            pilot_data[k] = v

                    for q in query_list:
                        count_dict = {}
                        for l in label_list:
                            if q[0][:2] == l[0][:2]:
                                count_dict['query'] = q[1]
                                count_dict['label'] = l[1]
                                count_list.append(count_dict)
                    pilot_data['text'] = text_dict
                    pilot_data['count'] = count_list
            update_json('config.json', c)
            pilot_name = pilot_title.lower().replace(" ", "_")
            return redirect(url_for('pilot', pilot_name=pilot_name))
        except:
            return 'Something went wrong'
