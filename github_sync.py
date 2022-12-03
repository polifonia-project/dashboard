import os
import json
import requests
from github import Github, InputGitAuthor
import conf
import base64

dir_path = os.path.dirname(os.path.realpath(__file__))

# OAUTH APP


clientId = conf.clientID
clientSecret = conf.clientSecret


def ask_user_permission(code):
    """ Get user permission when authenticating via Github.

    Args:
        code (str): an alpha-numeric string that gets a unique code for the user who is attempting to authenticate.

    Returns:
        res (dict): a dictionary containing user info for permission.
    """
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
    """ Get Github user information.

    Args:
        res (dict): a dictionary containing user info for permission, returned by ask_user_permission(code).

    Returns:
        userlogin (str): a string representing the user nickname.
        usermail (str): a string representing the user email address.
        access_token (str): a string representing the user access token.

    """
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
    """ Match user with collaborators of Github repository.

    This function checks if the user trying to authenticate is part of a specific Github repository.

    Args:
        userlogin (str): a string representing the user nickname.

    Returns:
        is_valid_user (boolean): a boolean operator that states if user is a collaborator (True) or not (False).

    """
    is_valid_user = False
    if conf.token != '' and conf.owner != '' and conf.repo_name != '':
        req = requests.get("https://api.github.com/repos/"+conf.owner+"/"+conf.repo_name+"/collaborators",
                           headers={"Authorization": "token "+conf.token})
        if req.status_code == 200:
            users = [user['login'] for user in req.json()]
            if userlogin in users:
                is_valid_user = True
    return is_valid_user


def push(local_file_path, branch='main', gituser=None, email=None, bearer_token=None, action='', path=False):
    """ Create a new file or update an existing file in a Github repository.

    This function allows to publish and/or update content on another Github repository.

    Args:
        local_file_path (str): a string representing the local path of the file that needs to be published or updated.
        branch (str): a string representing the branch from/to which publicate or update. 'main' is default.
        gituser (str): a string representing the Github user that will carry out the action. 'None' is default.
        email (str): a string representing the email address of gituser. 'None' is default.
        bearer_token (str): a string representing the token to have permission to carry out the action. 'None' is default.
        action (str): a string representing the optional message text that can be included in the commit. It is ampty by default.
        path (boolean): a boolean whose value default to False to check if the function want to use the local_file_path as it is (True) or not (False).

    """
    token = conf.token if bearer_token is None else bearer_token  # editor
    user = conf.author if gituser is None else gituser  # editor
    usermail = conf.author_email if email is None else email
    owner = conf.melody_owner
    repo_name = conf.melody_repo_name
    g = Github(token)
    repo = g.get_repo(owner+"/"+repo_name)
    author = InputGitAuthor(user, usermail)  #  commit author
    if path == False:
        # necessary to commit filename without path
        absolute_file_path = os.path.basename(local_file_path)
    else:
        absolute_file_path = local_file_path

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
