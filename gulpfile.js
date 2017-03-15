var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var cssGlobbing = require('gulp-css-globbing');
var autoprefixer = require('gulp-autoprefixer');

var sass_config = {
    indentWidth: 4,
    outputStyle: 'compressed' ,
};

gulp.task('styles',  function() {
    return gulp.src( 'sass/*.scss')
        .pipe(cssGlobbing({
            extensions: ['.css', '.scss'],
            scssImportPath: {
                leading_underscore: false,
                filename_extension: false
            }
        }))
        .pipe(sass(sass_config))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest( 'dist/css/'));
});

gulp.task('compress', function() {
  return gulp.src('js/functions.js')
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest('dist/js/'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

//Watch task
gulp.task('default', ['styles', 'compress'], function() {
    gulp.watch('sass/**/*.scss',['styles']);
    gulp.watch('js/*.js',['compress']);
});
