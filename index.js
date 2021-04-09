/*!
 * entanglement-gh
 *
 * @version 0.0.1
 * @copyright Copyright (C) Leonardo Laureti
 * @license MIT License
 */

//TODO writeFileSync
const { readFileSync, writeFileSync, watch: fsWatch } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const httpServer = require('http-server');
const path = require('path');
const glob = require('glob');
const https = require('http');
const lodash = require('lodash');
const CleanCSS = require('clean-css');
const { minify } = require('terser');



function config(file) {
  try {
    var data = readFileSync(file);

    if (! (typeof data == 'object' && data instanceof Buffer)) {
      throw 'config: Bad configuration file.';
    }

    data = data.toString();
    data = data.replace(/\/\/([^\r\n]+)|(\/[\*]+)(=?[\w\W]+?)(\*\/)/g, '');
    data = data.replace(/([\s]+)([\s]+)|[\r\n\t]+/g, '');
    data = data.replace(/\,(=?(?=\}))/g, '');
    data = JSON.parse(data);

    return data;
  } catch (err) {
    throw err;
  }
}


class request {

  constructor(url, endpoint, options) {
    this.request_url = url;
    this.request_options = {
      headers: {
        'User-Agent': 'entanglement-gh/0.0.1'
      }
    };

    return this.routine(endpoint, options);
  }

  routine(endpoint, options) {
    return new Promise((resolve, reject) => {
      this.request(this.request_url, endpoint, resolve, reject);
    });
  }

  request(url, endpoint, resolve, reject) {
    https.get(url, this.request_options, (response) => {
      this.process(response, endpoint, resolve, reject);
    }).on('error', (err) => {
      reject({ err });
    });
  }

  process(response, endpoint, resolve, reject) {
    switch (response.statusCode) {
      case 301:
      case 302:
      case 304:
      case 307:
      case 308:
        var url = response.headers.location;

        if (url) this.request(url, endpoint, resolve, reject);
        else reject({ err: 'Error:', status: response.statusCode, msg: 'Missing URL.' });
      break;

      case 403:
        this.parser(response).then((data) => {
          var msg = 'message' in data ? data.message : '';

          reject({ err: 'Error:', status: response.statusCode, msg });
        }).catch(err => {
          reject({ err, status: response.statusCode });
        });
      break;

      case 200:
      case 304:
        this.complete(response, endpoint, resolve, reject);
      break;

      default:
        reject({ err: 'Error:', status: response.statusCode, msg: 'Not a valid response.' });
    }
  }

