import test from 'ava';
import Documarker from '../index.js';
import mockFs from 'mock-fs-require-fix';
import fs from 'fs';
import path from 'path';

// parameters and default config

test('should use default parameters if config object is not supplied', t => {
    const documarker = new Documarker();
    t.deepEqual(documarker.config, {
        outputDirectory: 'docs',
        targetPattern: '**/*.md',
        layoutTemplate: 'templates/_layout.ejs',
        indexPageTargetPattern: 'index.md',
        globalCSS: [],
        globalJS: []
    });
});

test('should use the outputDirectory value in the config object when supplied', t => {
    const documarker = new Documarker({ outputDirectory: 'foo' });
    t.deepEqual(documarker.config, {
        outputDirectory: 'foo',
        targetPattern: '**/*.md',
        layoutTemplate: 'templates/_layout.ejs',
        indexPageTargetPattern: 'index.md',
        globalCSS: [],
        globalJS: []
    });
});

test('should use the targetPattern value in the config object when supplied', t => {
    const documarker = new Documarker({ targetPattern: 'bar' });
    t.deepEqual(documarker.config, {
        outputDirectory: 'docs',
        targetPattern: 'bar',
        layoutTemplate: 'templates/_layout.ejs',
        indexPageTargetPattern: 'index.md',
        globalCSS: [],
        globalJS: []
    });
});

test('should use the layoutTemplate value in the config object when supplied', t => {
    const documarker = new Documarker({ layoutTemplate: 'baz' });
    t.deepEqual(documarker.config, {
        outputDirectory: 'docs',
        targetPattern: '**/*.md',
        layoutTemplate: 'baz',
        indexPageTargetPattern: 'index.md',
        globalCSS: [],
        globalJS: []
    });
});

test('should use the indexPageTargetPattern value in the config object when supplied', t => {
    const documarker = new Documarker({ indexPageTargetPattern: 'bash' });
    t.deepEqual(documarker.config, {
        outputDirectory: 'docs',
        targetPattern: '**/*.md',
        layoutTemplate: 'templates/_layout.ejs',
        indexPageTargetPattern: 'bash',
        globalCSS: [],
        globalJS: []
    });
});

// normalization of string to array

test('should normalize a string value to an array', t => {
    const documarker = new Documarker();
    const normalizedValue = documarker._normailzeToArray('foo');
    t.deepEqual(normalizedValue, ['foo']);
});

test('should normalize an array value to an array', t => {
    const documarker = new Documarker();
    const normalizedValue = documarker._normailzeToArray(['foo']);
    t.deepEqual(normalizedValue, ['foo']);
});

test('should normalize an empty value to an array', t => {
    const documarker = new Documarker();
    const normalizedValue = documarker._normailzeToArray();
    t.deepEqual(normalizedValue, []);
});

// building the pages data array

test('should use a default name if name parameter does not exist in markdown front matter', t => {

    mockFs({
        'src/components': {
            'file1.md': ''
        }
    });

    const documarker = new Documarker({ targetPattern: 'src/**/*.md' });
    const pagesData = documarker._buildPagesData([ 'src/components/file1.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File1', css: [], js: [], content: '', route: 'file1', isIndex: false },
    ]);

    mockFs.restore();

});

test('should use the name parameter in the markdown front matter for the route value in page context', t => {

    mockFs({
        'src/components': {
            'fileOne.md': [
                '---',
                'name: fooBar',
                '---'
            ].join("\n")
        }
    });

    const documarker = new Documarker({ targetPattern: 'src/**/*.md' });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md' ]);

    t.deepEqual(pagesData, [
        { name: 'Foo Bar', css: [], js: [], content: '', route: 'foo-bar', isIndex: false },
    ]);

    mockFs.restore();

});

test('should include javascript file(s) path in page context if included in the markdown front matter', t => {

    mockFs({
        'src/components': {
            'fileOne.md': [
                '---',
                'js: foo',
                '---'
            ].join("\n"),
            'fileTwo.md': [
                '---',
                'js:',
                ' - bar',
                ' - baz',
                '---'
            ].join("\n")
        }
    });

    const documarker = new Documarker({ targetPattern: 'src/**/*.md' });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md', 'src/components/fileTwo.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: [], js: ['foo'], content: '', route: 'file-one', isIndex: false },
        { name: 'File Two', css: [], js: ['bar', 'baz'], content: '', route: 'file-two', isIndex: false },
    ]);

    mockFs.restore();

});

test('should include css file(s) path in page context if included in the markdown front matter', t => {

    mockFs({
        'src/components': {
            'fileOne.md': [
                '---',
                'css: foo',
                '---'
            ].join("\n"),
            'fileTwo.md': [
                '---',
                'css:',
                ' - bar',
                ' - baz',
                '---'
            ].join("\n")
        }
    });

    const documarker = new Documarker({ targetPattern: 'src/**/*.md' });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md', 'src/components/fileTwo.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: ['foo'], js: [], content: '', route: 'file-one', isIndex: false },
        { name: 'File Two', css: ['bar', 'baz'], js: [], content: '', route: 'file-two', isIndex: false },
    ]);

    mockFs.restore();

});

