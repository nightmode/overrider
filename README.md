# Overrider

A web browser extension for custom CSS and JavaScript overrides.

With no traditional UI, this extension is meant for developers who are comfortable working with raw CSS and JS files in order to customize their own experience on websites they visit.

## Navigation

* [Install](#install)
* [Usage](#usage)
* [License](#license)

## Install

Overrider is intended to be used as a developer addon.

For Chrome, navigate to `chrome://extensions` and enable developer mode. Then use `load unpacked` to select the root folder of overrider as the extension directory.

For Edge, navigate to `edge://extensions/` and enable developer mode. Then use `load unpacked` to select the root folder of overrider as the extension directory.

For Firefox, navigate to `about:debugging` and enable `add-on debugging`. Then use `load temporary add-on` and select the `manifest.json` file within the root folder of overrider. If FireFox does not load the extension, you may need to replace the background object inside `manifest.json` with the following code.

```
"background": {
    "scripts": ["background.js"]
}
```

## Usage

For CSS overrides, place a file with the full domain name and a `.css` extension into the `CSS` folder. For example, to customize Google Calendar first create a file called `css/calendar.google.com.css`. Next, save your custom styles into the file. Finally, reload a Google Calendar webpage to view your custom styles.

For JS overrides, place a file with the full domain name and a `.js` extension into the `JS` folder. For example, to run a custom function on Slack first create a file called `js/app.slack.com.js`. Next, save your custom JavaScript into the file. Finally, reload a Slack webpage to run your custom code.

CSS and JS file names must exactly match the address of the site you are visiting. There are no wildcards so making a file like `youtube.com.css` would not work if YouTube always insists on redirecting you to `www.youtube.com`. In this case renaming your custom CSS file to `www.youtube.com.css` would resolve the file naming issue.

## License

[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)

This work has been marked as dedicated to the public domain.