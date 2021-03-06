# Better-Mixer
Improvements to Mixer, similar to FFZ for Twitch. Available for both [Google Chrome](https://bit.ly/bettermixer) and [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/bettermixer/). The Chrome build should also support all Chromium-based browsers which allow you to install Chrome webstore extensions (e.g. Edge, Opera, Brave).

Join the [Better Mixer Discord server](https://discord.gg/mrr5Vtf) to report bugs, get help, request features, and chat with the developers!

## For Streamers
Go to the [Better Mixer self-service](https://theunlocked.github.io/bettermixer/selfservice) to add FFZ/BTTV emotes to your channel.

## For Firefox Reviewers
This extension is packaged for release with these commands:
```sh
# Node 12+
npm install --save-dev
npm run package
```

# How to contribute
## How to file bug reports/feature requests
Visit the Issues tab and check if your bug report/feature request has already been submitted. If it has not (or if the issue has been erronously closed), you may open a new issue. Please describe what occurred or what you want in as much detail as possible.

In the case of a bug report, if you know how to do so, provide the console logs (either as a screenshot or saved as a .log file) and, if the issue is memory-related, provide a heap snapshot.

## How to develop
1. Clone this repo.
2. If developing on Chrome, go to chrome://extensions and enable developer mode in the upper left.
3. Click the "Load Unpacked" button and select the "Extension" folder.
4. You're good to go. Make sure to disable the Chrome Webstore version so you don't have two instances of Better Mixer running at once. Visual Studio Code is the recommended editor (and it's the one I use), but any JavaScript editor should suffice.

For Firefox, set up the development environment below and run the `serve:firefox` npm script.

_Note: Do NOT add additional dependencies without first asking to see if it's okay. This includes JavaScript libraries, build tools, and external stylesheets._

## How to submit changes
1. Before starting work on your contribution, it's advised to say something in the Issues tab, either by opening a feature request or saying that you'll work on a bug fix. This is not required, but it will give me an opportunity to let you know if your contribution is likely to be rejected before you spend a large amount of time on it.
2. Write your fix/feature (see above).
3. Make a pull request. Feel free to PR into master (I'll redirect the PR into a new branch if necessary).

# NPM Scripts
```sh
# Run ESLint manually
npm run lint

# Fix linting errors where possible
npm run lint:fix

# Build the extension with sourcemaps
npm run build:dev

# Build the extension without sourcemaps
npm run build

# Build the extension with sourcemaps and start watching for changes
npm run watch

# Start Firefox with the extension installed
# Note that this does not start a watch,
# so you should have a watch running alongside this
# for the smoothest experience
npm run serve:firefox

# Start Chrome with the extension installed
# The advice for serve:firefox still applies
npm run serve:chrome

# Build and package extension
npm run package

# Build and package the extension as a user script
npm run package:script
```

# Development Environment
Better Mixer uses various tools to make development run as smoothly as possible. To set these up, install node, and then run
```sh
npm install --save-dev
```
To avoid requiring any global package installs, `gulp-cli` is listed as a devDependency rather than a global install. If you wish to use gulp CLI tools on your command line, you'll need to install `gulp-cli` globally:
```sh
npm install -g gulp-cli
```

If you're using Visual Studio Code, install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and add these lines to your workspace settings:
```json
{
    "eslint.enable": true,
    "eslint.options": {
        "configFile": ".eslintrc",
        "extensions": [".js", ".ts"]
    },
    "eslint.lintTask.enable": true,
    "eslint.validate": [
        "javascript",
        {
            "language": "typescript",
            "autoFix": true
        },
    ]
}
```
Optionally, you can also add these lines which provide the schema for `manifest.json`, though it's unlikely that they will be necessary.
```json
{
    "json.schemas": [
        {
            "fileMatch": [
                "/Extension/manifest.json"
            ],
            "url": "http://json.schemastore.org/chrome-manifest"
        }
    ]
}
```