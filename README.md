# Casperfleet log parser

## Usage

Start by having all of the output of your test runs from [ec2-fleet-casper](https://github.com/nymedia/ec2-fleet-casper/) in a directory. For example `output`.

This directory should look like this:
```
output
- ec2-ip-1.aws-and-so-on
-- dump.tar.gz
- ec2-ip-2.aws-and-so-on
-- dump.tar.gz
- ec2-ip-3.aws-and-so-on
-- dump.tar.gz
...
```

Then just run `node start.js output`