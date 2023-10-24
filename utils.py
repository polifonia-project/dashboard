from datetime import datetime
import os
import glob
import github_sync , data_methods , conf
import shutil

def empty_temp():
    '''
    Check and delete every 12 hours files in the folder "temp"
    that were created more than 1 day before.
    '''
    today = datetime.today().isocalendar()
    file_list = os.listdir('static/temp')
    if os.path.exists('static/temp') and len(file_list) > 0:
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


def modified_yesterday(today, modification_date):
    """Checks if a file has been modified the previous day, based on today and modification dates.

    Args:
        today (tuple): the isocalendar version of the current date, in the form (year, week, day).
        modification_date (tuple): the isocalendar version of the date in which the file has been modified, in the form (year, week, day).

    Returns:
        True/False (boolean): a boolean operator that states if the file has been modified the previous day (True) or not (False).
    """
    # same year
    if modification_date[0] == today[0]:
        # same week
        if modification_date[1] == today[1]:
            # 1 day difference
            if (today[2] - modification_date[2]) == 1:
                return True
            else:
                return False
        # different week
        else:
            # 1 day difference
            if modification_date[2] == 7 and today[2] == 1:
                return True
            else:
                return False
    # different year
    elif (today[0] - modification_date[0]) == 1:
        # different week
        if modification_date[1] == 52 and today[1] == 1:
            # 1 day difference
            if modification_date[2] == 7 and today[2] == 1:
                return True
            else:
                return False
        else:
            return False
    else:
        return False


def modification_date(file_stats):
    """Retrieve a date from time statistics.

    This function retrieve a date in the isocalendar form from time statistics.

    Args:
        file_stats (stat_result obj): an object whose attributes correspond to the memebers of the stat structure
        in the os bultin library. It describes the status of a file or a file descriptor.

    Returns:
        modification_date (tuple): the isocalendar version of the date in which the file has been modified,
        in the form (year, week, day).
    """
    modification_date = file_stats.st_mtime
    modification_date = datetime.fromtimestamp(
        modification_date).date().isocalendar()
    return modification_date


def static_modifications(dev=False):
    """Check for any change in the static folder and updates the corresponding one in another repository.

    This function iterates over all the files inside the static folder. Every time it checks a file has been modified
    the previou day, it performs a push of the same file to the corresponding folder in another Github repository.
    This function is supposed to run only in development.

    Args:
        dev (boolean): a boolean that declares if the environment is development or not.
    """
    if dev:
        main_folder = 'static'
        list_of_folders = os.listdir(main_folder)
        today = datetime.today().isocalendar()
        for folder in list_of_folders:
            if folder != 'temp' and folder != 'static.zip':
                folder_files = glob.glob(main_folder + '/' + folder + '/*')
                if len(folder_files) > 0:
                    for file in folder_files:
                        file_path = os.path.join(
                            main_folder, folder, file.split('\\')[1])
                        file_stats = os.stat(file_path)
                        m_date = modification_date(file_stats)
                        if modified_yesterday(today, m_date):
                            file_path = main_folder + '/' + \
                                folder + '/' + file.split('\\')[1]
                            github_sync.push(
                                file_path, 'main', conf.gituser, conf.email, conf.melody_token, path=True)
                elif len(folder_files) == 0:
                    file_stats = os.stat(main_folder + '/' + folder)
                    m_date = modification_date(file_stats)
                    if modified_yesterday(today, m_date):
                        file_path = main_folder + '/' + folder
                        github_sync.push(file_path, 'main', conf.gituser,
                                         conf.email, conf.melody_token, path=True)


def check_templates(general_data):
    """Check if new templates have been added to config.json
    and creates templates if needed, using base_modify."""
    templates_names = [general_data['templates'][t]['name'] for t in general_data['templates']]
    for t in templates_names:
        if os.path.isfile('templates/modify_'+t+'.html') == False:
            source = 'templates/base_modify.html'
            target = 'templates/modify_'+t+'.html'
            shutil.copy(source, target)
        if os.path.isfile('templates/datastory_'+t+'.html') == False:
            source = 'templates/base_datastory.html'
            target = 'templates/datastory_'+t+'.html'
            shutil.copy(source, target)
    template_data = [general_data['templates'][t] for t in general_data['templates']]
    return template_data
