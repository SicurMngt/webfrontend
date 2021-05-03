const GhostContentAPI = require('@tryghost/content-api');

const api = new GhostContentAPI({
    //GHOST API CREDENTIALS AND SERVER URL
    url: 'https://cms.sicurtransport.com',
    key: '3768dafec2a0e1ba485ebb5fe0',
    version: 'v2'
});

var gulp = require('gulp');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var data = require('gulp-data');

var path = require('path');

var sass = require('gulp-sass');

var autoprefixer = require('gulp-autoprefixer');

var sourcemaps = require('gulp-sourcemaps');

var connect = require('gulp-connect');

var open = require('gulp-open');

var nunjucksRender = require('gulp-nunjucks-render');

var dateFilter = require('nunjucks-date-filter');

const jsonfile = require('jsonfile')

var JSONdata = {
    "posts": [],
    "pages": []
};

var Paths = {
    HERE: './',
    DIST: 'dist/',
    CSS: './dist/assets/css/',
    SCSS_TOOLKIT_SOURCES: './scss/material-kit.scss',
    SCSS: './scss/**/**'
};



gulp.task('build', function() {
    //load posts to JSONdata
    api.posts
        .browse({
            include: 'tags', limit:'all'
        })
        .then((posts) => {
            //console.log(posts)
            posts.forEach((post) => {
                JSONdata.posts.push(post);
            });

            //load pages to JSONdata
            api.pages
                .browse({
                    include: 'tags', limit:'all'
                })
                .then((pages) => {
                	
                	
                    pages.forEach((page) => {
                        JSONdata.pages.push(page);
                    });

                    // write JSONfile
                    jsonfile.writeFile('./mdata.json', JSONdata, function(err) {
                        if (err) console.error(err)
                    })

                    //nunjucks tasks
                    // Gets .html and .nunjucks files in pages
                    return gulp.src('html/pages/**/*.+(html|nunjucks)')
                        // adds data
                        .pipe(data(function() {
                            return require('./mdata.json')
                        }))
                        // Renders template with nunjucks
                        .pipe(nunjucksRender({
                            path: ['html/templates'],
                            manageEnv: function(environment) {
                                environment.addFilter('date', dateFilter);
                            },
                        }))
                        // output files in app folder
                        .pipe(gulp.dest('dist'))


                })
                .catch((err) => {
                    console.error(err);
                });

            // write file
        })
        .catch((err) => {
            console.error(err);
        });
});


/* SASS */
gulp.task('compile:scss', function() {
    return gulp.src(Paths.SCSS_TOOLKIT_SOURCES)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer())
        .pipe(sourcemaps.write(Paths.HERE))
        .pipe(gulp.dest(Paths.CSS));
});

/* END SASS */
gulp.task('watch', function(done) {
    gulp.watch(Paths.SCSS, ['compile:scss']);
    gulp.watch('html/**/*.+(html|nunjucks)', ['build']);
    gulp.watch('html/**/**/*.+(html|nunjucks)', ['build']);
    done();
});


gulp.task('server', function(done) {
    connect.server({
        host: "0.0.0.0",
        port: 9001,
        livereload: true,
		root:"dist"
    });
    done();
});

gulp.task('default', gulp.series(['watch', 'series'], function(done) {
    gulp.src(__filename)
        .pipe(open({
            uri: 'http://localhost:9001/'
        }));
	
    done();
}));
