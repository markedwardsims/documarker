const styledown = require('styledown');
const glob = require('globby');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');
const frontMatter = require('front-matter');
const changeCase = require('change-case');

module.exports = class Documarker {

    /**
     * The Documarker constructor function receives the config object and merges with the default config.
     * @param {Object} config (Optional) The configuration object
     * @param {String} config.outputDirectory  (Optional) The directory to write the documentation files to
     * @param {String} config.targetPattern  (Optional) The glob pattern used to find the markdown files
     * @param {String} config.indexPageTargetPattern  (Optional) The glob pattern used to find the markdown file for the index page
     */
    constructor(config) {
        config = config || {};
        const defaultConfig = {
            outputDirectory: 'docs',
            targetPattern: '**/*.md',
            layoutTemplate: 'templates/_layout.ejs',
            indexPageTargetPattern: 'index.md',
            globalJS: [],
            globalCSS: []
        };
        this.config = Object.assign({}, defaultConfig, config);
    }

    /**
     * Given a string or an array, this function will normalize to an array or strings.
     * @param {Array|String} value The array or string value that will ultimately be returned back
     * @returns {Array} An array of string(s)
     * @private
     */
    _normailzeToArray(value) {
        if (!value ) { return []; }
        if (typeof value === 'string') { return [value]; }
        return value;
    }

    /**
     * Builds an array of objects that represents all of the page contexts.
     * @param {Array} files Array of markdown files to build the page contexts from
     * @returns {Array} An array of page context objects
     * @private
     */
    _buildPagesData(files) {
        const normalizeToArray = this._normailzeToArray;
        const indexPattern = this.config.indexPageTargetPattern;
        const globalJS = this.config.globalJS;
        const globalCSS = this.config.globalCSS;
        return files.map(function(file) {
            const defaultName = changeCase.paramCase( file.split('/').pop().split('.')[0] );
            const markdown = fs.readFileSync(file, 'utf8');
            const fm = frontMatter(markdown);
            const name = fm.attributes.name || defaultName;
            return {
                name:       changeCase.titleCase(name),
                css:        normalizeToArray(fm.attributes.css).concat(normalizeToArray(globalCSS)),
                js:         normalizeToArray(fm.attributes.js).concat(normalizeToArray(globalJS)),
                content:    styledown.parse(fm.body),
                route:      changeCase.paramCase(name),
                isIndex:    (file === indexPattern) // TODO: i'm not crazy about this because it's not needed in the view
                                                    // but by the time we need to either create or not create the folder
                                                    // for the index.html file we only have the page context available
            };
        });
    }

    /**
     * Builds an array of objects that represents the navigation
     * @param {Array} pagesData The built out array of page context objects
     * @returns {Array} An array of objects that represent the navigation items
     * @private
     */
    _buildNavigationData(pagesData) {
        return pagesData.map(function(page){
            return  {
                name: page.name,
                href: '/' + page.route
            };
        });
    }

    /**
     * Adds the built out navigation array to each page context
     * @param {Array} pagesData The built out array of page context objects
     * @returns {Array} The enriched pagesData array with the navigationData property added to each page context
     * @private
     */
    _addNavigationDataToPages(pagesData) {
        const navigationData = this._buildNavigationData(pagesData);
        return pagesData.map(function(page){
            page.navigationData = navigationData;
            return page;
        });
    }

    /**
     * Renders a page using EJS and writes it to the docs directory. Pages are put in a directory named with the component
     * name/route value. If the isIndex flag is true, the page is written to the root output directory.
     * @param {Object} context The page context object passed to the _layout template with EJS
     * @private
     */
    _renderPage(context) {
        const outputDirectory = this.config.outputDirectory;
        const layoutTemplate = path.resolve(__dirname, this.config.layoutTemplate);
        ejs.renderFile(layoutTemplate, context, {}, function(err, str) {
            let newDir;
            if(context.isIndex) {
                newDir = path.resolve(outputDirectory);
            }
            else{
                newDir = path.resolve(outputDirectory, context.route);
                if (!fs.existsSync(newDir)) { fs.mkdirSync(newDir); }
            }
            // use index.html for cleaner URLs
            fs.writeFileSync(newDir + '/index.html', str);
        });
    }

    /**
     * Creates the docs target directory if it doesn't already exit
     * @private
     */
    _createDocsDirectory() {
        const outputDirectory = path.resolve(this.config.outputDirectory);
        if (!fs.existsSync(outputDirectory)) { fs.mkdirSync(outputDirectory); }
    }

    /**
     * Render all the pages using the pagesData array
     * @param {Array} pagesData The built out array of page context objects
     * @private
     */
    _renderAllPages(pagesData){
        pagesData.forEach(this._renderPage.bind(this));
    }

    /**
     * Creates the output directory and build out the documentation pages
     * @returns {Promise} The promise created by globby
     */
    build() {
        this._createDocsDirectory();

        return glob([this.config.targetPattern, this.config.indexPageTargetPattern])
            .then(this._buildPagesData.bind(this))
            .then(this._addNavigationDataToPages.bind(this))
            .then(this._renderAllPages.bind(this));
    }

};