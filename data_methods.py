import json
from flask import request


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


def manage_datastory_data(general_data, file, section_name):
    '''
    This function deals with data story data after the submission of the WYSIWYG form.

    Args:
        general_data (dict): a dictionary containing data of the json fiile.
        file (str): a string that specifies the name of the json file to read.
        section_name (str): a string that identify the name of the section.

    Returns:
        datastory_name (str): a string that identifies the data story name.
    '''
    # get data and add to existing datastory instance in config

    # transform ImmutableMultiDict into regular dict
    form_data = request.form.to_dict(flat=True)
    datastory_title = form_data['title']

    dynamic_elements = []
    position_set = set()
    color_code_list = []

    for name, data in general_data['data_sources'].items():
        if name == section_name:
            for datastory, datastory_data in data.items():
                # with the title we check where to insert data
                if datastory == datastory_title.lower().replace(" ", "_"):
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
                                    if 'text' in k:
                                        elements_dict['type'] = 'text'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'count' in k:
                                        elements_dict['type'] = 'count'
                                        elements_dict[k.split('__')[1]] = v
                                    elif 'chart' in k:
                                        elements_dict['type'] = 'chart'
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
    datastory_name = datastory_title.lower().replace(" ", "_")
    return (datastory_name)
