"use strict";
/**
 * Created by Mathieu Parent (Salketer) on 27/08/2018.
 */

let XJPB_Parser = require('../src/parser.js');

let fs = require('fs');

describe('XJPB Parser', () => {
    test('Can parse basic tags', (done) => {
        let parser = new XJPB_Parser();
        //parser.parse("<test>My test</test>");

        parser = new XJPB_Parser();
        parser.parse(fs.createReadStream('./tests/assets/medium_size.xml'),(root)=>{
            done();
        });

        //parser = new XJPB_Parser();
        //parser.parse("Text<hr/>text");
    });
});