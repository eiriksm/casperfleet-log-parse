var fs = require('fs');
var tar = require('tar');
var zlib = require('zlib');

var path = process.argv[2];

if (!path)  {
  throw new Error('No path specified');
}

function streamError(e, r) {
  console.error('ERROR!');
  console.log(e, r);
}

function exEnd(e, r) {
  console.log(e, r);
}

// Try to list all files in dir.
fs.readdir(path, function(e, r) {
  // Loop over each dir.
  if (e) {
    throw e;
  }
  r.forEach(function(n) {
    // There should be a dump.tar.gz file in there.
    var p = path + '/' + n + '/dump.tar.gz';
    fs.stat(p, function(e2, r2) {
      if (e) {
        return;
      }
      var exx = tar.Extract({path: __dirname + '/' + n})
      .on('error', streamError)
      .on('end', exEnd);
      var gunz = zlib.createGunzip();
      fs.createReadStream(__dirname + '/' + p)
      .on('error', streamError)
      .pipe(gunz)
      .pipe(exx);
    });
  });
});
