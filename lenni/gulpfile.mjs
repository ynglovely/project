import autoprefixer from "autoprefixer";
import server from "browser-sync";
import del from "del";
import gulp from "gulp";
import minify from "gulp-csso";
import formatHtml from "gulp-format-html";
import imagemin from "gulp-imagemin";
import less from "gulp-less";
import postcss from "gulp-postcss";
import rename from "gulp-rename";
import svgstore from "gulp-svgstore";
import terser from "gulp-terser";
import imagemin_gifsicle from "imagemin-gifsicle";
import imagemin_mozjpeg from "imagemin-mozjpeg";
import imagemin_optipng from "imagemin-optipng";
import include from "include";
import plumber from "plumber";
import sortMediaQueries from "postcss-sort-media-queries";

const resources = {
    html: "src/html/**/*.html",
    jsDev: "scr/scripts/dev/*.js",
    jsVendor: "scr/scripts/vendor/*.js",
    less: "src/styles/**/*.less",
    static: [
        "src/assets/icons/**/*.*",
        "src/assets/fonts/**/*.{woff,woff2}"
],
    images: "src/assets/images/**/*.{png,jpg,jpeg,webp,gif,svg}",
    svgSprite: "src/assets/svg-sprite/*.svg",

};

function clean() {
    return del("dist")
};

function includeHtml() {
    return gulp
    .src("src/html/**/*.html")
    .pipe(plumber())
    .pipe(
        include({
            prefix: "@@",
            basepath: "@file"
        })
    )
    .pipe(formatHtml())
    .pipe(gulp.dest("dist"));
}

function style() {
    return gulp
    .src("src/style/styles.less")
    .pipe(plumber())
    .pipe(less())
    .pipe(
        postcss([
            autoprefixer({ overrideBrowserslist: ["last 4 versions"]}),
            sortMediaQueries({
                sort: "desktop-first"
            })
        ])
        
    )
    .pipe(gulp.dest("dist/styles"))
    .pipe(minify())
    .pipe(rename("styles.min.css"))
    .pipe(gulp.dest("dist/styles"));
}

function js() {
    return gulp
    .src("src/scripts/dev/*.js")
    .pipe(plumber())
    .pipe(
    include({
        prefix: "//@@",
        basepath: "@file"
    })
    )
    .pipe(gulp.dest("dist/scripts"))
    .pipe(terser())
    .pipe(
    rename(function (path) {
        path.basename += ".min";
    })
    )
    .pipe(gulp.dest("dist/scripts"));
}

function jsCopy() {
    return gulp
    .src(resources.jsvendor)
    .pipe(plumber())
    .pipe(gulp.dest("dist/scripts"));
}

function copy() {
    return gulp
    .src(resources.static, {
        base: "src"
    })
    .pipe(gulp.dest("dist/"));
}

function images() {
    return gulp
    .src(recources.images)
    .pipe(
        imagemin([
            imagemin_gifsicle({interlaced: true}),
            imagemin_mozjpeg({quality: 100, progressive: true}),
            imagemin_optipng({optimizationLevel: 3})
        ])
    )
    .pipe(gulp.dest("dist/assets/images"));
}
function svgSprite() {
    return gulp
    .src(resources.svgSprite)
    .pipe(
        svgmin({
            js2svg:{
                pretty: true
            }
        })
    )
    .pipe(
        svgstore({
            inlineSvg: true
        })
    )
    .pipe(rename("symbols.svg"))
    .pipe(gulp.dest("dist/assets/icons"));
}

const build = gulp.series(
    clean,
    copy,
    includeHtml,
    style,
    js,
    jsCopy,
    images,
    svgSprite
);

function serve() {
    server.init({
        server: "dist"
    });
    gulp.watch(resources.html, gulp.series(includeHtml, reloadServer));
    gulp.watch(resources.less, gulp.series(style, reloadServer));
    gulp.watch(resources.jsDev, gulp.series(js, reloadServer));
    gulp.watch(resources.jsVendor, gulp.series(jsCopy, reloadServer));
    gulp.watch(resources.static, { delay: 500 }, gulp.series(copy, reloadServer));
    gulp.watch(resources.images, { delay: 500 }, gulp.series(images, reloadServer));
    gulp.watch(resources.svgSprite, gulp.series(svgSprite, reloadServer));
}

function reloadServer(done) {
    server.reload();
    done();
}

const start = gulp.series(build, serve);

export {
    build, clean,
    copy, images, includeHtml, js,
    jsCopy, serve,
    start, style, svgSprite
};
