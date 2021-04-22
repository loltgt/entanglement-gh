# entanglement-gh
 
For testing purpose — **under development**
 

This is a builder to create a one-page website profile to use in your GitHub Pages domain, for example: yourusername.github.io.

It supports various layout settings:
* **profile** sidebar with profile information.
* **repos** profile repositories
* **gists** profile gists
* **topics** profile topics

This is not the original software provided by GitHub which can be found in this repo: github/personal-website, now flagged as archived. It is not meant to be a replacement, it works differently while creating similar results.

It is written in JavaScript and makes use of GitHub's [REST API](https://docs.github.com/rest).

###### You can contribute by filling in issues, sending pull requests and actively participating in this project.

An example of websites that this software can create, *light* theme: [loltgt.github.io](https://loltgt.github.io), *dark* theme: [ctlcltd.github.io](https://ctlcltd.github.io).


## Why did I create it?

I needed a quick script, without having to download many dependencies or edit files. And to constantly update of repositories and gists on the client-side.


## Installation


There are multiple ways to install it.

You can clone this repository and install the necessary dependencies, you need **npm** before:

```
git clone https://github.com/loltgt/entanglement-gh
npm install
```

You can start a project with the **npm** dependency manager and put it in *devDependencies*.

```
npm init
npm install git+https://github.com/loltgt/entanglement-gh.git --save-dev
```

Note: loltgt/entanglement-gh is not present on **npm**, you need to install and include it as a **git** dependency.


## Configuration

To configure it you have to enter your GitHub username in the **config.json** file in the project root directory.

```
{
  "username": "yourUserName"
}
```

A detailed explanation of all settings can be found in [Advanced configuration](#advanced-configuration) section.


## Usage

To use it, just run the script with node `node index.js` or use one of the task presets:

preset | description
------------ | -------------
`npm run-script build` | Build all: js, css, html
`npm run-script build-js` | Build only js
`npm run-script build-css` | Build only css
`npm run-script build-html` | Build only html
`npm run-script watch` | Build and watch for changes all: js, css, html
`npm run-script watch-js` | Build and watch only js
`npm run-script watch-css` | Build and watch only css
`npm run-script watch-html` | Build and watch only html

Look at the **package.json** file under "scripts" for a complete list of available tasks.


## Customization

More customization can be achieved by manipulating files. To edit templates, if necessary, simply copy the contents of the folder "**template**", and change his position in the configuration file.

To make your own JS or CSS customisations, you can directly use these files in the root directory: **custom.js** and **custom.css** respectively.


## Deploy

In order to publish the created profile website, it is sufficient to create a main repository: *username.github.io* and copy the contents of the output directory "**out**" there.

More details on GitHub Pages can be found in the [official documentation](https://docs.github.com/pages).


## Advanced configuration

The configuration of the *config.json* file is explained below in all of the setting possibilities.

field | settings | example
------------ | ------------- | -------------
"username" | Your GitHub user name | String "yourUserName"
"theme" | Choose "light" (default) or "dark" | String "light"
"layout" | Composition of layout | Array [ "profile", "repos", ... , "gists", "topics" ]
"meta" | Meta tags' page | Object { "title": "The page title", "description": "The page description" }
"profile" | Profile infos to display | Object { "realname": false, "bio": false, "socials": false }
"repos" | Repositories | Object { "limit": 6, "include": [ "include-this-repo", ... ], "exclude": [ "exclude-this-repo", ... ], "sort": "updated", "order": "desc" }
"gists" | Gists | Object { "limit": 6, "include": [ "include-this-repo", ... ], "exclude": [ "exclude-this-repo", ... ], "sort": "updated", "order": "desc" }
"topics" | Topics | Array [ "a-topic", "another-topic", ... ]
"socials" | List of social pages | Array
"clientSide" | Use of client side dynamic | Array [ "repos", "gists" ]
"clientSideOptions" | More control over the client side | { "repos": { "limit": 100, "exclude": null }, ... }
"clientSideDebug" | Enable the debugger in the client side | Boolean
"stylesheets" | Assets static stylesheet | Array [ "./src/style.css", "./vendor/icons/style.css", "./custom.css" ]
"scripts" | Assets static scripts | Array [ "./src/script.js", "./custom.js" ]
"template_folder" | Template folder | String "./template"
"src_folder" | Source folder | String "./src",
"output_folder" | Output folder for deploy | String "./out"
"assets_folder" | Assets static folder | String "./out/assets"
"assets_stylesheet" | The single stylesheet will created | String "styles.css"
"assets_script" | The single script will created | String "scripts.js"
"serve" | Address and port to serve local site | String "0.0.0.0:8080"

The script loads the API predefined number of repositories and gists. If you want to force it to respect a certain limit of items you can add the parameter `"strict": true` to the individual *repos* and *gists* settings.

The dynamic page update with client side differs from the static site. This is due to limitations. If you want to have more control over the client side settings you can pass options for *repos* and *gists* via the parameter `"clientSideOptions": Object`.

⚠️ On the client side, there are limits of request numbers per visitor. So use the client side option at your known risk. Learn more about the [Rate limiting](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) in the official documentation.


## Credits

This project is available as open-source and was made with amazing libraries: node, npm, lodash, node-glob, clean-css, terser, http-server.

The icons used in are derived from the [Open Iconic](https://github.com/iconic/open-iconic) and [IcoMoon - Free](https://github.com/Keyamoon/IcoMoon-Free) projects.


## License

[MIT License](LICENSE).
