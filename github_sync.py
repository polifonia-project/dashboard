import os
import json
import requests
from github import Github, InputGitAuthor
import conf

dir_path = os.path.dirname(os.path.realpath(__file__))

# OAUTH APP


clientId = conf.clientID
clientSecret = conf.clientSecret


def ask_user_permission(code):
    """ get user permission when authenticating via github"""
    res = None
    body = {
        "client_id": clientId,
        "client_secret": clientSecret,
        "code": code
    }

    req = requests.post('https://github.com/login/oauth/access_token', data=body,
                        headers={"accept": "application/json"})
    print(body, req)
    if req.status_code == 200:
        res = req.json()
    return res


def get_user_login(res):
    """ get github user information """
    userlogin, usermail = None, None
    print("user requesting github login:", res)
    access_token = res["access_token"]
    req_user = requests.get("https://api.github.com/user",
                            headers={"Authorization": "token "+access_token})

    if req_user.status_code == 200:
        res_user = req_user.json()
        userlogin = res_user["login"]
        usermail = res_user["email"]
    return userlogin, usermail, access_token


def get_github_users(userlogin):
    """ match user with collaborators of github repository"""
    is_valid_user = False
    if conf.token != '' and conf.owner != '' and conf.repo_name != '':
        req = requests.get("https://api.github.com/repos/"+conf.owner+"/"+conf.repo_name+"/collaborators",
                           headers={"Authorization": "token "+conf.token})
        if req.status_code == 200:
            users = [user['login'] for user in req.json()]
            if userlogin in users:
                is_valid_user = True
    return is_valid_user


def push(local_file_path, branch='main', gituser=None, email=None, bearer_token=None, action=''):
    """ create a new file or update an existing file.
    the remote file has the same relative path of the local one"""
    token = conf.token if bearer_token is None else bearer_token  # dell'editor
    user = conf.author if gituser is None else gituser  # editor
    usermail = conf.author_email if email is None else email
    owner = conf.melody_owner  # questo va cambiato melody-data
    repo_name = conf.melody_repo_name  # questo va cambiato stories
    g = Github(token)
    repo = g.get_repo(owner+"/"+repo_name)
    author = InputGitAuthor(user, usermail)  #  commit author
    # necessary to commit filename without path
    absolute_file_path = os.path.basename(local_file_path)

    try:
        # Retrieve the online file to get its SHA and path
        contents = repo.get_contents(
            conf.melody_sub_dir+'/'+absolute_file_path)
        update = True
        message = "updated file "+absolute_file_path+" "+action
    except:
        update = False
        message = "created file "+absolute_file_path+" "+action

    # Both create/update file replace the file with the local one
    with open(local_file_path) as f:
        data = f.read()  # could be done in a smarter way

    if update == True:  # If file already exists, update it
        # Add, commit and push branch
        repo.update_file(contents.path, message, data,
                         contents.sha, author=author)
    else:
        try:
            # If file doesn't exist, create it in the same relative path of the local file
            # Add, commit and push branch
            repo.create_file(conf.melody_sub_dir+'/'+absolute_file_path, message, data,
                             branch=branch, author=author)
        except Exception as e:
            print(e)


def delete_file(local_file_path, branch, gituser=None, email=None, bearer_token=None):
    """ delete files form github """
    token = conf.token if bearer_token is None else bearer_token
    user = conf.author if gituser is None else gituser
    usermail = conf.author_email if email is None else email
    owner = conf.owner
    repo_name = conf.repo_name
    g = Github(token)
    repo = g.get_repo(owner+"/"+repo_name)
    author = InputGitAuthor(user, usermail)  #  commit author
    contents = repo.get_contents(local_file_path)
    message = "deleted file "+local_file_path
    repo.delete_file(contents.path, message, contents.sha, branch=branch)
