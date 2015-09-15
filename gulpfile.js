"use strict";

var gulp = require("gulp");
var babel = require("gulp-babel");
var cssnext = require("gulp-cssnext");
var concat = require("gulp-concat");
var plumber = require("gulp-plumber");
var exec = require('child_process').exec;

var cssSrc = "web/static/css/*.css";
var cssDest = "priv/static/css";

var jsSrc = "web/static/js/**/*.js*";
var jsDest = "priv/static/js";

var exjsSrc = 'web/static/exjs/**/*.exjs';


function reportChange(event){
  console.log("File " + event.path + " was " + event.type + ", running tasks...");
}

gulp.task("build-css", function() {
  gulp.src(cssSrc)
      .pipe(cssnext({
          compress: true
      }))
      .pipe(gulp.dest(cssDest));
});

gulp.task('build-exjs', function(cb) {
  var ex2jsCommand = '/usr/local/ex2js/bin/ex2js "' + exjsSrc + '" -r "js" -o ' + '"web/static/js"';
  exec(ex2jsCommand, function (err, stdout, stderr) {
    cb(err);
  });
});

gulp.task("build-js", ['build-exjs'], function() {
  return gulp.src(jsSrc)
      .pipe(plumber())
      .pipe(babel({sourceMap: false, modules: "system"}))
      .pipe(gulp.dest(jsDest));
});

gulp.task("build", ["build-js", "build-css"]);


gulp.task("watch", ["build"], function() {
  gulp.watch([exjsSrc, cssSrc], ["build"]).on("change", reportChange);
});


gulp.task("default", ["build"]);
