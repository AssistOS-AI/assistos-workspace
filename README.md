# AssistOS

*AssistOS*  bundles all the necessary dependencies for building and running AssistOS in a single package.

For more details about what a *workspace* is check out the [template-workspace](https://github.com/PrivateSky/template-workspace).

## Table of contents
1. [Installation](#installation)    
   1. [Clone the workspace](#step-1-clone-the-workspace)
   2. [Install dependencies](#step-2-install-dependencies)
   3. [Build all things needed for the application to run](#step-3-build-all-things-needed-for-the-application-to-run)
2. [Running](#running)
   1. [Step 1: Launch the "server"](#step-1-launch-the-server)
   

## Installation

In order to use the workspace, we need to follow a list of steps presented below.

### Step 1: Clone the workspace

```sh
$ git clone https://github.com/OutfinityResearch/aiauthor-workspace.git
```
### Step 2: Install dependencies
After the repository was cloned, you must install all the dependencies.

```sh
$ cd aiauthor-workspace
$ npm run dev-install
```
**Note:** this command might take quite some time depending on your internet connection and you machine processing power.

### Step 3: Build all things needed for the application to run.

While in the *AssistOS* folder run:

```sh
$ npm run build-all
```

If you are using Windows run:
```sh
$ npm run build-all-win
```
## Running

### Step 1: Launch the "server"

While in the *AssistOS* folder run:

```sh
$ npm run server
```

At the end of this command you get something similar to:

![alt text](scr-npm-run-server.png)

