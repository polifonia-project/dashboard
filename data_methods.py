import json
from flask import request
from datetime import datetime
import requests
import conf


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
    datastory_title_clean = datastory_title.lower().replace(" ", "_")
    print(form_data)
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
                        operations = []
                        op_list = []
                        elements_dict = {}
                        elements_dict['position'] = position
                        for k, v in form_data.items():
                            if '__' in k:
                                if position == int(k.split('__')[0]):
                                    if 'text' in k and 'search' not in k:
                                        elements_dict['type'] = 'text'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'textsearch' in k:
                                        elements_dict['type'] = 'textsearch'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'count' in k:
                                        elements_dict['type'] = 'count'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'chart' in k:
                                        elements_dict['type'] = 'chart'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'tablevalueaction' in k:
                                        elements_dict['type'] = 'tablevalueaction'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'tablecomboaction' in k:
                                        elements_dict['type'] = 'tablecomboaction'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'action' in k:
                                        op_list.append(v)
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
    html = r.text.replace('/static', 'static')  # replace
    temp_html_file = open('static/temp/'+datastory_name +
                          '_'+section_name+'.html', 'w')
    # print(temp_html_file)
    temp_html_file.write(html)
    temp_html_file.close()


def get_raw_json(branch='main', absolute_file_path=None):
    '''
    This function request the raw version of a json file hosted in a Github repository.
    Args:
        branch (str): the repository branch from which the file is requested. Default is "main".
        absolute_file_path (str): a string that identifies the name of the file (or its path).

    Returns:
        data (dict): a disctionary containing th econtent of the json file.

    '''
    try:
        json_url = 'https://raw.githubusercontent.com/' + conf.melody_owner + '/' + \
            conf.melody_repo_name+'/' + branch + '/' + absolute_file_path
        r = requests.get(json_url)
        data = r.json()
    except:
        data = None
    return data
