/**
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const { assertMarkdown, loadSchemas } = require('./testUtils');

const example = require('./fixtures/example/api.schema.json');
const { jsonschema2md } = require('../lib/index');

describe('Testing Public API', () => {
  beforeEach(async () => {
    await fs.remove(path.resolve(__dirname, '..', 'tmp'));
  });

  afterEach(async () => {
    await fs.remove(path.resolve(__dirname, '..', 'tmp'));
  });

  it('Public API processes multiple schemas with full path', async () => {
    const schemasFiles = await loadSchemas('readme-1');
    const result = jsonschema2md(schemasFiles, {
      outDir: 'tmp',
      includeReadme: true,
    });
    // console.log('done!', res);
    assert(result === Object(result));
    const readme = await fs.stat(path.resolve(__dirname, '..', 'tmp', 'README.md'));
    assert.ok(readme.isFile());
    assert.notStrictEqual(readme.size, 0);
    assert.ok(result.readme.content);
    assertMarkdown(result.readme.markdownAst)
      .contains('# README')
      .contains('The schemas linked above')
      .fuzzy`
## Top-level Schemas

*   [Abstract](./abstract.md "This is an abstract schema") – ${null}
*   [Complex References](./complex.md "This is an example schema that uses types defined in other schemas") – ${null}
*   [Simple](./simple.md "This is a very simple example of a JSON schema") – ${null}
`;
    assert.strictEqual(result.markdown.length, 29);
  });

  it('Public API processes multiple schemas with content', async () => {
    const schemasFiles = await loadSchemas('readme-1');
    const schemas = schemasFiles.map(({ fileName, fullPath }) => ({
      fileName,
      // eslint-disable-next-line global-require, import/no-dynamic-require
      content: require(fullPath),
    }));

    const result = jsonschema2md(schemas, {
      schemaPath: path.resolve(__dirname, 'fixtures/readme-1'),
      outDir: 'tmp',
      schemaOut: 'tmp',
      includeReadme: true,
    });
    const readme = await fs.stat(path.resolve(__dirname, '..', 'tmp', 'README.md'));
    assert.ok(readme.isFile());
    assert.notStrictEqual(readme.size, 0);
    assert.ok(result.readme.content);
    assertMarkdown(result.readme.markdownAst)
      .contains('# README')
      .contains('The schemas linked above');
    assert.strictEqual(result.schema.length, 3);
    assert.strictEqual(result.markdown.length, 28);
  });

  it('Public API processes from single schema', async () => {
    const result = jsonschema2md(example, {
      includeReadme: true,
    });
    // console.log('done!', result);
    assert(result === Object(result));
    assert.ok(result.readme.content);
    assertMarkdown(result.readme.markdownAst)
      .contains('# README')
      .matches(/Top-level Schemas/)
      .contains('https://example.com/schemas/example-api');
    assert.strictEqual(result.markdown.length, 7);
    assertMarkdown(result.markdown[0].markdownAst)
      .contains('# Example API Properties')
      .contains('## foo')
      .contains('## bar')
      .contains('## baz')
      .contains('properties within properties')
      .contains('## examples');
  });

  it('Public API with invalid schema', async () => {
    try {
      jsonschema2md('test', {
        outDir: 'tmp',
        includeReadme: true,
      });
    } catch (e) {
      assert.strictEqual(e.message, 'Input is not valid. Provide JSON schema either as Object or Array.');
    }
  });
});
