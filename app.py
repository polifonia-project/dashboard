from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, session
import requests
from flask_session import Session
import github_sync
import utils
import conf
import data_methods
import os
import glob
from apscheduler.schedulers.background import BackgroundScheduler
import bleach

# Sessions config
app = Flask(__name__, static_url_path='/melody/static')
app.jinja_env.add_extension('jinja2.ext.loopcontrols')
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SESSION_FILE_THRESHOLD'] = 100
app.config["APPLICATION_ROOT"] = "/melody"
Session(app)

# temp folder
scheduler = BackgroundScheduler()
job = scheduler.add_job(utils.empty_temp, 'interval', hours=12)
scheduler.start()

# paths
PREFIX = '/melody/'
stories_path = conf.melody_repo_name + '/' + conf.melody_sub_dir


@app.route(PREFIX+"")
@app.route(PREFIX+"index.html")
def home():
    "Return the home page"
    general_data = data_methods.read_json('config.json')
    return render_template('index.html', general_data=general_data, stories_path=stories_path)


@app.route(PREFIX+"asklogin")
def asklogin():
    "Return templates/asklogin"
    general_data = data_methods.read_json('config.json')
    return render_template('asklogin.html', general_data=general_data, stories_path=stories_path)


@app.route(PREFIX+"gitauth")
def gitauth():
    "Redirect to github authentication"
    scope = "&read:user"
    return redirect(github_sync.github_auth+"?client_id="+conf.clientId+scope)

# authenticate user: polifonia, extra
@app.route(PREFIX+"oauth-callback")
def oauthcallback(is_valid_user=None):
    """Authenticate users via GitHub.

    Args:
        is_valid_user (boolean): returned by github_sync.ask_user_permission(code)
    Returns:
        redirection to the setup page or homepage
    """
    code = request.args.get('code')
    res = github_sync.ask_user_permission(code)
    if res:
        userlogin, usermail, bearer_token = github_sync.get_user_login(res)
        is_valid_user = github_sync.get_github_users(userlogin)
        if is_valid_user == True:
            session["name"],session["user_type"] = userlogin , 'polifonia'
        else:
            session["name"], session["user_type"] = userlogin , 'extra'
        return redirect(url_for('setup'))
    else:
        session["name"], session["user_type"] = 'None' , 'extra'
        return redirect(url_for('home'))

    print("LOGIN type:", session["user_type"], "| username:", session["name"])


@app.route(PREFIX+"signout")
def signout():
    "Signout and redirect to the homepage."
    session["name"], session["user_type"] = None , None
    return redirect(url_for('home'))


@app.route(PREFIX+"<string:section_name>/<string:datastory_name>", methods=['GET', 'POST'])
def datastory(section_name, datastory_name):
    '''
    Visualise the final data story.
    Get the data of a datastory from config.json/data_sources/ and render the correct
    html template.

    Args:
        section_name (str): a section in config.json/sections or a new one
        datastory_name (str): a story in config.json/data_sources/{section_name}
    Returns:
        redirect to setup page or homepage (dashboard or external catalogue)
    '''

    if request.method == 'GET':
        # return datastory in dashboard or 404
        general_data = data_methods.read_json('config.json')
        datastory_data = utils.get_datastory_data(section_name,datastory_name)
        if datastory_data:
            template_mode = datastory_data['template_mode']

            return render_template('datastory_'+template_mode+'.html',
                datastory_data=datastory_data,
                general_data=general_data,
                section_name=section_name,
                datastory_name=datastory_name,
                stories_path=stories_path)
        else:
            return render_template('page-404.html', stories_path=stories_path)

    elif request.method == 'POST':
        # save datastory to github
        host = request.host_url
        github_sync.publish_datastory(host,PREFIX,section_name,datastory_name,session)
        return redirect('https://melody-data.github.io/stories/#catalogue')


@app.route(PREFIX+"setup", methods=['POST', 'GET'])
def setup():
    general_data = data_methods.read_json('config.json')
    template_data = [general_data['templates'][t] for t in general_data['templates']]

    if request.method == 'GET':
        if session.get('name') is None \
            or (session is not None and "name" not in session):
            session["name"],session["user_type"] = 'anonym','random'
        return render_template('setup.html',
            template_data=template_data,
            general_data=general_data,
            stories_path=stories_path)

    elif request.method == 'POST':
        if session.get('name') is not None and session['name']:
            try:
                form_data = request.form
                if session['user_type'] == 'polifonia':
                    clean_title, clean_section = data_methods.add_story_to_config('config.json',form_data,general_data)
                    general_data = data_methods.read_json('config.json')
                    data_methods.update_sections_config(general_data)
                    return redirect(url_for("modify_datastory",
                        section_name=clean_section, datastory_name=clean_title))
                elif session['user_type'] in ['extra','random']:
                    ts = data_methods.new_timestamp()
                    config_file = 'static/temp/config_' + str(ts) + '.json'
                    clean_title, clean_section = data_methods.add_story_to_config(config_file,form_data,general_data,
                        session['name'], str(ts))
                    return redirect(url_for("modify_datastory",
                        section_name=str(ts), datastory_name=clean_title))
            except Exception as e:
                return str(e)+'did not save to database'
    else:
        return 'something went wrong, try again'


