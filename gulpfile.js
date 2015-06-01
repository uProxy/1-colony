/**
 * gulpfile for colony
 *
 * Here are the common tasks used:
 * build
 * - Lint and compile
 * - (default Grunt task)
 * test
 *  - Run all tests
 * jsdoc
 *  - Generate jsdoc documentation
 **/
var gulp = require("gulp");
var jshint = require("gulp-jshint");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var pkgify = require("pkgify");
var path = require("path");
var spawn = require("child_process").spawn;

gulp.task("build_digitalocean", function() {
  "use strict";
  var entry = require.resolve("digitalocean-api");
  var filename = path.basename(entry);
  var bundle = function() {
    return browserify({
      entries: [ entry ],
      debug: true
    }).transform(pkgify, {
      packages: {
        request: path.relative(__dirname, require.resolve("browser-request"))
      },
      relativeTo: __dirname
    }).bundle()
      .pipe(source(filename))
      .pipe(buffer())
      .pipe(gulp.dest("./client/www/build/"));
  };
  return bundle();
});

gulp.task("lint", function() {
  "use strict";
  return gulp.src([
      "*.json",
      "client/common/**/*.js",
    ]).pipe(jshint({ lookup: true }))
    .pipe(jshint.reporter("default"));
});

var cordovaTask = function(args, cb) {
  var proc = spawn(require.resolve("cordova/bin/cordova"), args, {
    cwd: "client/"
  });
  proc.stdout.on('data', function (data) {
    console.log(data.toString().trim());
  });
  proc.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });
  proc.on('close', function (code) {
    console.log('child process exited with code ' + code);
    cb();
  });
};

gulp.task("cordova_build", cordovaTask.bind({}, [ "build" ]));
gulp.task("cordova_emulate", cordovaTask.bind({}, [ "emulate", "android" ]));

gulp.task("build", [ "build_digitalocean" ]);
gulp.task("test", [ "lint" ]);
gulp.task("default", [ "build", "test" ]);