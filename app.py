from datetime import datetime
from flask import Flask, render_template, request, url_for, redirect, session , json
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
app = Flask(__name__, static_url_path='/melody')
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
PREFIX = '/'
stories_path = conf.melody_repo_name + '/' + conf.melody_sub_dir

@app.route('/')
@app.route('/melody/')
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

@app.route("/melody/gitauth")
@app.route(PREFIX+"gitauth")
def gitauth():
	"Redirect to github authentication"
	scope = "&read:user"
	return redirect(github_sync.github_auth+"?client_id="+conf.clientID+scope)

# authenticate user: polifonia, extra
@app.route("/melody/oauth-callback")
@app.route(PREFIX+"oauth-callback")
def oauthcallback(is_valid_user=None):
	"""Authenticate users via GitHub.

	Args:
		is_valid_user (boolean): returned by github_sync.ask_user_permission(code)
	Returns:
		redirection to the setup page or homepage
	"""
	code = request.args.get('code')
	session["name"],session["user_type"] = github_sync.validate_credentials(code)
	if session["name"] != 'None':
		return redirect('/melody'+url_for('setup'))
	else:
		return redirect('/melody'+url_for('home'))
	print("LOGIN type:", session["user_type"], "| username:", session["name"])

@app.route("/melody/signout")
@app.route(PREFIX+"signout")
def signout():
	"Signout and redirect to the homepage."
	session["name"], session["user_type"] = None , None
	return redirect('/melody'+url_for('home'))


@app.route("/melody/<string:section_name>/<string:datastory_name>", methods=['GET', 'POST'])
@app.route(PREFIX+"<string:section_name>/<string:datastory_name>", methods=['GET', 'POST'])
def datastory(section_name, datastory_name):
	'''
	Visualise the final data story.

	Args:
		section_name (str): a section in config.json/sections or a new one
		datastory_name (str): a story in config.json/data_sources/{section_name}
	Returns:
		redirect to setup page or homepage (dashboard or external catalogue)
	'''
	react_version = 'development.js' if '127.0.0.1' in request.host_url else 'production.min.js'
	if request.method == 'GET':
		# return datastory in dashboard or 404
		general_data = data_methods.read_json('config.json')
		datastory_data = data_methods.get_datastory_data(section_name,datastory_name)
		if datastory_data:
			template_mode = datastory_data['template_mode']
			return render_template('datastory_'+template_mode+'.html',
				datastory_data=datastory_data, general_data=general_data,
				section_name=section_name,datastory_name=datastory_name,
				stories_path=stories_path,
				react_version=react_version)
		else:
			return render_template('page-404.html', stories_path=stories_path)

	elif request.method == 'POST':
		# save datastory to github
		host = request.host_url
		github_sync.publish_datastory(host,PREFIX,section_name,datastory_name,session)
		return redirect('https://'+conf.melody_owner+'.github.io/'+conf.melody_repo_name+'/#catalogue')

@app.route("/melody/setup", methods=['POST', 'GET'])
@app.route(PREFIX+"setup", methods=['POST', 'GET'])
def setup():
	general_data = data_methods.read_json('config.json')
	template_data = utils.check_templates(general_data)
	if request.method == 'GET':
		if session.get('name') is None \
			or (session is not None and "name" not in session):
			session["name"],session["user_type"] = 'anonym','random'
		return render_template('setup.html', template_data=template_data,
			general_data=general_data, stories_path=stories_path)
	elif request.method == 'POST':
		if session.get('name') is not None and 'name' in session:
			try:
				form_data = request.form
				title, section = data_methods.init_datastory(session['user_type'],
					form_data,general_data,session['name'])
				return redirect('/melody'+url_for("modify_datastory",
					section_name=section, datastory_name=title))
			except Exception as e:
				return str(e)+'did not save to database'
	else:
		return 'something went wrong, try again'


@app.route("/melody/modify/<string:section_name>/<string:datastory_name>", methods=['POST', 'GET'])
@app.route(PREFIX+"modify/<string:section_name>/<string:datastory_name>", methods=['POST', 'GET'])
def modify_datastory(section_name, datastory_name):
	while True:
		try:
			general_data = data_methods.read_json('config.json')
			datastory_data = data_methods.get_config(session,section_name,datastory_name)
			react_version = 'development.js' if '127.0.0.1' in request.host_url else 'production.min.js'
			if session.get('name') is not None and "name" in session:
				if request.method == 'GET':
					template_mode = datastory_data['template_mode']
					return render_template('modify_'+template_mode+'.html',
						datastory_data=datastory_data,
						general_data=general_data,
						stories_path=stories_path,
						react_version=react_version)
				elif request.method == 'POST':
					try:
						if request.form['action'] == 'save':
							try:
								config_file = 'config.json' if session['user_type'] == 'polifonia' \
									else 'static/temp/config_'+section_name+'.json'
								new_datastory_name = data_methods.manage_datastory_data(
									session['user_type'], general_data, config_file, section_name, datastory_name)
								return redirect('/melody'+url_for('datastory',
										section_name=section_name,
										datastory_name=new_datastory_name))

							except Exception as e:
								return str(e),'Something went wrong, modify'

						elif request.form['action'] == 'delete':
							data_methods.delete_story(general_data,section_name,datastory_name,session['user_type'])
							return redirect(PREFIX+'melody/')
						else:
							print('no idea..')
					except Exception as e:
						return str(e),'Something went wrong'
		except Exception as e:
			retrieved_config = github_sync.get_raw_json(
				branch='main', absolute_file_path='config_' + section_name + '.json')
			data_methods.update_json(
				'static/temp/config_' + section_name + '.json', retrieved_config)
			continue
		break


@app.route(PREFIX+"modify_bkg/<string:section_name>/<string:datastory_name>", methods=['POST'])
def modify_bkg_datastory(section_name, datastory_name):
	while True:
		try:
			general_data = data_methods.read_json('config.json')
			datastory_title = request.form.to_dict(flat=True)['title']
			datastory_data = data_methods.get_config(session,section_name,datastory_name,datastory_title)
			if session.get('name') is not None and "name" in session:
				if request.method == 'POST':
					try:
						config_file = 'config.json' if session['user_type'] == 'polifonia' \
							else 'static/temp/config_'+section_name+'.json'
						new_datastory_name = data_methods.manage_datastory_data(
							session['user_type'], general_data, config_file, section_name, datastory_name)
						datastory_data = data_methods.get_config(session,section_name,datastory_name,datastory_title)
						return datastory_data
					except Exception as e:
						print(str(e)+'Something went wrong, modify bkg')
						return datastory_data
		except Exception as e:
			retrieved_config = github_sync.get_raw_json(
				branch='main', absolute_file_path='config_' + section_name + '.json')
			if retrieved_config:
				data_methods.update_json(
					'static/temp/config_' + section_name + '.json', retrieved_config)
			continue
		break



@app.route(PREFIX+"<string:whatever>/modify/<string:section_name>/<string:datastory_name>", strict_slashes=False, methods=['POST', 'GET'])
def redirect_to_modify(section_name, datastory_name, whatever=None):
	return redirect("/melody"+url_for('modify_datastory', section_name=section_name, datastory_name=datastory_name))


utils.static_modifications(False)


if __name__ == "__main__":
	app.run(debug=True)
