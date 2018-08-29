"use strict";
/**
 * Created by Mathieu Parent (Salketer) on 27/08/2018.
 */

let Readable = require('stream').Readable;

let PassThrough = require('stream').PassThrough;

let Buffer = require('buffer').Buffer;

let XJPB_Streamer = require('./streamer.js');

const name = "[a-zA-Z_:][a-zA-Z0-9-_.:]*";
const s = "[ \n\t\r]*";

const REGEX = {
    tagStart: new RegExp("<(" + name + ")"),
    tagEnd: new RegExp("/>|</(" + name + ")>"),
    tagAttribute: new RegExp("(?:(?:" + s + "(" + name + ")" + s + "=" + s + "(?:\"([^<&\"]*)\"|'([^<&']*)'))" + s + "(\/)?>?)|(\/)?>"),
    commentStart: new RegExp("<!--"),
    commentEnd: new RegExp("-->"),
    prolog: new RegExp("<?xml.*?>")
};


let ParsedData = function () {

};


let ParsedNode = function (type) {
    this.parent = null;
    this.root = null;
    this._content = {};
    this.type = type;
};

ParsedNode.prototype.addChild = function addChild(node) {
    node.parent = this;
    node.root = this.root;
    if (!this._content.$$) {
        this._content.$$ = [];
    }
    this._content.$$.push(node);
    if (!this._content[node.type]) {
        this._content[node.type] = node;
    } else if (!Array.isArray(this._content[node.type])) {
        this._content[node.type] = [this._content[node.type], node];
    } else {
        this._content[node.type].push(node);
    }
};

ParsedNode.prototype.addAttribute = function addAttribute(attrname, attrval) {
    if (!this._content['@']) {
        this._content['@'] = {};
    }
    this._content['@'][attrname] = attrval;
};

ParsedNode.prototype.getValue = function getValue(path) {
    if (!Array.isArray(path)) {
        throw new Error("The first parameter must be an array");
    }
    let element = this;
    for (let i = 0; i < path.length; i++) {
        if (element && element._content[path[i]]) {
            element = element._content[path[i]];
        } else {
            return false;
        }
    }
    return element;
};

ParsedNode.prototype.getValueList = function getValueList(path) {
    let __ret = this.getValue(path);
    if (!!__ret && !Array.isArray(__ret)) {
        __ret = [__ret];
    }
    return __ret;
};

ParsedNode.prototype.addText = function addText(text) {
    if (!this._content['#']) {
        this._content['#'] = '';
    }
    this._content['#'] += text;
};

ParsedNode.prototype.setText = function setText(text) {
    this._content['#'] = text;
};

let XJPB_Parser = function () {
};
XJPB_Parser.prototype.parse = function parse(subject, finish_cb) {
    let stream;
    this._streamer = new XJPB_Streamer(REGEX);

    if (subject instanceof Readable) {
        stream = subject;
    } else if (subject instanceof Buffer) {
        stream = new PassThrough();
        stream.end(subject);
    } else {
        stream = new PassThrough();
        stream.end(new Buffer(subject));
    }

    this._parsed = new ParsedData();
    this._currentNode = new ParsedNode();
    this._parsed.root = this._currentNode;
    this._currentNode.root = this._currentNode;
    this._inComment = false;

    this._streamer.on('tagStart', this._tagStart.bind(this));

    this._streamer.on('tagEnd', this._tagEnd.bind(this));
    this._streamer.on('tagAttribute', this._tagAttribute.bind(this));
    this._streamer.on('commentStart', this._commentStart.bind(this));
    this._streamer.on('commentEnd', this._commentEnd.bind(this));
    this._streamer.on('nomatch', this._nomatch.bind(this));
    this._streamer.on('prolog',this._prolog.bind(this));

    stream.pipe(this._streamer);

    this._streamer.on('finish', ()=> {
        finish_cb(this._parsed);
    })
};

XJPB_Parser.prototype._tagStart = function _tagStart(data, text) {
    if (this._inComment) {
        this._currentNode.addText(text);
    } else {
        let node = new ParsedNode(data[0]);
        this._currentNode.addChild(node);
        this._currentNode = node;
    }
};

XJPB_Parser.prototype._tagEnd = function _tagEnd(data, text) {
    if (this._inComment) {
        this._currentNode.addText(text);
    } else {
        this._currentNode = this._currentNode.parent;
    }
};
XJPB_Parser.prototype._tagAttribute = function _tagAttribute(data, text) {
    if (this._inComment) {
        this._currentNode.addText(text);
    } else {
        if (data[0]) {
            //We might get here on open tag closure even without attribute
            this._currentNode.addAttribute(data[0], data[1] || data[2]);
        }
        if (data[3] == '/' || data[4] == '/') {
            //Self closing tag
            this._tagEnd();
        }
    }
};
XJPB_Parser.prototype._nomatch = function _nomatch(data) {
    //On no match, it means we are in a text node.
    this._currentNode.addText(data[0]);
};

XJPB_Parser.prototype._commentStart = function _commentStart(data, text) {
    if (this._inComment) {
        this._currentNode.addText(text);
    } else {
        this._inComment = true;
        let node = new ParsedNode('!!');
        this._currentNode.addChild(node);
        this._currentNode = node;
    }
};

XJPB_Parser.prototype._commentEnd = function _commentEnd(data, text) {
    this._inComment = false;
    this._tagEnd();
};

XJPB_Parser.prototype._prolog = function _prolog(data,text){
    this._parsed.prolog = text;
};

module.exports = XJPB_Parser;