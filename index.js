#! /usr/bin/env babel-node


import prompt from 'prompt';
import {parse} from 'nomnom';
import glob from 'glob';
import parseProps from './lib/parseProps';
import generate from './lib/generate';
import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';


const date = new Date();
const defaults = {
  date: {
    day: date.getDate(),
    month: date.getMonth(),
    fullYear: date.getFullYear()
  },
  user: {
    name: '',
    github: '',
    email: ''
  },
  package: {
    name: '',
    description: ''
  }
};


const schema = {
  properties: {
    'package.name': {
      description: 'Package name: ',
      pattern: /^[a-z]+[a-z\-_]+$/,
      message: 'Name must be only letters, numbers, dashes and underscores',
      required: true
    }
  }
};


Object.assign(prompt, {
  message: '>'.green,
  delimiter: ' ',
  colors: false
});
prompt.start();


const sources = glob.sync('./template/**/*', {
  realpath: true, nodir: true, dot: true, cwd: __dirname
});
const destinations = sources.map(source =>
  path.join(process.cwd(), path.relative(path.join(__dirname, 'template'), source)));
const srcContent = sources.map(fileName => fs.readFileSync(fileName, 'utf-8'));


const getPrompt = () => new Promise((resolve, reject) =>
  prompt.get(schema, (err, props) => err ? reject(err) : resolve(props)));


const saveCompiled = compiledFiles => compiledFiles.forEach((content, key) => {
  mkdirp.sync(path.dirname(destinations[key]));
  fs.writeFileSync(destinations[key], content, 'utf-8');
});


const scaffold = args => {
  // Override arguments, use `--package.name=some-name` to skip prompts
  prompt.override = args;

  getPrompt()
    .then(parseProps(defaults))
    .then(generate(srcContent))
    .then(saveCompiled)
    .catch(err => console.error(err))
  ;
};


// Check if script is run directly
if (require.main === module) {
  scaffold(parse());
}


export default scaffold;
