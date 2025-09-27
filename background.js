'use strict'

//-----------------
// Brower Variable
//-----------------
const browser = { // will hold various functions
    'runtime': {
        // getManifest
    },
    'scripting': {
        // executeScript
        // insertCSS
    },
    'tabs': {
        // onUpdated
    }
} // browser

//---------
// Aliases
//---------
browser.runtime.getManifest = chrome.runtime.getManifest

browser.tabs.onUpdated = chrome.tabs.onUpdated

//----------------
// Local Variable
//----------------
const local = {
    'function': { // will hold various functions
        // add_listeners
        // clear_ignore_list
        // inject_file
        // listener_tab_updated
        // log
        // start
        // url_to_hostname
    },
    'ignore': {
        // domains that did not have a corresponding css or js file on disk the last time an injection was attempted
        'css': [
            // 'microsoft.com'
        ],
        'js': [
            // 'microsoft.com'
        ]
    },
    'setting': {
        'clear_ignore_list': true, // if true, run the clear_ignore_list() function every so often to allow humans to inject new files without having to reload the extension, set to false for much better performance but remember that any new css or js override files may require an extension reload or browser restart to clear the ignore list
        'clear_interval': 60000, // how often the clear_ignore_list() function should be run in milliseconds, this setting has no effect if local.setting.clear_ignore_list is set to false
        'log': true // verbose logging for development, set to false for better performance
    },
    'timer': { // setTimeout references
        'clear_ignore_list': '' // will become a setTimeout call to run clear_ignore_list() when needed
    },
    'version': browser.runtime.getManifest().version // getManifest is not a promise
} // local

//-----------
// Functions
//-----------
const add_listeners = local.function.add_listeners = function add_listeners() {
    /*
    Add event listeners.
    */
    browser.tabs.onUpdated.addListener(listener_tab_updated)

    log('add_listeners -> listeners active')
} // add_listeners

const execute_script = browser.scripting.executeScript = function browser_scripting_executeScript(injection) {
    /*
    Execute a client script in a tab.

    @param   {Object}  injection  Injection object. More info at https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript
    @return  {*}                  Promise that returns nothing if successful or an error if unsuccessful.
    */

    return new Promise(function(resolve, reject) {
        try {
            chrome.scripting.executeScript(injection, function() {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    resolve()
                } // if
            })
        } catch (error) {
            reject(error)
        } // try
    }) // promise
} // execute_script

const insert_css = browser.scripting.insertCSS = function browser_scripting_insertCSS(injection) {
    /*
    Insert a client stylesheet into a tab.

    @param   {Object}  injection  Injection object. More info at https://developer.chrome.com/docs/extensions/reference/scripting/#method-insertCSS
    @return  {*}                  Promise that returns nothing if successful or an error if unsuccessful.
    */

    return new Promise(function(resolve, reject) {
        try {
            chrome.scripting.insertCSS(injection, function() {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError)
                } else {
                    resolve()
                } // if
            })
        } catch (error) {
            reject(error)
        } // try
    }) // promise
} // insert_css

const clear_ignore_list = local.function.clear_ignore_list = function clear_ignore_list() {
    /*
    Clear the local.ignore css and js array lists in order to allow humans to inject new files without having to reload the extension
    */

    clearTimeout(local.timer.clear_ignore_list)

    if (local.setting.clear_ignore_list === false) {
        return 'early'
    } // if

    local.ignore.css = []
    local.ignore.js  = []

    log('clear_ignore_list -> cleared ignore lists')

    local.timer.clear_ignore_list = setTimeout(
        clear_ignore_list,
        local.setting.clear_interval // 60 seconds by default
    )
} // clear_ignore_list

const inject_file = local.function.inject_file = async function inject_file(file, tab_id, hostname) {
    /*
    Attempt to inject a CSS or JS file into a tab.

    @param  {String}  file      Path to a CSS or JS file.
    @param  {Number}  tab_id    ID of the tab to inject a CSS or JS file into.
    @param  {String}  hostname  Hostname like "www.microsoft.com".
    */

    const details = {
        files: [file], // chrome api reference says only one file is supported here currently, last checked on March 30, 2021
        target: {
            'allFrames': false,
            'tabId': tab_id
        }
    } // details

    const file_type = (file.slice(-4) === '.css') ? 'css' : 'js'

    try {
        if (file_type === 'css') {
            // inject a CSS file
            await browser.scripting.insertCSS(details)

            log('inject_file -> injected css into "' + hostname + '"')
        } else {
            // inject a JS file
            await browser.scripting.executeScript(details)

            log('inject_file -> injected js into "' + hostname + '"')
        } // if
    } catch (error) {
        // log('inject_file -> inject error ->', error.message)

        if (file_type === 'css') {
            // add hostname to CSS ignore list
            local.ignore.css.push(hostname)

            log('inject_file -> added "' + hostname + '" to css ignore list')
        } else {
            // add hostname to JS ignore list
            local.ignore.js.push(hostname)

            log('inject_file -> added "' + hostname + '" to js ignore list')
        } // if
    } // try
} // inject_file

const listener_tab_updated = local.function.listener_tab_updated = function listener_tab_updated(tab_id, change_info, tab) {
    /*
    Listener function for browser.tabs.onUpdated events.

    @param  {Number}  tab_id       ID of the tab that was updated.
    @param  {Object}  change_info  Various change information. More info at
        https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/onUpdated#changeInfo
    @param  {Object}  tab          Various tab information. More info at
        https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
    */

    if (change_info.status !== 'complete') {
        // page is not ready yet
        return 'early'
    } // if

    const hostname = url_to_hostname(tab.url)

    if (hostname === "" || hostname.includes('.') === false) {
        return 'early'
    } // if

    const inject = [] // empty by default but may get "css" and "js" strings

    if (local.ignore.css.includes(hostname) === false) {
        // the hostname does not exist in the css ignore list
        inject.push('css')
    } // if

    if (local.ignore.js.includes(hostname) === false) {
        // the hostname does not exist in the js ignore list
        inject.push('js')
    } // if

    if (inject.length === 0) {
        // nothing to inject
        return 'early'
    } // if

    for (const type of inject) {
        const file = '/overrides/' + type + '/' + hostname + '.' + type

        inject_file(file, tab_id, hostname) // async function but no need to wait for it
    } // for
} // listener_tab_updated

const log = local.function.log = function log(...any) {
    /*
    Log to the console, if allowed.

    @param  {*}  any  Any one or more things that can be logged to the console.
    */

    if (local.setting.log) {
        console.log(...any)
    } // if
} // log

const start = local.function.start = async function start() {
    /*
    Start Overrider.
    */

    add_listeners()

    clear_ignore_list() // this function will run every so often if local.setting.clear_ignore_list is true, otherwise this function will only run once

    log('start -> done')
} // start

const url_to_hostname = local.function.url_to_hostname = function url_to_hostname(url) {
    /*
    Return the hostname for a HTTP or HTTPS URL if possible, otherwise an empty string.

    @param   {String}  url  URL like "https://www.microsoft.com".
    @return  {String}       Hostname like "www.microsoft.com".
    */

    let result = '' // default

    try {
        const obj = new URL(url)

        if (obj.protocol === 'http:' || obj.protocol === 'https:') {
            result = obj.hostname.replace(/[\[\]]/g, '') // replace ipv6 brackets
        } // if
    } catch (error) {
        // url is probably an empty string
        // log('url_to_hostname -> error', error)
    } // try

    return result
} // url_to_hostname

//-------
// Start
//-------
start()