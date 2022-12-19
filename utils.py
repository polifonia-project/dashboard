from datetime import datetime
import data_methods
import os

def empty_temp():
    '''
    Check and delete every 12 hours files in the folder "temp"
    that were created more than 1 day before.
    '''
    today = datetime.today().isocalendar()
    file_list = os.listdir('static/temp')
    if len(file_list) > 0:
        for f in file_list:
            file_path = 'static/temp/' + f
            creation_timestamp = os.path.getmtime(file_path)
            creation_date = datetime.fromtimestamp(
                creation_timestamp).date().isocalendar()
            if creation_date[2] != today[2]:
                os.remove(file_path)
                print(f'Removed {f}.')
            else:
                print(f'{f} is still too new.')
    else:
        return 'Temp folder empty.'

def get_datastory_data(section_name,datastory_name):
    """
    Get the data from config.json of temp/config
    to render the final datastory.
    """
    datastory_data = None
    try:
        # if section name is a timestamp, retrieve config from static/temp
        float(section_name)
        datastory_data = data_methods.read_json(
            'static/temp/config_'+section_name+'.json')
    except ValueError:
        # else is the general config
        datastory_data = data_methods.access_data_sources(
            section_name, datastory_name, 'config.json')
    return datastory_data
