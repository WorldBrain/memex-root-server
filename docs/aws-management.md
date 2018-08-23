# AWS management

These are some quick and dirty notes about how I set up everything. The rest of the team usually should only use the deployment scripts

## Initial setup

First, cd to the root of this repo.

**Setup and configure AWS & EB cli**:
```sh
$ pip install awscli awsebcli --upgrade --user
$ aws configure
```

**Setup IAM policies (replace staging with production for production environment):**
```sh
$ aws iam create-role --role-name memex-root-service-staging-profile --assume-role-policy-document file://iam-trust.json
$ aws iam put-role-policy --role-name memex-root-service-staging-profile --policy-name memex-root-service-staging-permissions --policy-document file://iam-permissions-staging.json
$ aws iam create-instance-profile --instance-profile-name memex-root-service-staging-profile
$ aws iam add-role-to-instance-profile --instance-profile-name memex-root-service-staging-profile --role-name memex-root-service-staging-profile
```

**Go to the AWS management console and create & download the key pair to your ~/.ssh directory:**
```
AWS console > Services > EC2 > Network & Security > Key Pairs > Create Key Pair
```

**Setup EB CLI for the current environment (enter memex-root-service for application name:**
```sh
$ eb init

Select a default region
...
5) eu-central-1 : EU (Frankfurt)
...
(default is 3): **5**

Enter Application Name
(default is "memex-root-service"): 
Application memex-root-service has been created.

It appears you are using Node.js. Is this correct?
(Y/n): **Y**
Note: Elastic Beanstalk now supports AWS CodeCommit; a fully-managed source control service. To learn more, see Docs: https://aws.amazon.com/codecommit/
Do you wish to continue with CodeCommit? (y/N) (default is n): 
Do you want to set up SSH for your instances?
(Y/n): **Y**

Select a keypair.
1) worldbrain-dev
2) [ Create new KeyPair ]
(default is 1): **1**
```

**Create new EB environment (enter staging or production for environment name and keep defaults for rest):**
```sh
$ eb create --instance_profile memex-root-service-staging-profile
Enter Environment Name
(default is memex-root-service-dev): **memex-root-service-staging**
Enter DNS CNAME prefix
(default is staging): **memex-root-service-staging**

Select a load balancer type
1) classic
2) application
3) network
(default is 1): **1**
```

## SSH access

**If you set up the keys alright, you should be able to get using the following command:**
```sh
$ eb ssh
```

## Deploying a new version

**Quite easy:**
```sh
$ eb deploy staging
```

## Logs

**When SSHing into servers, most relevant logs are:**
```
/var/log/nodejs/nodejs.log
/var/log/nginx/errors.log
```

## Debugging

To modify the running code, edit the files in:
```
/var/app/current
```

You can use initctl to restart the processes.
```
sudo initctl restart nodejs
```

Alternatively, you can kill the process to restart it:
```
sudo pkill -f node
```

NPM can be found here:
```
/opt/elasticbeanstalk/node-install/node-v8.11.3-linux-x64/bin/npm
```
