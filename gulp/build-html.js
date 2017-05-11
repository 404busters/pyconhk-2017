//@flow
'use strict';

const gulp = require('gulp-help')(require('gulp'));
const data = require('gulp-data');
const util = require('gulp-util');
const path = require('path');
const htmldata = require('./includes/html-data');
const htmlurl = require('./includes/html-url-append');
const requireyml = require('require-yml');

// base path
const basepath = path.dirname(__dirname);

function swallowTopicRenderError(topic) {
  return function (error) {
    util.log(`Failed on '${util.colors.cyan('dev:html')}' ('${topic.id}'): ${error.toString()}`);
    this.emit('end')
  }
}

gulp.task('build:html', 'Build ./assets/pages/*.jinja into production HTML files', () => {
  const {Environment, FileSystemLoader} = require('nunjucks');
  const env = new Environment([
    new FileSystemLoader('assets/pages'),
    new FileSystemLoader('assets/layouts')
  ]);
  htmlurl.addFilters(env);

  gulp.src([
    'assets/pages/**/*.jinja',
    '!assets/pages/**/_*.jinja',
  ])
    .pipe(data(htmldata.fileData()))
    .pipe(require('gulp-nunjucks').compile({}, {env}))
    .pipe(require('gulp-htmlmin')({
      collapseWhitespace: true
    }))
    .pipe(require('gulp-rename')({
      extname: '.html'
    }))
    .on('error', util.log)
    .pipe(gulp.dest('public'));

  let assetData = requireyml(basepath + '/assets/data');

  for (let topic of assetData.topics.topics) {
    util.log(`Generate: '/topics/${util.colors.magenta(topic.id)}/index.html'`);
    var pageID = 'page--topics--' + topic.id;
    gulp.src(`assets/pages/topics/_topic.jinja`)
      .pipe(data(htmldata.fileData({
        topic,
        pageID,
      })))
      .pipe(require('gulp-nunjucks').compile({}, {
        env,
      }).on('error', swallowTopicRenderError(topic)))
      .pipe(require('gulp-rename')({
        dirname: topic.id,
        basename: 'index',
        extname: '.html',
      }))
      .on('error', util.log)
      .pipe(gulp.dest('public/topics'));
  }

});
