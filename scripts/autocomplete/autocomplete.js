// TeXworksScript
// Title: Context aware autocomplete
// Description: Autocompletion inspired by vim.
// Author: Henrik Skov Midtiby
// Version: 0.3
// Date: 2011-05-16
// Script-Type: standalone
// Context: TeXDocument
// Shortcut: Ctrl+M


// Include functionality from other script
var file = TW.readFile("autocompleteFunctions.js");
if (file.status == 0) {
  eval(file.result);
  file = null;  // free mem
}

autocomplete();

// Debug output
//TW.target.selectRange(inputWord.wordStart + 15);
//TW.target.insertText(inputWord.commandName);
//TW.target.selectRange(inputWord.wordStart + CommonSequence.length, max(0, NextGuess.length - CommonSequence.length));
