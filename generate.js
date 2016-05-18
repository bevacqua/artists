const _ = require('lodash');
const contra = require('contra');
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const path = require('path');
const url = require('url');
const sources = [
  'https://en.wikipedia.org/wiki/Lists_of_musicians',
  'https://en.wikipedia.org/wiki/Lists_of_singers'
];
const rwikipage = /^https:\/\/en\.wikipedia\.org\/wiki\//i;

pullListsOfLists();

function pullListsOfLists () {
  contra.map(sources, (source, next) =>
    request(source, (err, res, body) => next(err, body)),
    parseListsOfLists
  );
}

function parseListsOfLists (err, pages) {
  if (err) {
    throw err;
  }

  const lists = _(pages)
    .map(page => cheerio.load(page))
    .map(($, i) => $('a[href]')
      .filter((i, el) => $(el).text().match(/^list of/i))
      .map((i, el) => $(el).attr('href'))
      .toArray()
      .map(href => url.resolve(sources[i], href))
    )
    .flatten()
    .value();

  contra.map(lists, (list, next) =>
    request(list, (err, res, body) => next(err, body)),
    parseListsOfArtists(lists)
  );
}

function parseListsOfArtists (endpoints) {
  return function (err, pages) {
    if (err) {
      throw err;
    }

    const artists = _(pages)
      .map(page => cheerio.load(page))
      .map(($, i) => $('a[href]')
        .filter((j, el) => $(el).parents('#mw-content-text').length === 1)
        .filter((j, el) => $(el).parents('.reflist,.navbox,#toc').length === 0)
        .filter((j, el) => $(el).parent('li,td').length === 1)
        .filter((j, el) => url.resolve(endpoints[i], $(el).attr('href')).match(rwikipage))
        .filter((j, el) => $(el).text().length > 3 && $(el).text().match(/[^\ds-]/))
        .map((j, el) => ({ text: $(el).text(), href: url.resolve(endpoints[i], $(el).attr('href')) }))
        .toArray()
      )
      .reduce((artists, links, i) => {
        artists[url
          .parse(endpoints[i])
          .pathname
          .replace(/^\/wiki\/(list_of_)?/i, '')
          .replace(/_/g, ' ')] = links;
        return artists;
      }, {});

    fs.writeFileSync('data.json', JSON.stringify(artists, null, 2) + '\n', 'utf8');
  };
}
