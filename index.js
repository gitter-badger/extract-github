'use strict';

var toString = Object.prototype.toString;

/**
 * Get accurate type information for the given JavaScript class.
 *
 * @param {Mixed} of The thing who's type class we want to figure out.
 * @returns {String} lowercase variant of the name.
 * @api private
 */
function type(of) {
  return toString.call(of).slice(8, -1).toLowerCase();
}

/**
 * Find an URL in a given data structure.
 *
 * @param {Object} data Data structure
 * @param {String} contains String to contain.
 * @returns {String}
 * @api private
 */
function url(data, contains) {
  if (!data) return undefined;

  var type = parse.type(data)
    , match;

  if ('string' === type && ~data.indexOf(contains)) return data;
  if ('object' === type) {
    if ('url' in data && (match = url(data.url, contains))) return match;
    if ('web' in data && (match = url(data.web, contains))) return match;
  }

  return undefined;
}

/**
 * Parse out github information from a given string or object. For the object
 * we assume that we're given an object with repository information as seen in
 * your package.json
 *
 * @param {String|Object} data The information that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function parse(data) {
  var http = /github.com[\/|:]([^\/]+)\/([^\/]+)[.git|\/]?/mig
    , githubio = /https?:\/\/(.*)\.github\.io\/([^\/]+)\/?/mig
    , travisci = /travis-ci\.org\/(.*)\/(.*)\.png/mig
    , type = type(data)
    , result;

  //
  // Try to extract github user name + repository information from a given
  // github URL or a simple path structure.
  //
  if ('string' === type) {
    data = data.replace('.git', '');      // Remove trailing .git's

    if (
         (result = http.exec(data))       // Regular Github URL.
      || (result = githubio.exec(data))   // Github Pages URL.
      || (result = travisci.exec(data))   // Travis-CI badges
    ) {
      return { user: result[1], repo: result[2] };
    } else if ((result = data.split('/')) && result.length === 2) {
      //
      // A simple user/repository based string
      //
      return { user: result[0], repo: result[1] };
    }
  } else if ('object' === type) {
    //
    // The structure already exists, assume a pre-parsed object.
    //
    if ('user' in data && 'repo' in data) return data;

    result = url(data.repository, 'github')
      || url(data.homepage, 'github')
      || url(data.issues, 'github')
      || url(data.bugs, 'github')
      || url(data, 'github');

    if (result) return parse(result);

    //
    // Still no result, attempt to parse out a Travis-CI badge from a README
    // property as the Travis-CI badges follow the same URL pattern as github
    // root URL's so we can use this to re-construct a project URL.
    //
    if ('string' === typeof data.readme) return parse(data.readme);
  }

  return undefined;
}

//
// Expose the module.
//
parse.url = url;
parse.type = type;
module.exports = parse;