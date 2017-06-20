var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var twig = require('gulp-twig');
var cssGlobbing = require('gulp-css-globbing');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var gutil = require('gulp-util');
var watch = require('gulp-watch');

var sass_config = {
    indentWidth: 4,
    outputStyle: 'compressed' ,
};

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: 'dist'
        },
        ghostMode: false,
        open: false
    });
});

gulp.task('twig', function() {
    return gulp.src(['twig/pages/**/*.twig'], {
            base: 'twig/pages/'
        })
        .pipe(twig({
            data: false ? require('twig/data.js') : {},
            functions: '',
            onError: function(event) {}
        }))
        .pipe(gulp.dest('dist/'));
});

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

gulp.task('copyJS', function() {
  return gulp.src('js/**/*.js')
    .pipe(gulp.dest('dist/js/'));
});

gulp.task('copyIMG', function() {
  return gulp.src('img/**/')
    .pipe(gulp.dest('dist/img/'));
});

// Default gulp taskgulp
gulp.task('default', ['styles', 'compress', 'twig', 'copyJS', 'copyIMG', 'watch']);


gulp.task('watch', ['browser-sync'], function() {
    watch('twig/**/*.twig', function() {
        runSequence('twig', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex TWIG!'));
        });
    });
    watch('sass/**/*.scss', function() {
         runSequence('styles', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex STYLES!'));
        });
    });
    watch('js/*.js', function() {
         runSequence('compress', 'copyJS', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex JS!'));
        });
    });
    watch('img/**/', function() {
         runSequence('copyIMG', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex IMG!'));
        });
    });
});