@app.route(PREFIX+"modify/<string:section_name>/<string:datastory_name>", methods=['POST', 'GET'])
def modify_datastory(section_name, datastory_name):
    while True:
        try:
            general_data = data_methods.read_json('config.json')
            if session['user_type'] == 'polifonia':
                datastory_data = data_methods.access_data_sources(
                    section_name, datastory_name, 'config.json')
            elif session['user_type'] == 'extra' or session['user_type'] == 'random':
                datastory_data = data_methods.read_json(
                    'static/temp/config_'+section_name+'.json')
                print(datastory_data)
            if request.method == 'GET':
                template_mode = datastory_data['template_mode']
                if session.get('name') is not None:
                    if session['name']:
                        return render_template('modify_'+template_mode+'.html', datastory_data=datastory_data, general_data=general_data, stories_path=stories_path)
            elif request.method == 'POST':
                if session.get('name') is not None:
                    if session['name']:
                        if request.form['action'] == 'save':
                            try:
                                if session['user_type'] == 'polifonia':
                                    new_datastory_name = data_methods.manage_datastory_data(
                                        general_data, 'config.json', section_name, datastory_name)
                                    return redirect(url_for('datastory', section_name=section_name, datastory_name=new_datastory_name))
                                elif session['user_type'] == 'extra' or session['user_type'] == 'random':
                                    # get data and add to existing datastory instance in config
                                    # transform ImmutableMultiDict into regular dict
                                    form_data = request.form.to_dict(flat=True)
                                    datastory_title = form_data['title']
                                    dynamic_elements = []
                                    position_set = set()
                                    color_code_list = []
                                    # we fill a set with the positions of the elements' type
                                    for k, v in form_data.items():
                                        if '__' in k:
                                            position_set.add(
                                                int(k.split('__')[0]))
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
                                        total_extra_dict = {}
                                        extra_queries = []
                                        legend = {}

                                        for k, v in form_data.items():
                                            if '__' in k:
                                                if position == int(k.split('__')[0]):
                                                    if 'text' in k and 'search' not in k:
                                                        elements_dict['type'] = 'text'
                                                        elements_dict[k.split('__')[
                                                            1]] = bleach.clean(v,
                                                                               tags=[
                                                                                   'h2', 'h3', 'p', 'em', 'u', 'strong', 'li', 'ul', 'ol', 'a'],
                                                                               attributes=['href'])
                                                    elif 'textsearch' in k:
                                                        elements_dict['type'] = 'textsearch'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'count' in k:
                                                        elements_dict['type'] = 'count'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'chart' in k and 'label' not in k:
                                                        elements_dict['type'] = 'chart'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'chart_label' in k:
                                                        key = k.split('__')[
                                                            1].split('_')[2]
                                                        legend[key] = v
                                                    elif 'table_' in k:
                                                        elements_dict['type'] = 'table'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'tablevalueaction' in k:
                                                        elements_dict['type'] = 'tablevalueaction'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'tablecomboaction' in k:
                                                        elements_dict['type'] = 'tablecomboaction'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'action' in k:
                                                        op_list.append(v)
                                                    elif 'extra' in k:
                                                        extra_set.add(
                                                            int(k.split('_')[4]))
                                                        total_extra_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'section_title' in k:
                                                        elements_dict['type'] = 'section_title'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'map' in k and 'simple' not in k and 'filter' not in k:
                                                        elements_dict['type'] = 'map'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                                    elif 'map' in k and 'simple' not in k and 'filter' in k:
                                                        elements_dict['type'] = 'map_filter'
                                                        elements_dict[k.split('__')[
                                                            1]] = v
                                        for e in extra_set:
                                            extra_dict = {}
                                            for k, v in total_extra_dict.items():
                                                if str(e) in k:
                                                    extra_dict[k.strip(
                                                        '_'+str(e))] = v
                                                    extra_dict['extra_id'] = str(
                                                        e)
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
                                    data_methods.update_json(
                                        'static/temp/config_'+section_name+'.json', datastory_data)
                                    datastory_name = data_methods.clean_string(
                                        datastory_title)
                                    return redirect(url_for('datastory', section_name=section_name, datastory_name=datastory_name))
                            except:
                                return 'Something went wrong'

                        elif request.form['action'] == 'delete':
                            print(section_name, datastory_name, request.form)
                            if session['user_type'] == 'polifonia':
                                section_title = general_data['data_sources'][section_name][datastory_name]['section_name']
                                general_data['data_sources'][section_name].pop(
                                    datastory_name, 'None')
                                # if section is now empty, delete it
                                if len(general_data['data_sources'][section_name]) == 0:
                                    general_data = data_methods.delete_empty_section(
                                        general_data, section_name)
                                data_methods.update_json(
                                    'config.json', general_data)
                                return redirect(PREFIX)
                            elif session['user_type'] == 'extra' or session['user_type'] == 'random':
                                os.remove('static/temp/config_' +
                                          section_name+'.json')
                                return redirect(PREFIX)
        except:
            retrieved_config = github_sync.get_raw_json(
                branch='main', absolute_file_path='config_' + section_name + '.json')
            data_methods.update_json(
                'static/temp/config_' + section_name + '.json', retrieved_config)
            continue
        break


@app.route(PREFIX+"<string:whatever>/modify/<string:section_name>/<string:datastory_name>", strict_slashes=False, methods=['POST', 'GET'])
def redirect_to_modify(section_name, datastory_name, whatever=None):
    return redirect(url_for('modify_datastory', section_name=section_name, datastory_name=datastory_name))


def modified_yesterday(today, modification_date):
    """Checks if a file has been modified the previous day.

    This function checks if a file has been modified the previous day, based on today and modification dates.

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


static_modifications(False)


if __name__ == "__main__":
    app.run(debug=True)
