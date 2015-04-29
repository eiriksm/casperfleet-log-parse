var archivePath = process.argv[2];

if (!archivePath)  {
  throw new Error('No path specified');
}

require('./')(archivePath);
