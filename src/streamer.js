"use strict";
/**
 * Created by Mathieu Parent (Salketer) on 27/08/2018.
 */

var stream = require('stream');
var Buffer = require('buffer').Buffer;
var util = require('util');

function test(buffer, rules) {
    let str = buffer.toString();
    let res = {};
    for (let rule in rules) {
        let result = rules[rule].exec(str);
        if (result) {
            res[rule] = result;
        }
    }
    return res;
}

let XJPB_Streamer = function (rules, options) {
    stream.Writable.call(this, options);
    this._buffer = new Buffer("");
    this._rules = rules;
};

util.inherits(XJPB_Streamer, stream.Writable); // step 1

XJPB_Streamer.prototype._write = function (chunk, enc, cb) {
    var buffer = (chunk instanceof Buffer) ?
        chunk :  // already is Buffer use it
        new Buffer(chunk, enc);  // string, convert
    this._buffer = Buffer.concat([this._buffer, buffer]);

    let closest_test, closest_test_name;
    let security = 9999;
    do {
        closest_test = null;
        closest_test_name = null;

        let tests = test(this._buffer, this._rules);
        for (let test in tests) {
            if (!closest_test || closest_test.index > tests[test].index) {
                closest_test = tests[test];
                closest_test_name = test;
            }
        }
        if (closest_test) {
            //delete closest_test[0];
            //delete closest_test.index;
            //delete closest_test.input;
            if (closest_test.index > 0) {
                //There was characters before the detected rule.
                //Let's emit an event for the nonmatching text.
                let text = this._buffer.toString().slice(0, closest_test.index);
                this._buffer = this._buffer.slice(Buffer.byteLength(text, enc));
                this.emit("nomatch", [text]);
            }
            this.emit(closest_test_name, closest_test.splice(1),closest_test[0]);
            this._buffer = this._buffer.slice(Buffer.byteLength(closest_test[0], enc));
        }

    } while (closest_test && --security>0);
    cb();
};
XJPB_Streamer.prototype._final = function _final(cb){
    if(this._buffer.length>0){
        //If we have remaining data, it means it has not been flagged.
        //Emit a nomatch with it so applications can handle it.
        let text = this._buffer.toString();
        this.emit("nomatch", [text]);
    }

    cb();
};

module.exports = XJPB_Streamer;