"use strict";
/**
 * Created by Mathieu Parent (Salketer) on 27/08/2018.
 */

let XJPB_Parser = require('../../src/parser.js');

let compat_xmljs2 = require('../../src/compat/xmljs2.js');

let fs = require('fs');

describe('XJPB Compatibility XMLJS2', () => {
    test('Can parse basic tags', (done) => {
        let parser = new XJPB_Parser();
        //parser.parse("<test>My test</test>");

        parser = new XJPB_Parser();
        parser.parse(fs.createReadStream('./tests/assets/medium_size.xml'),(error,parsedObject)=>{
            done();
        });

        //parser = new XJPB_Parser();
        //parser.parse("Text<hr/>text");
    });
});