/*globals require*/
var Q = require('q');

/**
 * from a digital ocean networks descriptor object, return the
 * array of accessible IP addresses.
 */
var QUERY_IP_TIMER = 1;  // TODO: Set a maximum timeout to reject promise?
function queryIpAddress(client, dropletId) {
  'use strict';
  var deferred = Q.defer();

  function _queryIpAddress() {
    client.dropletsGetById(dropletId, function (err, res, body) {
      // Extract IP addresses from the networks property
      var networks = body.droplet.networks;
      var addrs = [];
      Object.keys(networks).forEach(function (type) {
        networks[type].forEach(function (address) {
          if (address.type === "public" && address.ip_address) {
            addrs.push(address.ip_address);
          }
        });
      });

      // Retry after timeout if there are no IPs, otherwise fulfill with IP array
      if (addrs.length === 0) {
        setTimeout(_queryIpAddress, QUERY_IP_TIMER * 1000);
      } else {
        deferred.resolve(addrs);
      }      
    });
  }

  _queryIpAddress();
  return deferred.promise;
}

/**
 * Wait for a Digital Ocean action to complete
 */
var EVENT_POLL_TIMER = 1;
function waitForAction(client, dropletId, actionId) {
  'use strict';
  var deferred = Q.defer();
  function _getAction() {
    client.dropletsGetAction(dropletId, actionId, function (err, res, body) {
      var status = body.action.status;
      if (status === "completed") {
        return deferred.resolve();
      } else if (status === "errored") {
        return deferred.reject();
      } else {
        setTimeout(_getAction, EVENT_POLL_TIMER * 1000);
      }
    });
  }
  _getAction();
  return deferred.promise;
}

/**
 * Turn on a droplet if it is not active.
 */
function startServer(client, dropletId) {
  'use strict';
  var deferred = Q.defer();
  client.dropletsRequestAction(dropletId, {"type": "power_on"}, function (err, res, body) {
    if (err) {
      deferred.reject(err);
    } else {
      waitForAction(client, dropletId, body.action.id).then(function() {
        return deferred.resolve();
      });
    }
  });
  return deferred.promise;
}

/**
 * Given a clientID, accessToken, target name, and ssh public key
 * make sure there is a droplet with requested name that exists and is powered on.
 * returns the endpoint host & port for connections.
 */
module.exports = function provisionServer(accessToken, name, sshKey) {
  'use strict';
  var DigitalOcean = require('do-wrapper'),
    client = new DigitalOcean(accessToken, 25),
    deferred = Q.defer();

  client.dropletsGetAll({}, function (err, res, body) {
    // Check if there is an existing droplet with name, and start it
    var droplets = body.droplets;
    if (err) {
      return deferred.reject(err);
    }
    var i;
    for (i = 0; i < droplets.length; i += 1) {
      if (droplets[i].name === name) {
        if (droplets[i].status === "active") {
          return deferred.resolve(queryIpAddress(client, droplets[i].id));
        } else {
          return startServer(client, droplets[i].id).then(function() {
            deferred.resolve(queryIpAddress(client, droplets[i].id));
          });
        }
      }
    }

    // Otherwise start a new droplet
    // First register our public SSH key with this account
    client.accountAddKey({
      name: name + " Key",
      public_key: sshKey
    }, function (err, res, body) {
      // TODO: Handle error case where key already exists
      // Then create the droplet
      var sshKeyId = body.ssh_key.id;
      var config = {
        name: name,
        region: "nyc3",
        size: "512mb",
        image: "ubuntu-14-04-x64",
        ssh_keys: [sshKeyId]
      };
      client.dropletsCreate(config, function (err, res, body) {
        var droplet = body.droplet;
        waitForAction(client, droplet.id, body.links.actions[0].id).then(function() {
          deferred.resolve(queryIpAddress(client, droplet.id));
        });
      });
    });
  });

  return deferred.promise;
}
