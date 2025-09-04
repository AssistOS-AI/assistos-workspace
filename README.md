# AssistOS

*AssistOS*  bundles all the necessary dependencies for building and running AssistOS in a single package.

For more details about what a *workspace* is check out the [template-workspace](https://github.com/PrivateSky/template-workspace).

## Table of contents
1. [Installation](#installation)    
   1. [Clone the workspace](#step-1-clone-the-workspace)
   2. [Install dependencies](#step-2-install-dependencies)
2. [Running](#running)
   1. [Step 1: Launch the "server"](#step-1-launch-the-server)
   

## Installation

In order to use the workspace, we need to follow a list of steps presented below.

### Step 1: Clone the workspace

```sh
  git clone https://github.com/AssistOS-AI/assistos-workspace.git
```

### Step 2: Install dependencies
After the repository was cloned, you must install all the dependencies.

```sh
  npm run dev-install
```
**Note:** this command might take quite some time depending on your internet connection and you machine processing power.

### Step 3: add "SSO_SECRETS_ENCRYPTION_KEY" in env.json with any value

## Running

### Step 4: Launch the "server"

While in the *AssistOS* folder run:

```sh
  npm run server
```
Then go to http://localhost:8080 and you should see the AssistOS interface.