test('should set the isIndex flag to true in page context if the file pattern matches the site index pattern', t => {

    mockFs({
        'src/components': {
            'fileOne.md': '',
            'fileTwo.md': ''
        }
    });

    const documarker = new Documarker({
        targetPattern: 'src/**/*.md',
        indexPageTargetPattern: 'src/components/fileTwo.md'
    });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md', 'src/components/fileTwo.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: [], js: [], content: '', route: 'file-one', isIndex: false },
        { name: 'File Two', css: [], js: [], content: '', route: 'file-two', isIndex: true },
    ]);

    mockFs.restore();

});

test('should include a global javascript file in page context', t => {

    mockFs({
        'src/components': {
            'fileOne.md': ''
        }
    });

    const documarker = new Documarker({
        targetPattern: 'src/**/*.md',
        globalJS: 'foo'
    });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: [], js: ['foo'], content: '', route: 'file-one', isIndex: false }
    ]);

    mockFs.restore();

});

test('should include multiple global javascript files in page context', t => {

    mockFs({
        'src/components': {
            'fileOne.md': ''
        }
    });

    const documarker = new Documarker({
        targetPattern: 'src/**/*.md',
        globalJS: [ 'foo', 'bar' ]
    });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: [], js: ['foo', 'bar'], content: '', route: 'file-one', isIndex: false }
    ]);

    mockFs.restore();

});

test('should include a global CSS file in page context', t => {

    mockFs({
        'src/components': {
            'fileOne.md': ''
        }
    });

    const documarker = new Documarker({
        targetPattern: 'src/**/*.md',
        globalCSS: 'foo'
    });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: ['foo'], js: [], content: '', route: 'file-one', isIndex: false }
    ]);

    mockFs.restore();

});

test('should include multiple global CSS files in page context', t => {

    mockFs({
        'src/components': {
            'fileOne.md': ''
        }
    });

    const documarker = new Documarker({
        targetPattern: 'src/**/*.md',
        globalCSS: [ 'foo', 'bar' ]
    });
    const pagesData = documarker._buildPagesData([ 'src/components/fileOne.md' ]);

    t.deepEqual(pagesData, [
        { name: 'File One', css: ['foo', 'bar'], js: [], content: '', route: 'file-one', isIndex: false }
    ]);

    mockFs.restore();

});

test.todo('should include global css files in page context');

// building the navigation array

test('should build an array of navigation objects from the page context array alphabetized ascending by name', t => {

    const pagesData = [
        { name: 'Foo', css: [], js: [], content: '', route: 'foo', isIndex: false },
        { name: 'Bar', css: [], js: [], content: '', route: 'bar', isIndex: false },
        { name: 'Baz', css: [], js: [], content: '', route: 'baz', isIndex: false },
        { name: 'Bash Bah', css: [], js: [], content: '', route: 'bash-bah', isIndex: false },
    ];

    const documarker = new Documarker();
    const navigationData = documarker._buildNavigationData(pagesData);

    t.deepEqual(navigationData, [
        { name: 'Bar', href: '/bar' },
        { name: 'Bash Bah', href: '/bash-bah' },
        { name: 'Baz', href: '/baz' },
        { name: 'Foo', href: '/foo' }
    ]);

});

test('should add the navigation array to each page context', t => {

    const pagesData = [
        { name: 'Foo', css: [], js: [], content: '', route: 'foo', isIndex: false },
        { name: 'Bar', css: [], js: [], content: '', route: 'bar', isIndex: false },
        { name: 'Baz', css: [], js: [], content: '', route: 'baz', isIndex: false },
        { name: 'Bash Bah', css: [], js: [], content: '', route: 'bash-bah', isIndex: false },
    ];

    const navigationData = [
        { name: 'Bar', href: '/bar' },
        { name: 'Bash Bah', href: '/bash-bah' },
        { name: 'Baz', href: '/baz' },
        { name: 'Foo', href: '/foo' }
    ];

    const documarker = new Documarker();
    const enrichedPagesData = documarker._addNavigationDataToPages(pagesData);

    t.deepEqual(enrichedPagesData[0].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[1].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[2].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[3].navigationData, navigationData);

});

test.todo('should properly link to the docs index page');

test.todo('should make the docs index link first in the array');

// rendering pages to html

test.todo('should render a page');

test.todo('should render each page from the array of page context objects');

// output

test('should create the output directory if it doesn\'t already exist during build', t => {

    mockFs({
        'src/components': {
            'fileOne.md': ''
        }
    });

    const documarker = new Documarker({
        outputDirectory: 'foo',
        targetPattern: 'src/**/*.md'
    });

    documarker.build();

    const outputDirectory = path.resolve('foo');

    t.true(fs.existsSync(outputDirectory));

    mockFs.restore();

});

test.todo('should create the site pages as index.html documents inside a named directory for clean urls');

test.todo('should create the site index page in the root output directory');

