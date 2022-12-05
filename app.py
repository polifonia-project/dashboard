from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, session
import requests
from flask_session import Session
import github_sync
import conf
import data_methods
import os
import glob
from apscheduler.schedulers.background import BackgroundScheduler
import bleach


app = Flask(__name__, static_url_path='/melody/static')
app.jinja_env.add_extension('jinja2.ext.loopcontrols')
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SESSION_FILE_THRESHOLD'] = 100
app.config["APPLICATION_ROOT"] = "/melody"
Session(app)


def empty_temp():
    '''
    This function checks every 12 hours if there are files
    in the folder "temp" that were created more than 1 day before, and delete them.
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


scheduler = BackgroundScheduler()
job = scheduler.add_job(empty_temp, 'interval', hours=12)
scheduler.start()

# In case 2 prints are shown see
# https://stackoverflow.com/questions/11810461/how-to-perform-periodic-task-with-flask-in-python

PREFIX = '/'

stories_path = conf.melody_repo_name + '/' + conf.melody_sub_dir


# access the home page
@app.route(PREFIX+"")
@app.route(PREFIX+"index.html")
def home():
    general_data = data_methods.read_json('config.json')
    return render_template('index.html', general_data=general_data, stories_path=stories_path)


@app.route(PREFIX+"asklogin")
def asklogin():
    general_data = data_methods.read_json('config.json')
    return render_template('asklogin.html', general_data=general_data, stories_path=stories_path)


# github authentication
@app.route(PREFIX+"gitauth")
def gitauth():
    github_auth = "https://github.com/login/oauth/authorize"
    clientId = conf.clientID
    scope = "&read:user"
    return redirect(github_auth+"?client_id="+clientId+scope)


@app.route(PREFIX+"oauth-callback")
def oauthcallback(is_valid_user=None):
    code = request.args.get('code')
    res = github_sync.ask_user_permission(code)

    if res:
        userlogin, usermail, bearer_token = github_sync.get_user_login(res)
        is_valid_user = github_sync.get_github_users(userlogin)
        if is_valid_user == True:
            session["name"] = userlogin
            session["user_type"] = 'polifonia'
            print("good Polifonia chap, logged in as ", session["name"])
            return redirect(url_for('setup'))
        else:
            session["name"] = userlogin
            print("good lad, welcome ", session["name"])
            session["user_type"] = 'extra'

            return redirect(url_for('setup'))
    else:
        session["name"] = 'None'
        session["user_type"] = 'extra'
        print("bad boy's request to github oauth")
        return redirect(url_for('home'))


#  signout
@app.route(PREFIX+"signout")
def signout():
    session["name"] = None
    session["user_type"] = None
    return redirect(url_for('home'))


# access any datastory page
@app.route(PREFIX+"<string:section_name>/<string:datastory_name>", methods=['GET', 'POST'])
def datastory(section_name, datastory_name):
    '''
    opens the config file, checks if datastory_name is inside data_sources and returns its page with the data(datastory_data)
    to be displayed.
    '''
    if request.method == 'GET':
        general_data = data_methods.read_json('config.json')
        try:
            # check if section name is the timestamp, retrieve config from static/temp
            float(section_name)
            datastory_data = data_methods.read_json(
                'static/temp/config_'+section_name+'.json')
        except ValueError:
            # else is the general config
            datastory_data = data_methods.access_data_sources(
                section_name, datastory_name, 'config.json')
        template_mode = datastory_data['template_mode']
        if datastory_data:
            return render_template('datastory_'+template_mode+'.html', datastory_data=datastory_data, general_data=general_data, section_name=section_name, datastory_name=datastory_name, stories_path=stories_path)
        else:
            return render_template('page-404.html', stories_path=stories_path)
    elif request.method == 'POST':
        host = request.host_url
        r = requests.get(host + PREFIX[1:] + section_name +
                         '/' + datastory_name)
        # open and create html file
        data_methods.create_html(r, datastory_name, section_name)

        story_data = data_methods.read_json(
            'static/temp/config_'+section_name+'.json')

        new_story = {
            'user_name': session['name'],
            'id': section_name,
            'title': story_data['title']
        }

        stories_list = data_methods.get_raw_json(
            branch='main', absolute_file_path='stories_list.json')

        if stories_list is not None:
            data_methods.update_json(
                'static/temp/stories_list.json', stories_list)
            if new_story in stories_list:
                pass
            elif new_story not in stories_list:
                for story in stories_list:
                    # check if story id is present
                    if new_story['id'] in story.values():
                        # update title
                        story['title'] = new_story['title']
                        data_methods.update_json(
                            'static/temp/stories_list.json', stories_list)
                        break
                else:
                    # append new story
                    stories_list.append(new_story)
                    data_methods.update_json(
                        'static/temp/stories_list.json', stories_list)
        else:
            stories_list = []
            stories_list.append(new_story)
            data_methods.update_json(
                'static/temp/stories_list.json', stories_list)

        # commit config and html to repo
        github_sync.push('static/temp/config_'+section_name+'.json', 'main', conf.gituser,
                         conf.email, conf.melody_token, '@'+session['name'])
        github_sync.push('static/temp/story_'+section_name+'.html', 'main', conf.gituser,
                         conf.email, conf.melody_token, '@'+session['name'])

        # commit stories list to repo
        github_sync.push('static/temp/stories_list.json', 'main', conf.gituser,
                         conf.email, conf.melody_token)

        # remove the files
        os.remove('static/temp/config_'+section_name+'.json')
        os.remove('static/temp/story_'+section_name+'.html')
        os.remove('static/temp/stories_list.json')

        return redirect('https://melody-data.github.io/stories/#catalogue')


@app.route(PREFIX+"setup", methods=['POST', 'GET'])
def setup():
    general_data = data_methods.read_json('config.json')
    if request.method == 'GET':
        template_data = []
        for item in general_data['templates']:
            template_data.append(general_data['templates'][item])
        if session.get('name') is not None:
            if session['name']:
                return render_template('setup.html', template_data=template_data, general_data=general_data, stories_path=stories_path)
        else:
            session["name"] = 'anonym'
            session["user_type"] = 'random'
            return render_template('setup.html', template_data=template_data, general_data=general_data, stories_path=stories_path)
    elif request.method == 'POST':
        if session.get('name') is not None:
            if session['name']:
                try:
                    # polifonia user
                    if session['user_type'] == 'polifonia':
                        # get data
                        form_data = request.form
                        template_mode = form_data['template_mode']
                        datastory_title = form_data['title']
                        datastory_endpoint = form_data['sparql_endpoint']
                        section_name = form_data['section_name']
                        color_code = ''
                        for item in general_data['templates']:
                            if general_data['templates'][item]['name'] == template_mode.lower():
                                color_code = general_data['templates'][item]['default_color']
                        # create new datastory instance
                        new_datastory = {}
                        new_datastory['sparql_endpoint'] = datastory_endpoint
                        new_datastory['template_mode'] = template_mode
                        new_datastory['title'] = datastory_title
                        new_datastory['color_code'] = color_code
                        new_datastory['section_name'] = section_name
                        # add to config file
                        clean_title = data_methods.clean_string(
                            datastory_title)
                        clean_section = data_methods.clean_string(section_name)
                        if clean_section in general_data['data_sources']:
                            general_data['data_sources'][clean_section][clean_title] = new_datastory
                        else:
                            general_data['data_sources'][clean_section] = {}
                            general_data['data_sources'][clean_section][clean_title] = new_datastory

                        data_methods.update_json('config.json', general_data)
                        general_data = data_methods.read_json('config.json')

                        # upload the sections list
                        sections = set()
                        sections_dict = {}
                        for story in general_data['data_sources'].values():
                            for el in story.values():
                                sections.add(el['section_name'])
                        for s in sections:
                            sections_dict[data_methods.clean_string(s)] = s
                        general_data['sections'] = sections_dict
                        data_methods.update_json('config.json', general_data)
                        general_data = data_methods.read_json('config.json')

                        datastory_data = data_methods.access_data_sources(
                            clean_section, clean_title, 'config.json')

                        # the correct template opens based on the name
                        return redirect(url_for("modify_datastory", section_name=clean_section, datastory_name=clean_title))
                    elif session['user_type'] == 'extra' or session['user_type'] == 'random':
                        # timestamp
                        ts = data_methods.new_timestamp()
                        # get data
                        form_data = request.form
                        template_mode = form_data['template_mode']
                        datastory_title = form_data['title']
                        datastory_endpoint = form_data['sparql_endpoint']
                        color_code = ''
                        for item in general_data['templates']:
                            if general_data['templates'][item]['name'] == template_mode.lower():
                                color_code = general_data['templates'][item]['default_color']
                        # create new datastory instance
                        config_data = {}
                        config_data['sparql_endpoint'] = datastory_endpoint
                        config_data['template_mode'] = template_mode
                        config_data['title'] = datastory_title
                        config_data['color_code'] = color_code
                        config_data['user_name'] = session['name']
                        config_data['id'] = str(ts)

                        clean_title = data_methods.clean_string(
                            datastory_title)
                        # add to config file
                        data_methods.update_json(
                            'static/temp/config_' + str(ts) + '.json', config_data)
                        return redirect(url_for("modify_datastory", section_name=str(ts), datastory_name=clean_title))
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
            retrieved_config = data_methods.get_raw_json(
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
