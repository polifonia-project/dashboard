import json
import re
from flask import request
from datetime import datetime
import requests
import conf
import string
import re
import unidecode
import bleach


def read_json(file_name):
    '''
    Open and read json file.

    Args:
        file_name (str): a string that specifies the name of the json file to read.

    Returns:
        data (dict): a dictionary containing the content of the json file.
    '''
    with open(file_name) as config_form:
        data = json.load(config_form)
        return data


def update_json(file_name, json_read):
    '''
    Update and dump a new json file.

    Args:
        file_name (str): a string that specifies the name of the json file to update.
        json_read (dict): the dictionary that contains data to update the json file.
    '''
    with open(file_name, 'w') as config_update:
        json.dump(json_read, config_update, indent=4)


def new_timestamp():
    '''
    Create a timetstamp.

    Returns:
        tr (float): the timetstamp.
    '''
    dt = datetime.now()
    ts = datetime.timestamp(dt)
    return ts


def access_data_sources(section_name, datastory_name, file_name):
    '''
    This function accesses a specific datastory data in the config file based on its own and section names.

    Args:
        section_name (str): a string that identify the name of the section.
        datastory_name (str): a string that identify the data story name.
        file_name (str): a string that specifies the name of the json file to read.

    Returns:
        data (dict): a dictionary containing the data concerning the requested data story.
    '''
    for source, details in read_json(file_name)['data_sources'][section_name].items():
        if datastory_name == source:
            return details


def add_story_to_config(config_file, form_data, general_data, user_name=None,story_id=None):
    """
    Updates config.json or temp/config_*.json with data about a new data story.

    Args:
        config_file (str): the path to the config json file
        general_data (dict): the current version of config.json as dictionary
        user_name (str): session name if the story is created by external users
        story_id (str): a timestamp if the story is created by external users
    Returns:
        clean_title (str): URL path of the data story
        clean_section (str): URL path of the section
    """
    template_mode = form_data['template_mode']
    datastory_title = form_data['title']
    datastory_endpoint = form_data['sparql_endpoint']
    color_code = ''
    for item in general_data['templates']:
        if general_data['templates'][item]['name'] == template_mode.lower():
            color_code = general_data['templates'][item]['default_color']
    clean_title = clean_string(datastory_title)
    clean_section = None
    section_name = form_data['section_name'] if story_id is None else None
    # create new datastory instance
    new_datastory = {}
    new_datastory['sparql_endpoint'] = datastory_endpoint
    new_datastory['template_mode'] = template_mode
    new_datastory['title'] = datastory_title
    new_datastory['color_code'] = color_code
    if section_name:
        new_datastory['section_name'] = section_name
        clean_section = clean_string(section_name)
        if clean_section in general_data['data_sources']:
            general_data['data_sources'][clean_section][clean_title] = new_datastory
        else:
            general_data['data_sources'][clean_section] = {}
            general_data['data_sources'][clean_section][clean_title] = new_datastory
        update_json(config_file, general_data)
    if user_name and story_id:
        new_datastory['user_name'] = user_name
        new_datastory['id'] = story_id
        update_json(config_file, new_datastory)
    return clean_title, clean_section


def get_correct_config(session,section_name, datastory_name):
    """
    Get the correct config json file according to the user type and the datastory name.
    """
    if session['user_type'] == 'polifonia':
        datastory_data = access_data_sources(
            section_name, datastory_name, 'config.json')
    elif session['user_type'] in ['extra','random']:
        datastory_data = read_json(
            'static/temp/config_'+section_name+'.json')
    return datastory_data

def update_sections_config(general_data):
    """
    Update the list of sections in config.json.

    Args:
        general_data (dict): the current version of config.json as dictionary
    """
    sections = {el['section_name'] for story in general_data['data_sources'].values() for el in story.values()}
    sections_dict = {}
    for s in sections:
        sections_dict[clean_string(s)] = s
    general_data['sections'] = sections_dict
    update_json('config.json', general_data)


def clean_string(dirty_string):
    '''
    This function deals with data story titles to transform them into clean alpha numeric string with no white spaces.

    Args:
        datastory_title (str): a string that can contain any type of character.

    Returns:
        clean_title (str): an alpha numeric string in which white spaces are replaced by '_'.
    '''

    pattern = r'[' + string.punctuation + ']'

    # remove white spaces at beginning and end
    cleaned_string = dirty_string.strip()
    cleaned_string = re.sub(pattern, '', cleaned_string)  # remove special ch
    # remove multiple white spaces
    cleaned_string = unidecode.unidecode(cleaned_string)  # remove accents
    cleaned_string = " ".join(cleaned_string.split())
    cleaned_string = cleaned_string.lower().replace(
        " ", "_")  # lower and replace spaces with '_'
    return cleaned_string


