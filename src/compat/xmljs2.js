"use strict";
/**
 * Created by Mathieu Parent (Salketer) on 27/08/2018.
 */

//{
//    '#name': 'a:r',
//    '$$': [],
//    'a:rPr': {'@': {lang: 'fr-FR', dirty: '0'}, '#name': 'a:rPr','$$':[]},
//    'a:t': {'#': ' ', '#name': 'a:t'}
//}

function grab(node){
    let __ret = {
        '#name':node.type
    };
    if(node._content.$$){
        for(let i in node._content.$$){
            let n = grab(node._content.$$[i]);
            if(!__ret[n['#name']]){
                __ret[n['#name']] = n;
            }else if(!Array.isArray(__ret[n['#name']])){
                __ret[n['#name']] = [__ret[n['#name']],n];
            }else {
                __ret[n['#name']].push(n);
            }
            if(!__ret.$$){
                __ret.$$ = [];
            }
            __ret.$$.push(n);
        }
    }
    if(node._content['@']){
        __ret['@'] = node._content['@'];
    }
    if(node._content['#']){
        __ret['#'] = node._content['#'];
    }

    return __ret;
}

module.exports = function compat_xmljs2(parsedData){
    let __ret = {},elem;

    if(parsedData.root._content.$$.length == 1){
        elem = parsedData.root._content.$$[0];
    }else{
        elem = parsedData.root._content.$$;
    }

    __ret = grab(elem);
    return __ret;
};