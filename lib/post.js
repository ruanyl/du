var fs = require('fs');
var read = require('fs-readdir-recursive');
var yaml = require('js-yaml');
var url = require('url');
var ensureKeys = require('ensure-keys');
var log = require('./log');
var config = require('./config')();
var path = require('path');
var moment = require('moment');

/*
 * TODO: The time of posts should take timezone in to consideration
 */


var lsFile = function() {
  var postsList = read(config.postDir);
  return postsList;
};

var getPages = function() {
  var files = read(config.postDir);
  var posts = [];
  var pageSize = config.pageSize ? config.pageSize : 5;

  for(var i = 0; i < files.length; i++) {
    var postsPerFile;
    var postPath = path.join(config.postDir, files[i]);
    try {
      postsPerFile = yaml.safeLoad(fs.readFileSync(postPath));
    } catch (e) {
      console.log(e);
    }

    if(postsPerFile) {
      postsPerFile = postsPerFile.posts;
      postsPerFile.forEach(function(post) {
        ensureKeys(post, ['title', 'url'], function(missedKey) {
          log.error('*' + missedKey + '* should not empty');
          throw 'Error happened when processing: ' + postPath;
        });
        post = processPost(post);
        posts.push(post);
      });
    }

  }

  // sort posts by time
  posts = sort(posts);

  var pages = {};
  var pageNo = 1;

  // splice the posts array based on page size
  while(posts.length > 0) {
    pages['page' + pageNo] = posts.splice(0, pageSize);
    pageNo++;
  }

  return pages;
};

var sort = function(posts) {
  posts.sort(function(post1, post2) {
    return post2.time - post1.time;
  });
  return posts;
};

var processPost = function(post) {
  var tagStr = post.tag;

  post.tags = tagStr ? processTags(tagStr) : {};
  post.hostname = url.parse(post.url).hostname;
  post.time = moment(post.time).format('YY-MM-DD H:m:s');

  return post;
};

var processTags = function(tagStr) {
  var tags = [];
  var defaultTagColor = {
    HTML: '#e44b23',
    JS: '#f1e05a',
    ES6: '#f1e05a',
    ES7: '#f1e05a',
    COFFEE: '#244776',
    HTTP: '#00A1D9',
    HTTP2: '#00A1D9',
    ARCHITECTURE: '#04D9D9',
    REACT: '#61DAFB',
    REACTJS: '#61DAFB',
    ANGULAR: '#DD1B16',
    ANGULARJS: '#DD1B16'
  };

  tags = tagStr.replace(' ', '').split(',');
  tags = tags.map(function(tag) {
    var color = defaultTagColor[tag.toUpperCase()] ? defaultTagColor[tag.toUpperCase()] : '#2783BF';
    return {
      name: tag,
      color: color
    };
  });

  return tags;
};

module.exports = {
  getPages: getPages,
  lsFile: lsFile
};
