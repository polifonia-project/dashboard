from flask import Flask, render_template, request, url_for, redirect, session
from flask_session import Session
import github_sync
import conf
import data_methods

app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SESSION_FILE_THRESHOLD'] = 100
Session(app)


# access the home page


@app.route("/")
@app.route("/index.html")
def home():
    general_data = data_methods.read_json('config.json')
    return render_template('index.html', general_data=general_data)

# github authentication


@app.route("/gitauth")
def gitauth():
    github_auth = "https://github.com/login/oauth/authorize"
    clientId = '6a49af44eaa2f9c3dfd0'
    scope = "&read:user"
    return redirect(github_auth+"?client_id="+clientId+scope)


@app.route("/oauth-callback")
def oauthcallback():
    code = request.args.get('code')
    res = github_sync.ask_user_permission(code)

    if res:
        userlogin, usermail, bearer_token = github_sync.get_user_login(res)
        is_valid_user = github_sync.get_github_users(userlogin)
        if is_valid_user == True:
            session["name"] = userlogin
            print("good chap, logged in as ", session["name"])
            return redirect(url_for('setup'))
    else:
        session["name"] = None
        print("bad boy's request to github oauth")
        return redirect(url_for('home'))

# signout


@app.route("/signout")
def signout():
    session["name"] = None
    return redirect(url_for('home'))

# access any datastory page


@app.route("/<string:section_name>/<string:datastory_name>")
def datastory(section_name, datastory_name):
    '''
    opens the config file, checks if datastory_name is inside data_sources and returns its page with the data(datastory_data)
    to be displayed.
    '''
    general_data = data_methods.read_json('config.json')
    datastory_data = data_methods.access_data_sources(
        section_name, datastory_name, 'config.json')
    template_mode = datastory_data['template_mode']
    if datastory_data:
        return render_template('datastory_'+template_mode+'.html', datastory_data=datastory_data, general_data=general_data)
    else:
        return render_template('page-404.html')


@app.route("/setup", methods=['POST', 'GET'])
def setup():
    general_data = data_methods.read_json('config.json')
    if request.method == 'GET':
        if session.get('name') is not None:
            if session['name']:
                template_data = []
                for item in general_data['templates']:
                    template_data.append(general_data['templates'][item])
                return render_template('setup.html', template_data=template_data, general_data=general_data)
        else:
            return render_template('asklogin.html', general_data=general_data)
    elif request.method == 'POST':
        if session.get('name') is not None:
            if session['name']:
                try:
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
                    clean_title = datastory_title.lower().replace(" ", "_")
                    clean_section = section_name.lower().replace(" ", "_")
                    if clean_section in general_data['data_sources']:
                        general_data['data_sources'][clean_section][clean_title] = new_datastory
                    else:
                        general_data['data_sources'][clean_section] = {}
                        general_data['data_sources'][clean_section][clean_title] = new_datastory

                    data_methods.update_json('config.json', general_data)
                    general_data = data_methods.read_json('config.json')

                    # upload the sections list
                    sections = set()
                    for story in general_data['data_sources'].values():
                        for el in story.values():
                            sections.add(el['section_name'])
                    general_data['sections'] = list(sections)
                    data_methods.update_json('config.json', general_data)
                    general_data = data_methods.read_json('config.json')

                    datastory_data = data_methods.access_data_sources(
                        clean_section, clean_title, 'config.json')

                    # the correct template opens based on the name
                    return redirect(url_for("modify_datastory", section_name=clean_section, datastory_name=clean_title))
                except Exception as e:
                    return str(e)+'did not save to database'
    else:
        return 'something went wrong, try again'


@app.route("/send_data/<string:section_name>", methods=['POST', 'GET'])
def send_data(section_name):
    general_data = data_methods.read_json('config.json')
    if request.method == 'POST':
        if session.get('name') is not None:
            if session['name']:
                try:
                    datastory_name = data_methods.manage_datastory_data(
                        general_data, 'config.json', section_name)
                    return redirect(url_for('datastory', section_name=section_name, datastory_name=datastory_name))
                except:
                    return 'Something went wrong'


@app.route("/modify/<string:section_name>/<string:datastory_name>", methods=['POST', 'GET'])
def modify_datastory(section_name, datastory_name):
    datastory_data = data_methods.access_data_sources(
        section_name, datastory_name, 'config.json')
    general_data = data_methods.read_json('config.json')
    if request.method == 'GET':
        template_mode = datastory_data['template_mode']
        print(template_mode)
        if session.get('name') is not None:
            if session['name']:
                return render_template('modify_'+template_mode+'.html', datastory_data=datastory_data, general_data=general_data)
    elif request.method == 'POST':
        if session.get('name') is not None:
            if session['name']:
                if request.form['action'] == 'save':
                    try:
                        datastory_name = data_methods.manage_datastory_data(
                            general_data, 'config.json', section_name)
                        return redirect(url_for('datastory', section_name=section_name, datastory_name=datastory_name))
                    except:
                        return 'Something went wrong'

                elif request.form['action'] == 'delete':
                    print(section_name, datastory_name, request.form)
                    datastory_title = request.form['title'].lower().replace(
                        " ", "_")
                    general_data['data_sources'][section_name].pop(
                        datastory_title, 'None')
                    data_methods.update_json('config.json', general_data)
                    return redirect('/')


if __name__ == "__main__":
    app.run(debug=True)