  parser(response) {
    return new Promise((resolve, reject) => {
      var data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          data = JSON.parse(data);

          if (data.length === 0) {
            throw 'Empty data.';
          }

          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  complete(response, endpoint, resolve, reject) {
    this.parser(response).then((data) => {
      var partial = {};
      partial[endpoint] = data;

      resolve(partial);
    }).catch(err => {
      reject({ err });
    });
  }

}


class layout {

  constructor() {
    this.make.apply(this, arguments);
  }

  async make(tplBase, tpls, outFile, tplData, clientTpls) {
    this.templateBase = tplBase;
    this.outputFile = outFile;

    var parts = [];
    var templates = [];

    for (var tplName of tpls) {
      parts.push(await this.compile(tplName, tplData));
    }
    for (var clientTplName of clientTpls) {
      var template = await this.template(clientTplName);

      templates.push({ name: clientTplName, code: template });
    }

    var output = await this.compile('layout', { ...tplData, page: parts.join(''), templates });
    this.write(output);
  }

  template(tplName) {
    try {
      const tplFile = path.format({ dir: this.templateBase, name: tplName, ext: '.jst' });

      return readFile(tplFile);
    } catch (err) {
      throw err;
    }
  }

  async compile(tplName, tplData) {
    try {
      var data = await this.template(tplName);
      //TODO
      // data = data.toString().replace(/\n$/, '');
      var compiled = lodash.template(data);

      return compiled(tplData);
    } catch (err) {
      throw err;
    }
  }

  async write(output) {
    try {
      writeFile(this.outputFile, output);
    } catch (err) {
      throw err;
    }
  }

}


class assets {

  static async styles(files, dst, options) {
    try {
      var output = new CleanCSS(options).minify(files);
      writeFile(dst, output.styles);
    } catch (err) {
      throw err;
    }
  }

  static async scripts(files, dst, options) {
    try {
      var input = await Promise.all(files.map((file) => readFile(file)));
      var output = await minify(input.map((data) => data.toString()), options);
      writeFile(dst, output.code);
    } catch (err) {
      throw err;
    }
  }

}



const configFile = './config.json';

const CONFIG = config(configFile);

const CWD = process.cwd();
const TEMPLATE_FOLDER = path.relative(CWD, CONFIG.template_folder);
const SRC_FOLDER = path.relative(CWD, CONFIG.src_folder);
const OUTPUT_FOLDER = path.relative(CWD, CONFIG.output_folder);
const ASSETS_FOLDER = path.relative(CWD, CONFIG.assets_folder);

const REST_API = 'https://api.github.com/users/%username%';

var cached_data;



function log() {
  const colors = {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };
  var deep = arguments[1] ? arguments[1] : 0;
  var color = arguments[2] && colors[arguments[2]] ? colors[arguments[2]] : false;
  var msgs = [ ''.padStart(deep, '  '), arguments[0], ...Object.values(arguments).slice(3) ];

  if (! deep || deep === 2) {
    msgs.splice(0, 0, '\n');
    msgs.push('\n');
  }
  if (deep === 1 || deep === 3 || color) {
    msgs.splice(0, 0, color ? color : colors.green);
    msgs.push('\x1b[0m');
  }

  console.log(...msgs);
}


function scripts(depth = 1) {
  const assetFile = path.format({ dir: ASSETS_FOLDER, base: CONFIG.assets_script });

  assets.scripts(CONFIG.scripts, assetFile);

  log('scripts', depth);
}


function styles(depth = 1) {
  const assetFile = path.format({ dir: ASSETS_FOLDER, base: CONFIG.assets_stylesheet });

  assets.styles(CONFIG.stylesheets, assetFile);

  log('styles', depth);
}


function html(depth = 1) {
  const meta = CONFIG.meta;

  const outputFile = path.format({ dir: OUTPUT_FOLDER, base: 'index.html' });
  const assetStylesheetFile = path.relative(OUTPUT_FOLDER, path.format({ dir: ASSETS_FOLDER, base: CONFIG.assets_stylesheet }));
  const assetScriptFile = path.relative(OUTPUT_FOLDER, path.format({ dir: ASSETS_FOLDER, base: CONFIG.assets_script }));

  var tplData = {
    theme: 'theme' in CONFIG && CONFIG.theme ? CONFIG.theme : 'light',
    assets: {
      stylesheet: assetStylesheetFile,
      script: assetScriptFile
    }
  };

  var clientTpls = [];

  if (CONFIG.repos.clientSide) clientTpls.push('repo');
  if (CONFIG.gists.clientSide) clientTpls.push('gist');

  //TODO
  // limit
  // include
  // exclude
  fetch().then(function(data) {
    tplData.meta = {
      title: meta && 'title' in meta && !! meta.title ? meta.title : data.profile.login,
      description: meta && 'description' in meta && !! meta.description ? meta.description : '',
      image: data.profile.avatar_url
    };

    tplData.profile = data.profile;
    tplData.repos = 'repos' in data ? data.repos : false;
    tplData.gists = 'gists' in data ? data.gists : false;
    tplData.username = data.profile.login;

    // writeFileSync('./tmp/test', JSON.stringify(tplData));

    new layout(TEMPLATE_FOLDER, CONFIG.layout, outputFile, tplData, clientTpls);
  });

  log('html', depth);
}


function fetch() {
  if (cached_data) {
    return Promise.resolve(cached_data);
  }

  log('fetching from github ...', 0, 'cyan');

  var url, endpoints = [];
  var data = cached_data = {};

  const _resolved = () => {
    log('fetched', 0, 'cyan', 'ok');
    return true;
  }
  const _rejected = (reason) => {
    log('error requesting', 0, false, reason.err, reason.status ? reason.status : '', reason.msg ? reason.msg : '');
    return true;
  }

  if (! CONFIG.repos.clientSide) endpoints.push({ name: 'repos', options: CONFIG.repos });
  if (! CONFIG.gists.clientSide) endpoints.push({ name: 'gists', options: CONFIG.gists });

  return new Promise((resolve, reject) => {
    // url = REST_API.replace('%username%', CONFIG.username);
    url = 'http://0.0.0.0:8000/users/%username%';
    const tmp_url = url;

    new request(url, 'profile').then((initial) => {
      Object.assign(data, initial);

      if (endpoints.length) {
        Promise.all(endpoints.map((endpoint) => {
          // url = initial.profile[endpoint.name + '_url'];
          url = tmp_url + '/' + endpoint.name;

          return new request(url, endpoint.name, endpoint.options);
        })).then((partials) => {
          partials.forEach(function(partial) {
            Object.assign(data, partial);
          });

          _resolved() && resolve(data);
        }, reason => {
          _rejected(reason) && reject(reason);
        });
      } else {
        _resolved() && resolve(data);
      }
    }).catch(reason => {
      _rejected(reason) && reject(reason);
    });
  });
}


function watch(type) {
  log('watching ...');

  const typext = { js: 'js', css: 'css', jst: 'html' };

  var pattern = '{' + SRC_FOLDER + '/*.{js,css},' + TEMPLATE_FOLDER + '/*.jst}';

  switch (type) {
    case 'js': pattern = SRC_FOLDER + '/*.js'; break;
    case 'css': pattern = SRC_FOLDER + '/*.css'; break;
    case 'html': pattern = TEMPLATE_FOLDER + '/*.jst'; break;
  }

  glob(pattern, (err, files) => {
    if (err) throw err;

    for (var file of files) {
      fsWatch(file, (eventType, filename) => {
        if (eventType != 'change') return;

        const ftype = filename.match(/\.(js|css|jst)$/);

        if (ftype) build(typext[ftype[1]], 2);
      });
    }
  });
}


function build(type, depth) {
  log('building ...', depth);

  if (depth) depth++;

  switch (type) {
    case 'js': scripts(depth); break;
    case 'css': styles(depth); break;
    case 'html': html(depth); break;
    default: scripts(depth) || styles(depth) || html(depth);
  }
}


function serve() {
  var address = CONFIG.serve.match(/([^:]+):([0-9]+)/);

  if (! address) throw 'Bad address in "serve" configuration parameter.';

  var server = httpServer.createServer({ root: OUTPUT_FOLDER });

  server.listen(address[2], address[1]);

  log('serving at ' + address[0] + ' ...');
}


function router() {
  const argv = process.argv;
  var arg_type = argv[2] == 'watch' && argv[3] ? argv[3] : argv[2] != 'watch' ? argv[2] : null;
  var arg_watch = argv[2] == 'watch' ? true : false;

  if (arg_type) arg_type = arg_type.toString();

  build(arg_type);

  if (arg_watch) watch(arg_type);

  serve();
}


router();
