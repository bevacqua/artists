'use strict';

var sortedUniqBy = require('lodash/sortedUniqBy');
var data = require('./data.json');
var categories = Object.keys(data);
var all = sortedUniqBy(categories.reduce(compacter, []).sort(insensitively), toText);
var names = all.map(toText);

function compacter (all, category) {
  return all.concat(data[category].map(categorized));
  function categorized (artist) {
    return {
      text: artist.text,
      href: artist.href,
      category: category
    };
  }
}
function insensitively (a, b) {
  return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
}
function insensitiveEql (a, b) {
  return insensitively(a, b) === 0;
}
function toText (artist) {
  return artist.text;
}

module.exports = {
  categorized: data,
  all: all,
  names: names
};
