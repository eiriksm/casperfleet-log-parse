/*global lunr, jQuery, servers, Mustache*/
;(function($) {
  'use strict';
  var totalServers = 0;
  var foundServers = 0;
  var serverData = [];
  var filters = [];
  var query = '';

  var filterTemplate = '{{#filters}}<li><a href="javascript:;" class="filter" data-filter="{{key}}">{{key}}: {{value}}</li>{{/filters}}';

  var template = '<tr>' +
    '<td><a href="javascript:;" class="filterer" data-filter="server" data-id="{{server}}">{{server}}</a></td>' +
    '<td><a href="javascript:;" class="filterer" data-filter="client" data-id="{{clientData.id}}">{{clientData.name}}</a></td>' +
    '<td><a href="javascript:;" class="filterer" data-filter="severity" data-id="{{severity}}">{{severity}}</a></td>' +
    '<td>{{{rendered_body}}}</td>' +
  '</tr>';

  function renderResults() {

    var data = serverData.filter(function(doc) {
      if (!doc.client) {
        return false;
      }
      var fits = true;
      if (query.length) {
        fits = doc.body.indexOf(query) > -1 ||
          doc.client.indexOf(query) > -1 ||
          doc.severity.indexOf(query) > -1;
      }
      filters.forEach(function(filter) {
        if (fits) {
          fits = doc[filter.key] === filter.value;
        }
      });
      return fits;
    }).map(function(doc) {
      doc.clientData = {
        id: doc.client,
        name: doc.client.match(/com-[a-z|0-9]+/).toString().replace('com-', '')
      };
      doc.rendered_body = doc.body;
      if (doc.body.indexOf('Capturing') > -1) {
        doc.rendered_body = '<a href="' + doc.server + '/' + doc.body.match(/.[a-z]*\/.*.png/) + '">' + doc.body + '</a>';
      }
      return Mustache.render(template, doc);
    });
    data.unshift('<tr><th>Server</th><th>Client</th><th>Verbosity</th><th>Body</th></tr>');
    $('#renderTable')
    .empty()
    .html(data);

    $('#filters')
    .empty()
    .html(Mustache.render(filterTemplate, {filters: filters}));

    $('#results')
    .empty()
    .html((data.length - 1) + ' results');

  }

  function readyCheck(data) {
    serverData = serverData.concat(data);
    foundServers++;
    if (foundServers === totalServers) {
      // Start to render.
      renderResults();
    }
  }

  servers.forEach(function(s) {
    totalServers++;
    // Get data from this server.
    jQuery.ajax({
      url: s + '.json'
    }).then(readyCheck);
  });

  // Attach events.
  $(document).ready(function() {
    $('#searcher').keyup(function() {
      query = $(this).val();
      renderResults();
    });

    $('#renderTable').on('click', '.filterer', function() {
      filters.push({key: $(this).attr('data-filter'), value: $(this).attr('data-id')});
      renderResults();
    });

    $('#filters').on('click', '.filter', function() {
      var key = $(this).attr('data-filter');
      filters = filters.filter(function(n) {
        return n.key !== key.trim();
      });
      renderResults();
    });
  });

})(jQuery);
