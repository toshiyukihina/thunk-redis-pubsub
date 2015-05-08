'use strict';

var redis = require('thunk-redis'),
    Promise = require('bluebird'),
    yargs = require('yargs')
      .usage('$0 command')
      .options({
        'p': {
          alias: 'port',
          demand: true,
          default: 6379,
          describe: 'Port number',
          type: 'number'
        }
      })
      .command('pub', 'publish mode')
      .command('sub', 'subscribe mode')
      .demand(1, 'must provide a valid command');

var publish = function(client, argv) {
  client
    .on('connect', function() {
      console.log('* connect');
      client.publish(argv.channel, argv.message).then(function(res) {
        console.log(res);
      }).catch(function(e) {
        console.log(e);
      }).finally(function() {
        client.clientEnd();
      });
    });
};

var subscribe = function(client, argv) {
  client
    .on('connect', function() {
      client.subscribe(argv.channel).then(function() {
        console.log('subscribed: channel=%s', argv.channel);
      }).catch(function(e) {
        console.log(e);
      });
    })
    .on('message', function(channel, message) {
      console.log('* message: (%s, %s)', channel, message);
    });
};


// Execute command
(function() {
  var client = redis.createClient(yargs.argv.port, { usePromise: Promise });
  client
    .on('warn', function(e) {
      console.warn(e);
    })
    .on('error', function(e) {
      console.error(e);
    });

  var f = {};

  f.pub = function() {
    yargs.reset()
      .usage('node $0 pub <channel> <message>')
      .demand(['c', 'm'])
      .alias('c', 'channel')
      .alias('m', 'message');
    publish(client, yargs.argv);
  };

  f.sub = function() {
    yargs.reset()
      .usage('node $0 sub <channel>')
      .demand('c')
      .alias('c', 'channel');
    subscribe(client, yargs.argv);
  };

  var command = yargs.argv._[0];
  f[command]();
})();