def manage_datastory_data(general_data, file, section_name, datastory_name):
    '''
    This function deals with data story data after the submission of the WYSIWYG form.

    Args:
        general_data (dict): a dictionary containing data of the json fiile.
        file (str): a string that specifies the name of the json file to read.
        section_name (str): a string that identifies the name of the section.
        datastory_name (str): the partial URL that identifies the name of the data story.
    Returns:
        datastory_name (str): a string that identifies the name of the data story.
    '''
    # get data and add to existing datastory instance in config

    # transform ImmutableMultiDict into regular dict
    form_data = request.form.to_dict(flat=True)
    datastory_title = form_data['title']
    datastory_title_clean = clean_string(datastory_title)
    print("datastory_title_clean", datastory_title_clean,
          '\ndatastory_name', datastory_name)
    dynamic_elements = []
    position_set = set()
    color_code_list = []

    # if the title has changed, rename the key
    if datastory_name != datastory_title_clean:
        general_data['data_sources'][section_name][datastory_title_clean] = general_data['data_sources'][section_name].pop(
            datastory_name)

    for name, data in general_data['data_sources'].items():
        if name == section_name:
            for datastory, datastory_data in data.items():
                if datastory == datastory_title_clean:
                    # we fill a set with the positions of the elements' type
                    for k, v in form_data.items():
                        if '__' in k:
                            position_set.add(int(k.split('__')[0]))
                        elif '_color' in k:
                            color_code_list.insert(0, v)
                        else:
                            datastory_data[k] = v
                    datastory_data['color_code'] = color_code_list
                    # we create as many dicts as there are positions, to store each type of element and append to
                    # dynamic_elements list
                    for position in position_set:
                        extra_set = set()
                        operations = []
                        op_list = []
                        elements_dict = {}
                        elements_dict['position'] = position

                        extra_set = set()
                        total_extra_dict = {}  # to store together extra data of one chart
                        extra_queries = []  # to store in separate dict extra data of one chart

                        legend = {}  # data for chart axes labels

                        for k, v in form_data.items():
                            if '__' in k:
                                if position == int(k.split('__')[0]):
                                    if 'text' in k and 'search' not in k:
                                        elements_dict['type'] = 'text'
                                        elements_dict[k.split(
                                            '__')[1]] = bleach.clean(v,
                                                                     tags=[
                                                                         'h2', 'h3', 'p', 'em', 'u', 'strong', 'li', 'ul', 'ol', 'a'],
                                                                     attributes=['href'])
                                    elif 'textsearch' in k:
                                        elements_dict['type'] = 'textsearch'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'count' in k:
                                        elements_dict['type'] = 'count'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'chart' in k and 'label' not in k:
                                        elements_dict['type'] = 'chart'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'chart_label' in k:
                                        key = k.split('__')[1].split('_')[2]
                                        legend[key] = v
                                    elif 'table_' in k:
                                        elements_dict['type'] = 'table'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'tablevalueaction' in k:
                                        elements_dict['type'] = 'tablevalueaction'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'tablecomboaction' in k:
                                        elements_dict['type'] = 'tablecomboaction'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'map' in k and 'simple' not in k and 'filter' not in k:
                                        elements_dict['type'] = 'map'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'map' in k and 'simple' not in k and 'filter' in k:
                                        elements_dict['type'] = 'map_filter'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'action' in k:
                                        op_list.append(v)
                                    elif 'extra' in k:
                                        extra_set.add(int(k.split('_')[4]))
                                        total_extra_dict[k.split('__')[1]] = v
                                    elif 'section_title' in k:
                                        elements_dict['type'] = 'section_title'
                                        elements_dict[k.split('__')[1]] = v

                        for e in extra_set:
                            extra_dict = {}
                            for k, v in total_extra_dict.items():
                                if str(e) in k:
                                    extra_dict[k.strip('_'+str(e))] = v
                                    extra_dict['extra_id'] = str(e)
                            extra_queries.append(extra_dict)
                        elements_dict['extra_queries'] = extra_queries
                        elements_dict['chart_legend'] = legend

                        # create dicts with operations info
                        for op in op_list:
                            op_dict = {}
                            op_dict['action'] = op
                            if op == 'count':
                                op_dict['param'] = 'label'
                            elif op == 'sort':
                                op_dict['param'] = 'another'
                            operations.append(op_dict)

                        elements_dict['operations'] = operations
                        dynamic_elements.append(elements_dict)

                    datastory_data['dynamic_elements'] = dynamic_elements
    update_json(file, general_data)
    return datastory_title_clean


def create_html(r, datastory_name, section_name):
    '''
    This function creates an html file out of a data story data.

    Args:
        r: the requested html page.
        datastory_name (str): a string that identifies the data story name.
        section_name (str): a string that identify the name of the section.
    '''
    html = r.text.replace('/melody/static', 'static')  # replace
    temp_html_file = open('static/temp/story_'+section_name+'.html', 'w')
    temp_html_file.write(html)
    temp_html_file.close()


def delete_empty_section(general_data, section_name):
    '''
    This function delete a section if it does not contain any story.
    Args:
        general_data (dict): a dictionary containing data of the json fiile.
        section_name (str): a string that identify the name of the section.
        section_title (str): a string that identify the name of the section as it appears in its unlean form.

    Returns:
        general_data (dict): the updated version provided in input.

    '''

    general_data['data_sources'].pop(section_name, 'None')
    general_data['sections'].pop(section_name)
    return general_data
