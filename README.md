# AssistOS

*AssistOS*  bundles all the necessary dependencies for building and running AssistOS in a single package.

For more details about what a *workspace* is check out the [template-workspace](https://github.com/PrivateSky/template-workspace).

## Table of contents
1. [Installation](#installation)    
   1. [Clone the workspace](#step-1-clone-the-workspace)
   2. [Copy secrets](#step-2-copy-secrets)
   3. [Install dependencies](#step-3-install-dependencies)
   4. [Install LLM Adapter](#step-4-install-llm-adapter)
2. [Running](#running)
   1. [Step 1: Launch the "server"](#step-1-launch-the-server)
   

## Installation

In order to use the workspace, we need to follow a list of steps presented below.

### Step 1: Clone the workspace

```sh
$ git clone [https://github.com/OutfinityResearch/aiauthor-workspace.git](https://github.com/AssistOS-AI/assistos-workspace)
```

### Step 2: Copy secrets
   Go to https://github.com/AssistOS-AI/assistos-workspace-secrets, copy emailConfig.js to data/volume/config folder and env.json in the root of the project.

### Step 3: Install dependencies
After the repository was cloned, you must install all the dependencies.

```sh
$ npm run dev-install
```
**Note:** this command might take quite some time depending on your internet connection and you machine processing power.
### Step 4: Install LLM Adapter
Clone https://github.com/AssistOS-AI/llmadapter.git as a separate project and copy .env file from https://github.com/AssistOS-AI/assistos-workspace-secrets to the root of the project. Then run the following command:

```sh
$ npm install
```


## Running

### Step 1: Launch the "server"

While in the *AssistOS* folder run:

```sh
$ npm run server
```
 Then go to the *LLM Adapter* project and run:
 
 ```sh
$ npm run server
```
Then go to http://localhost:8080 and you should see the AssistOS interface.

