/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');
const package = require('./package.json');
const WebpackUserscript = require('webpack-userscript');

module.exports = {
    entry: './build/content.js',
    mode: 'production',
    output: {
        filename: `${package.name}-${package.version}.js`,
        path: path.resolve(__dirname, 'user-script-artifacts')
    },
    plugins: [
        new WebpackUserscript({
            headers: {
                name: "Better Mixer",
                namespace: 'https://github.com/TheUnlocked/',
                version: package.version,
                description: package.description,
                author: package.author,
                homepage: package.homepage,
                website: package.website,
                match: ['https://mixer.com/*', 'http://mixer.com/*'],
                icon: 'https://raw.githubusercontent.com/TheUnlocked/Better-Mixer/master/Extension/Icons/icon.png',

                "run-at": "document-body"
            },
            metajs: false,
            renameExt: false
        })
    ]
};