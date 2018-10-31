'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
var mkdirp = require('mkdirp')

require('colors');
var async = require('async');
var tar = require('tar');
var ejs = require('ejs');

function logger() {
  var args = Array.prototype.slice.call(arguments);
  var color = 'green';
  var severity = '[DEBUG]';
  if (args[args.length - 1] === 'error') {
    args.splice(args.length - 1);
    color = 'red';
    severity = '[ERROR]'.yellow;
  }
  var str = util.format.apply(util, args)[color];
  var date = ('[' + new Date().toString() + ']').blue;
  console.log.apply(console, [date, severity, str]);
}

async function unzipAndExtract(archivePath, n, callback) {
  logger('Starting unzip and extract of', n);
  await mkdirp(path.join(__dirname, 'out', n))
  var p = path.join(archivePath, n, 'dump.tar.gz');
  var exx = tar.x({
    cwd: path.join(__dirname, 'out', n),
    file: path.join(__dirname, p)
  })
  .catch(callback)
  .then(callback);
}

function createDirSeries(archivePath, item) {
  return (function(dir, callback) {
    var p = path.join(archivePath, dir, 'dump.tar.gz');
    async.series([
      fs.stat.bind(fs, p),
      unzipAndExtract.bind(null, archivePath, dir)
    ], callback);
  }).bind(null, item);
}

function processLogFile(server, data, callback) {
  var lines = data.toString();
  logger('Processing log file for', server);
  var docs = lines.split("\n").map(function(line, i) {
    if (!line) {
      return {};
    }
    var data = JSON.parse(line);
    return {
      id: util.format('%s-%s-%s-%d', i, server, data.id, i),
      client: util.format('%s-%s', server, data.id),
      severity: data.type,
      server: server,
      body: data.message,
      date: data.date
    };
  });
  callback(null, {
    server: server,
    logs: docs
  });
}

function createIndex(server, callback) {
  return (function(item, cb) {
    var logPath = path.join('out', item, 'casper');
    async.waterfall([
      fs.readFile.bind(fs, path.join(logPath, 'out.log')),
      function(data, callback) {
        callback(null, data);
      },
      processLogFile.bind(null, item)
    ], cb);
  }).bind(null, server);
}

function extractAndProcess(archivePath, r, callback) {
  async.parallel(r.map(createDirSeries.bind(null, archivePath)), callback);
}

function writeIndexesToJson(data, callback) {
  logger('Will create indexes to JSON');
  async.parallel(data.map(function(item) {
    return fs.writeFile.bind(async, path.join('out', item.server + '.json'), JSON.stringify(item.logs), 'utf8');
  }), callback);
}

function processDirectories(archivePath, r, callback) {
  async.waterfall([
    async.parallel.bind(async, r.map(createDirSeries.bind(null, archivePath))),
    function (data, callback) {
      return async.parallel(r.map(createIndex), callback);
    },
    writeIndexesToJson
  ], function(errs) {
    if (errs) {
      throw errs;
    }
    logger('Generating output reports');
    async.waterfall([
      fs.readFile.bind(fs, path.join('templates', 'index.html'), 'utf8'),
      function renderTemplate(data, callback) {
        logger('Rendering template');
        callback(null, ejs.render(data, {servers: r}));
      },
      fs.writeFile.bind(fs, path.join('out', 'index.html')),
      fs.readFile.bind(fs, path.join('templates', 'script.js'), 'utf8'),
      fs.writeFile.bind(fs, path.join('out', 'script.js'))
    ], function(err, data) {
      callback();
    });
  });
}

module.exports = function(archivePath) {
  // Try to list all files in dir.
  logger('Processing directory', archivePath);
  async.waterfall([
    fs.readdir.bind(fs, archivePath),
    processDirectories.bind(null, archivePath)
  ], function(err) {
    if (err) {
      logger(err, 'error');
      throw err;
    }
    logger('Processing completed.');
  });
};
