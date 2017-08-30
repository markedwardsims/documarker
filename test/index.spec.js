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
        { name: 'File1', css: [], js: [], content: '', route: 'file1', group: 'Common', isIndex: false },
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
        { name: 'Foo Bar', css: [], js: [], content: '', route: 'foo-bar', group: 'Common', isIndex: false },
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
        { name: 'File One', css: [], js: ['foo'], content: '', route: 'file-one', group: 'Common', isIndex: false },
        { name: 'File Two', css: [], js: ['bar', 'baz'], content: '', route: 'file-two', group: 'Common', isIndex: false },
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
        { name: 'File One', css: ['foo'], js: [], content: '', route: 'file-one', group: 'Common', isIndex: false },
        { name: 'File Two', css: ['bar', 'baz'], js: [], content: '', route: 'file-two', group: 'Common', isIndex: false },
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
        { name: 'File One', css: [], js: [], content: '', route: 'file-one', group: 'Common', isIndex: false },
        { name: 'File Two', css: [], js: [], content: '', route: 'file-two', group: 'Common', isIndex: true },
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
        { name: 'File One', css: [], js: ['foo'], content: '', route: 'file-one', group: 'Common', isIndex: false }
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
        { name: 'File One', css: [], js: ['foo', 'bar'], content: '', route: 'file-one', group: 'Common', isIndex: false }
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
        { name: 'File One', css: ['foo'], js: [], content: '', route: 'file-one', group: 'Common', isIndex: false }
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
        { name: 'File One', css: ['foo', 'bar'], js: [], content: '', route: 'file-one', group: 'Common', isIndex: false }
    ]);

    mockFs.restore();

});

test.todo('should include global css files in page context');

// building the navigation array

test('should add pages without a specified group to the Common group', t => {

    const pagesData = [
        { name: 'Foo', css: [], js: [], content: '', route: 'foo', group: 'Common', isIndex: false },
        { name: 'Bar', css: [], js: [], content: '', route: 'bar', group: 'Common', isIndex: false },
        { name: 'Baz', css: [], js: [], content: '', route: 'baz', group: 'Common', isIndex: false },
        { name: 'Bash Bah', css: [], js: [], content: '', route: 'bash-bah', group: 'Common', isIndex: false },
    ];

    const documarker = new Documarker();
    const navigationData = documarker._buildNavigationData(pagesData);

    t.deepEqual(navigationData, [
        {
            name: 'Common',
            items: [
                { name: 'Bar', href: '/bar' },
                { name: 'Bash Bah', href: '/bash-bah' },
                { name: 'Baz', href: '/baz' },
                { name: 'Foo', href: '/foo' }
            ]
        }
    ]);

});

test('should build and add the grouped and ordered navigation array to each page context', t => {

    const pagesData = [
        { name: 'Foo', css: [], js: [], content: '', route: 'foo', group: 'Tim', isIndex: false },
        { name: 'Bar', css: [], js: [], content: '', route: 'bar', group: 'Buck', isIndex: false },
        { name: 'Zoo', css: [], js: [], content: '', route: 'zoo', group: 'Buck', isIndex: false },
        { name: 'Goo', css: [], js: [], content: '', route: 'goo', group: 'Two', isIndex: false },
        { name: 'Baz', css: [], js: [], content: '', route: 'baz', group: 'Tim', isIndex: false },
        { name: 'Tah', css: [], js: [], content: '', route: 'tah', group: 'Two', isIndex: false },
    ];

    const navigationData = [
        {
            name: 'Buck',
            items: [
                { name: 'Bar', href: '/bar' },
                { name: 'Zoo', href: '/zoo' }
            ]
        },
        {
            name: 'Tim',
            items: [
                { name: 'Baz', href: '/baz' },
                { name: 'Foo', href: '/foo' }
            ]
        },
        {
            name: 'Two',
            items: [
                { name: 'Goo', href: '/goo' },
                { name: 'Tah', href: '/tah' }
            ]
        },
    ];

    const documarker = new Documarker();
    const enrichedPagesData = documarker._addNavigationDataToPages(pagesData);

    t.deepEqual(enrichedPagesData[0].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[1].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[2].navigationData, navigationData);
    t.deepEqual(enrichedPagesData[3].navigationData, navigationData);

});

test('should properly link to the docs index page and put it in an empty group so it\'s first in the list', t => {

    const pagesData = [
        { name: 'Foo', css: [], js: [], content: '', route: 'foo', group: 'Common', isIndex: true }
    ];

    const documarker = new Documarker();
    const navigationData = documarker._buildNavigationData(pagesData);

    t.deepEqual(navigationData, [
        {
            name: '',
            items: [
                { name: 'Foo', href: '/' },
            ]
        }
    ]);

});

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

