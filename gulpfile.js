var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var twig = require('gulp-twig');
var cssGlobbing = require('gulp-css-globbing');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync');
var runSequence = require('gulp4-run-sequence');
var gutil = require('gulp-util');
var watch = require('gulp-watch');

var svgSprite = require('gulp-svg-sprite');
var cheerio = require('gulp-cheerio');

var sass_config = {
    indentWidth: 4,
    outputStyle: 'compressed',
};

var cheerioConfig = {
    run: function($) {
        $('[fill]').removeAttr('fill');
    },
    parserOptions: {
        xmlMode: true
    }
};

var svgSpriteConfig = {
    mode: {
        symbol: {
            dest: 'svg',
            sprite: 'symbols.svg'
        }
    },
    svg: {
        dimensionAttributes: false
    }
};

gulp.task('svgSprite', function() {
    return gulp.src('svg/*.svg')
        .pipe(cheerio(cheerioConfig))
        .pipe(svgSprite(svgSpriteConfig))
        .pipe(gulp.dest('dist/'));
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

gulp.task('styles', function() {
    return gulp.src('sass/*.scss')
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
        .pipe(gulp.dest('dist/css/'));
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

gulp.task('copyJSON', function() {
    return gulp.src('json/**/')
        .pipe(gulp.dest('dist/json/'));
});

gulp.task('copyIMG', function() {
    return gulp.src('img/**/')
        .pipe(gulp.dest('dist/img/'));
});

gulp.task('copySVG', function() {
    return gulp.src('svg/**/')
        .pipe(gulp.dest('dist/svg/originals/'));
});

gulp.task('copyFonts', function() {
  return gulp.src('fonts/**/')
    .pipe(gulp.dest('dist/fonts/'));
});

gulp.task('watch', gulp.series(function() {
    browserSync({
        server: {
            baseDir: 'dist'
        },
        ghostMode: false,
        open: false
    });
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
    watch('js/**/*.js', function() {
        runSequence('compress', 'copyJS', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex JS!'));
        });
    });
    watch('json/**/*.json', function() {
        runSequence('compress', 'copyJSON', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex JSON!'));
        });
    });
    watch('img/**/', function() {
        runSequence('copyIMG', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex IMG!'));
        });
    });
    watch('svg/**/', function() {
        runSequence('svgSprite', 'copySVG', function() {
            browserSync.reload();
            gutil.log(gutil.colors.green('Done T-rex SVG!'));
        });
    });
}));


// Default gulp taskgulp
gulp.task('default', gulp.series('styles', 'compress', 'twig', 'copyJS', 'copyJSON', 'copyIMG', 'copySVG', 'svgSprite', 'copyFonts', 'watch'));
