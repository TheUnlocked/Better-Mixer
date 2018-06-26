function addToChat(text) {
    let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
    let cursor = doc.getCursor();

    let insertText = (doc.getLine(cursor.line)[cursor.ch - 1] == ' ' ? '' : ' ') +
                     text +
                     (doc.getLine(cursor.line)[cursor.ch] == ' ' ? '' : ' ');

    doc.replaceSelection(insertText, select='end');
}

document.currentScript.addEventListener('addToChat', (event) => addToChat(event.detail));

(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        
        window.dispatchEvent(new CustomEvent('pushState'));

        return pushState.apply(history, arguments);
    };
})(window.history);

// function waitFor$(){
//     if($){
//         $.initialize('.CodeMirror', (s, element) => {
//             element.CodeMirror.addKeyMap({
//                 'Up': 'goLineUp',
//                 'Down': 'goLineDown'
//             }, true);
//         });
//     }
//     else{
//         setTimeout(waitFor$, 100);
//     }
// }

// waitFor$();
