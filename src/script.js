/*! entanglement-gh 0.0.1 https://github.com/loltgt/entanglement-gh (MIT License) */

'use strict';

(function() {

function entanglement_gh() {
  const tpls = { repos: 'repo', gists: 'gist', topics: 'topic' };

  this.tpls = {};
  this.obj = { languageCode: LANGUAGE_CODE };
  this.requests = [];

  for (var i in LAYOUT) {
    const endpoint = LAYOUT[i];

    if (endpoint in tpls == false) return;

    const tpl = tpls[endpoint];
    const id = btoa(new Date().toJSON());
    const element = document.querySelector('.section.' + endpoint);

    // const id = endpoint; // local debug

    if ('entanglement_gh__' + tpl in globalThis == false) return;

    this.tpls[endpoint] = tpl;

    if (element) this.request(endpoint, id, element);
  }
}

entanglement_gh.prototype.request = function(endpoint, id, element) {
  if (this.requests.indexOf(id) != -1) return;
  if (endpoint in this.tpls === false) return;

  DEBUG && console.log('entanglement_gh', 'request', id);

  // this.mkref(endpoint, id, element); // local debug
  // globalThis['test_' + endpoint](); // local debug

  const self = this;
  const script = document.createElement('script');
  const options = CONFIG[endpoint];

  var qs = [];

  if (endpoint == 'repos') {
    if (options.order && typeof options.order == 'string') qs.push('direction=' + options.order);
    if (options.sort && typeof options.sort == 'string') qs.push('sort=' + options.sort);
    if (options.strict && options.limit && typeof options.limit == 'number') qs.push('per_page=' + options.limit);
  } else if (endpoint == 'gists') {
    if (options.since && typeof options.since == 'string') qs.push('since=' + options.since);
  }

  qs.push('callback=' + this.mkref(endpoint, id, element));

  const url = REST_API.replace('%username%', USERNAME) + '/' + endpoint + '?' + qs.join('&');

  script.id = 'entanglement_gh__' + id;
  script.type = 'text/javascript';
  script.async = true;
  script.src = url;

  script.onload = function() {
    self.requests.push(id);

    DEBUG && console.log('entanglement_gh', 'script', 1);
  }
  script.onerror = function() {
    DEBUG && console.error('entanglement_gh', 'script', 0);
  }

  document.head.appendChild(script);
}

entanglement_gh.prototype.mkref = function(endpoint, id, element) {
  const self = this;
  const uniqid = 'entanglement_gh__' + id;

  globalThis[uniqid] = function(response) {
    self.callback.call(self, endpoint, id, element, response);
  }

  return uniqid;
}

entanglement_gh.prototype.unref = function(id) {
  const uniqid = 'entanglement_gh__' + id;

  delete globalThis[uniqid];
}

entanglement_gh.prototype.callback = function(endpoint, id, element, response) {
  if (response) {
    DEBUG && console.log('entanglement_gh', 'callback', id, 1);
  } else {
    return DEBUG && console.error('entanglement_gh', 'callback', id, 0);
  }

  if (response.meta && response.data && response.meta.status == 200) {
    const options = CONFIG[endpoint];
    const tpl = this.tpls[endpoint];
    const data = (options.mandatory || endpoint == 'gists') ? response.data : this.filters(response.data, options);

    this.compile(tpl, element, data);
  } else {
    console.error('entanglement_gh', 'callback', id, -1);
  }

  this.unref(id); // remote only
}

entanglement_gh.prototype.filters = function(data, options) {
  function _include(o, z, k) {
    return o.filter(function(a) {
      if (z.indexOf(a[k]) != -1) return a;
    });
  }
  function _exclude(o, z, k) {
    return o.filter(function(a) {
      if (z.indexOf(a[k]) == -1) return a;
    });
  }
  function _sort(o, x, k) {
    var v = {};
    x.forEach(function(a) {
      v[a] = undefined;
    });
    o.forEach(function(a) {
      if (a[k] in v) v[a[k]] = a;
    });
    return Object.values(v).filter(Boolean);
  }
  function _order(o, k, u) {
    var d = /-\d{2}T\d{2}:/;
    var s = u == 'desc' ? 1 : 0;

    return o.sort(function(a, b) {
      if (d.test(a[k]) || d.test(b[k])) {
        return s ? Date.parse(b[k]) - Date.parse(a[k]) : Date.parse(a[k]) - Date.parse(b[k]);
      } else if (typeof a[k] == 'number' || typeof b[k] == 'number') {
        return s ? b[k] - a[k] : a[k] - b[k];
      } else if (typeof a[k] == 'string' || typeof b[k] == 'string') {
        return s ? (a[k].toUpperCase() > b[k].toUpperCase() && 1) : (a[k].toUpperCase() > b[k].toUpperCase() && -1);
      } else {
        return s ? 1 : -1;
      }
    });
  }
  function _limit(o, n) {
    return o.splice(0, n);
  }

  if (options.include && typeof options.include == 'object') {
    data = _include(data, options.include, 'name');
    data = _sort(data, options.include, 'name');
  }
  if (options.exclude && typeof options.exclude == 'object') {
    data = _exclude(data, options.exclude, 'name');
  }
  if (options.sort || options.order) {
    var sort, order;

    if (options.sort && typeof options.sort == 'string') {
      sort = options.sort + '_at';
    }
    if (options.order && typeof options.order == 'string') {
      order = options.order;
    } else {
      order = options.sort == 'full_name' ? 'asc' : 'desc';
    }

    data = _order(data, sort, order);
  }
  if (options.limit && typeof options.limit == 'number') {
    if (data.length !== options.limit) {
      data = _limit(data, options.limit);
    }
  }

  return data;
}

entanglement_gh.prototype.compile = function(tpl, element, data) {
  const cards = element.querySelector('.cards');
  const doc = document.createElement('div');
  doc.style = 'display: none;'

  document.body.appendChild(doc);

  for (var i in data) {
    var obj = Object.assign({}, this.obj);

    obj[tpl] = data[i];

    console.log('entanglement_gh__' + tpl);

    const item = globalThis['entanglement_gh__' + tpl](obj);

    doc.innerHTML = item;

    cards.appendChild(doc.firstElementChild);
  }

  document.body.removeChild(doc);
}

const REST_API = '%%REST_API%%';
const USERNAME = '%%USERNAME%%';
const LAYOUT = '%%LAYOUT%%';
const CONFIG = '%%CONFIG%%';
const LANGUAGE_CODE = '%%LANGUAGE_CODE%%';
const DEBUG = '%%DEBUG%%';

new entanglement_gh();

}());
