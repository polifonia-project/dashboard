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
        json.dump(json_read, config_update, indent=4)


def access_data_sources(pilot_name, file_name):
    '''
    this function access a specific pilot data in the config file based on its name
    '''
    for source, details in read_json(file_name)['data_sources'].items():
        if pilot_name == source:
            return details


def manage_pilot_data(general_data, file):
    '''
    This function deals with pilot data after the submission of the form
    '''
    # get data and add to existing pilot instance in config
    # transform ImmutableMultiDict into regular dict
    form_data = request.form.to_dict(flat=True)
    pilot_title = form_data['title']

    dynamic_elements = []
    position_set = set()

    for source, pilot_data in general_data['data_sources'].items():
        # with the title we check where to insert data
        if pilot_data['title'] == pilot_title:
            # we create a set with the positions of the elements' type
            for k, v in form_data.items():
                if '__' in k:
                    position_set.add(int(k.split('__')[0]))
                else:
                    pilot_data[k] = v
            # we create as many dicts as there are positions, to store each type of element and append to
            # dynamic_elements list
            for position in position_set:
                elements_dict = {}
                elements_dict['position'] = position
                for k, v in form_data.items():
                    if '__' in k:
                        if position == int(k.split('__')[0]):
                            if 'text' in k:
                                elements_dict['type'] = 'text'
                                elements_dict[k.split('__')[1]] = v
                            elif 'count' in k:
                                elements_dict['type'] = 'count'
                                elements_dict[k.split('__')[1]] = v
                            elif 'chart' in k:
                                elements_dict['type'] = 'chart'
                                elements_dict[k.split('__')[1]] = v
                dynamic_elements.append(elements_dict)

            pilot_data['dynamic_elements'] = dynamic_elements
    update_json(file, general_data)
    pilot_name = pilot_title.lower().replace(" ", "_")
    return pilot_name

# access the welcome page


@app.route("/")
@app.route("/index.html")
def welcome():
    general_data = read_json('config.json')
    return render_template('index.html', general_data=general_data)


# access any pilot page


@app.route("/pilot/<string:pilot_name>")
def pilot(pilot_name):
    '''
    opens the config file, checks if pilot_name is inside data_sources and returns its page with the data(pilot_data)
    to be displayed.
    '''
    general_data = read_json('config.json')
    pilot_data = access_data_sources(pilot_name, 'config.json')
    if pilot_data:
        return render_template('pilot.html', pilot_data=pilot_data, general_data=general_data)
    else:
        return render_template('page-404.html')


@app.route("/setup", methods=['POST', 'GET'])
def setup():
    general_data = read_json('config.json')
    if request.method == 'GET':
        template_data = []
        for item in general_data['templates']:
            template_data.append(general_data['templates'][item])
        return render_template('setup.html', template_data=template_data, general_data=general_data)
    elif request.method == 'POST':
        try:
            # get data
            form_data = request.form
            template_mode = form_data['template_mode']
            pilot_title = form_data['title']
            pilot_endpoint = form_data['sparql_endpoint']
            color_code = ''
            for item in general_data['templates']:
                if general_data['templates'][item]['name'] == template_mode:
                    color_code = general_data['templates'][item]['default_color']
            # create new pilot instance
            new_pilot = {}
            new_pilot['sparql_endpoint'] = pilot_endpoint
            new_pilot['template_mode'] = template_mode
            new_pilot['title'] = pilot_title
            new_pilot['color_code'] = color_code
            # add to config file
            clean_title = pilot_title.lower().replace(" ", "_")
            general_data['data_sources'][clean_title] = new_pilot
            update_json('config.json', general_data)
            general_data = read_json('config.json')
            pilot_data = access_data_sources(clean_title, 'config.json')
            # the correct template opens based on the name
            return render_template(template_mode+'.html', pilot_data=pilot_data, general_data=general_data)
        except:
            return 'did not save to database'
    else:
        return 'something went wrong, try again'


@app.route("/send_data", methods=['POST', 'GET'])
def send_data():
    general_data = read_json('config.json')
    if request.method == 'POST':
        try:
            pilot_name = manage_pilot_data(general_data, 'config.json')
            return redirect(url_for('pilot', pilot_name=pilot_name))
        except:
            return 'Something went wrong'


@app.route("/modify/<string:pilot_name>", methods=['POST', 'GET'])
def modify_pilot(pilot_name):
    pilot_data = access_data_sources(pilot_name, 'config.json')
    general_data = read_json('config.json')
    if request.method == 'GET':
        return render_template('modify_pilot.html', pilot_data=pilot_data, general_data=general_data)
    elif request.method == 'POST':
        try:
            pilot_name = manage_pilot_data(general_data, 'config.json')
            return redirect(url_for('pilot', pilot_name=pilot_name))
        except:
            return 'Something went wrong'
