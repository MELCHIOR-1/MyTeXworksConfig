// TeXworksScript
// Title: Edit &magic comments...
// Description: Edit magic comments
// Author: Antonio Macrì
// Version: 0.9.3
// Date: 2014-02-26
// Script-Type: standalone
// Context: TeXDocument
// Shortcut: Ctrl+K, Ctrl+M

/*
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


// Internationalization
var CANNOT_LOAD_FILE = "Cannot load \"%0\" (status: %1\).";
var CANNOT_CREATE_UI = "Cannot create the UI dialog.";


// Utility functions
String.prototype.format = function()
{
  var fmt = this;
  for (var i = 0; i < arguments.length; i++) {
    fmt = fmt.replace(new RegExp("%" + i, "g"), arguments[i]);
  }
  return fmt;
}

// String.trim was introduced in Qt 4.7
if(typeof(String.prototype.trim) == "undefined")
{
  String.prototype.trim = (function() {
    var re = /^[\s\n]+|[\s\n]+$/g;
    return function() { return this.replace(re, ""); };
  })();
}

// Used to escape paths
function EscapeXml(str)
{
  str = str.replace(/&/g, "&amp;");
  str = str.replace(/</g, "&lt;");
  return str.replace(/>/g, "&gt;");
}


var Path = (function() {
  var reFileNameWithoutExtension = new RegExp("([^\\\\/]+)\\.[^.]+$");
  var reParentFolder = new RegExp("^(.*[\\\\/])[^\\\\/]+\\.[^.]+$");
  var reSplit = new RegExp("[\\\\/]");
  return  {
    getFileNameWithoutExtension: function(path) {
      var m  = reFileNameWithoutExtension.exec(path);
      return m ? m[1] : path;
    },
    getParentFolder: function(path) {
      var m = reParentFolder.exec(path);
      return m ? m[1] : ".";
    },
    // file and folder must be both absolute, or both relative to the same folder
    getRelativePath: function(file, folder) {
      var fb = file.split(reSplit).filter(function(e) { return e && e != "."; });
      var mb = folder.split(reSplit).filter(function(e) { return e && e != "."; });
      var i = 0;
      while (i < mb.length && fb[i] == mb[i]) {
        i++;
      }
      var result = fb.slice(i).join('/');
      if (i < mb.length) {
        result = new Array(mb.length-i+1).join("../") + result;
      }
      return result;
    },
  };
})();


var TeXShopCompatibility = false;
var PEEK_LENGTH = 1024;  // from TeXworks' sources
var fmtMagicComment = "% !TeX %0 = %1\n";


function MagicComment(key, regexkey)
{
  this.Key = key;
  this.Regex = new RegExp("% *!TEX +" + (regexkey || key) + " *= *(.+)\\n", "i");
  this.Value = "";
  this.IsTeXShopSyntax = false;

  this.FromCommentString = function(match) {
    this.Index = match.index;
    this.Length = match[0].length;
    this.Value = match[1].trim();
  }

  this.ToDisplayValue = function() {
    return this.Value;
  }

  this.FromDisplayValue = function(value) {
    return this.Value = value;
  }

  this.ToCommentString = function() {
    return fmtMagicComment.format(this.Key, this.Value);
  }
}


function EncodingMagicComment()
{
  MagicComment.call(this, "encoding");

  this.ToDisplayValue = function() {
    var list = this.GetList(), value = this.Value.toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (list[i].toLowerCase().indexOf(value) >= 0) {
        return list[i];
      }
    }
    return this.Value;
  }

  this.FromDisplayValue = function(value) {
    var m = /^(.+)\(.+\)\s*$/.exec(value);
    this.Value = m ? m[1].trim() : value;
    return this.Value;
  }

  this.ToCommentString = function() {
    var v = this.FromDisplayValue(this.ToDisplayValue());
    return fmtMagicComment.format(this.Key, v);
  }

  this.GetList = function() {
    var list = [
      // From inputenc:
      [ "UTF-8", "UTF-8 Unicode", "utf-8" ],
      [ "ISO-8859-1", "IsoLatin", "latin1" ],
      [ "ISO-8859-2", "IsoLatin2", "latin2" ],
      [ "ISO-8859-3", "", "latin3" ],
      [ "ISO-8859-4", "", "latin4" ],
      [ "ISO-8859-9", "IsoLatin5", "latin5" ],
      [ "ISO-8859-15", "IsoLatin9", "latin9" ],
      [ "ISO-8859-16", "", "latin10" ],
      [ "IBM850", "", "cp850" ],
      [ "Windows-1250", "", "cp1250" ],
      [ "Windows-1252", "", "cp1252", "ansinew" ],
      [ "Windows-1257", "", "cp1257" ],
      [ "Apple Roman", "MacOSRoman", "applemac", "x-mac-roman" ],
      // Missing explicit support in TW:
      //   ascii, decmulti, cp852, cp858, cp437, cp437de, cp865, macce, next
      // Nota: ascii (7-bit) is included in ISO-8859-1 and UTF-8
      // From inputenx:
      [ "ISO-8859-5", "", "iso88595" ],
      [ "ISO-8859-8", "", "x-iso-8859-8" ],
      [ "ISO-8859-10", "", "x-latin6" ],
      [ "ISO-8859-13", "", "x-latin7" ],
      [ "ISO-8859-14", "", "x-latin8" ],
      [ "IBM866", "", "x-cp866" ],
      [ "Windows-1251", "Windows Cyrillic", "x-cp1251" ],
      [ "Windows-1255", "", "x-cp1255" ],
      [ "KOI8-R", "KOI8_R", "x-koi8-r" ],
      // Missing explicit support in TW:
      //   verbatim, atarist, cp855, mac-cyrillic
      // Nota: inputenx defines cp437de = cp437, dec-mcs = decmulti,
      //   mac-centeuro = macce, nextstep = next, x-mac-roman = applemac
    ].map(function(l) {
      TeXShopCompatibility && l[1] && l.splice(0, 2, l[1], l[0]);
      return l[0] + " (" + l.slice(l.indexOf("")+1 || 1).join(", ") + ")";
    });
    if (this.Value) {
      var value = this.Value.toLowerCase(), i = 0;
      while (i < list.length && list[i].toLowerCase().indexOf(value) >= 0) {
        i++;
      }
      if (i < list.length) {
        list.unshift(this.Value);
      }
    }
    return list;
  }
}


function ProgramMagicComment()
{
  MagicComment.call(this, "program", "(TS-)?program");

  this.FromCommentString = function(match) {
    this.Index = match.index;
    this.Length = match[0].length;
    this.Value = match[2].trim();
    this.IsTeXShopSyntax = !!match[1];
  }

  this.ToCommentString = function() {
    return fmtMagicComment.format(TeXShopCompatibility ?
      "TS-program" : "program", this.Value);
  }

  this.GetList = function() {
    var list;
    // TW.getEngineList introduced in r1024
    if (!TW.getEngineList) {
      list = [
        "pdfLaTeX",
        "XeLaTeX",
        "LuaLaTeX",
        "pdfTeX",
        "XeTeX",
        "LuaTeX",
        "ConTeXt (LuaTeX)",
        "ConTeXt (pdfTeX)",
        "ConTeXt (XeTeX)",
        "BibTeX",
        "MakeIndex",
      ];
    }
    else {
      list = TW.getEngineList().map(function (e) { return e.name; });
    }
    if (this.Value) {
      // Case sensitive comparison
      if (list.indexOf(this.ToDisplayValue()) < 0) {
        list.unshift(this.Value);
      }
    }
    return list;
  }
}


function RootMagicComment()
{
  MagicComment.call(this, "root");

  this.ToCommentString = function() {
    // On Unix systems, TeXworks requires slashes, not backslashes
    return fmtMagicComment.format(this.Key, this.Value.replace(/\\/g, '/'));
  }

  this.ProvideValue = function() {
    var file = TW.app.getOpenFileName();
    var rootFolder = Path.getParentFolder(TW.target.fileName);
    return file ? Path.getRelativePath(file, rootFolder) : null;
  }

  this.GetList = function() {
    var rootFolder = Path.getParentFolder(TW.target.fileName);
    var list = TW.app.getOpenWindows().filter(function(w) {
      return w.objectName == "TeXDocument";
    }).map(function(w) {
      return Path.getRelativePath(w.fileName, rootFolder);
    });
    if (this.Value && list.indexOf(this.ToDisplayValue()) < 0) {
      list.unshift(this.Value);
    }
    return list;
  }
}


function SpellcheckMagicComment()
{
  MagicComment.call(this, "spellcheck");

  this.GetList = function() {
    var list = [];
    // TW.getDictionaryList introduced in r962
    if (!TW.getDictionaryList) {
      list = [
        "de_DE",
        "en_US",
        "es_ES",
        "fr_FR",
        "it_IT",
      ];
    }
    else {
      var diclist = TW.getDictionaryList();
      for (var d in diclist) {
        // avoid multiple references to the same dictionary
        if (list.indexOf(diclist[d][0]) < 0) {
          list.push(diclist[d][0]);
        }
      }
      list = list.map(Path.getFileNameWithoutExtension);
    }
    if (this.Value && list.indexOf(this.ToDisplayValue()) < 0) {
      list.unshift(this.Value);
    }
    return list
  }
}


var magicComments = [
  new EncodingMagicComment(),
  new ProgramMagicComment(),
  new RootMagicComment(),
  new SpellcheckMagicComment(),
];


function ReadMagicCommentsFromDocument()
{
  // Actually, in TeXworks PEEK_LENGTH specifies
  // how many *bytes* (not chars) are parsed
  var header = TW.target.text.slice(0, PEEK_LENGTH);

  magicComments.forEach(function(o) {
    var m = o.Regex.exec(header);
    if (m) {
      o.FromCommentString(m);
      if(o.IsTeXShopSyntax) {
        TeXShopCompatibility = true;
      }
    }
  });
}


function WriteMagicCommentsToDocument()
{
  var offset = 0, last = 0;

  magicComments.sort(function(o1,o2) {
    // We first set/reset magic comments already present (which have an Index)
    // sorting in ascending order by Index
    // At last we add new magic comments (having Index undefined)
    var d1 = typeof(o1.Index) != "undefined";
    var d2 = typeof(o2.Index) != "undefined";
    return d1 && d2 ? o1.Index - o2.Index : d2 - d1;
  }).forEach(function(o) {
    var rep = o.Value ? o.ToCommentString() : "";
    if (typeof(o.Index) != "undefined") {
      TW.target.selectRange(o.Index + offset, o.Length);
      last = o.Index + offset + rep.length;
      offset += rep.length - o.Length;
    }
    else if (o.Value) {
      TW.target.selectRange(last, 0);
      last = last + rep.length;
    }
    else {
      return;
    }
    // Avoid recording an undo operation if text is the same
    if (rep != TW.target.selection) {
      TW.target.insertText(rep);
    }
  });
}


function ShowDialog(ui_file)
{
  var xml = TW.readFile(ui_file);
  if(xml.status != 0) {
    TW.critical(null, "", CANNOT_LOAD_FILE.format(ui_file, xml.status));
    return false;
  }
  xml = xml.result;

  magicComments.forEach(function(o) {
    var list = o.GetList(), listXml = "";
    for (var i = 0; i < list.length; i++) {
      listXml += "<item><property name=\"text\"><string>" +
        EscapeXml(list[i]) + "</string></property></item>";
    }
    xml = xml.replace("{list-" + o.Key + "}", listXml);
  });

  var dialog = TW.createUIFromString(xml);
  if (!dialog) {
    TW.critical(null, "", CANNOT_CREATE_UI);
    return false;
  }

  var chk = [], cmb = [], btn = [];
  magicComments.forEach(function(o) {
    chk[o.Key] = TW.findChildWidget(dialog, "chk-" + o.Key);
    cmb[o.Key] = TW.findChildWidget(dialog, "cmb-" + o.Key);
    btn[o.Key] = TW.findChildWidget(dialog, "btn-" + o.Key);
    cmb[o.Key].editTextChanged.connect(function() {
      chk[o.Key].checked = true;
    });
    if (btn[o.Key]) {
      btn[o.Key].clicked.connect(function() {
        var value = o.ProvideValue();
        if(value) {
          cmb[o.Key].setEditText(value);
        }
      });
    }
    if (o.Value) {
      chk[o.Key].checked = true;
      cmb[o.Key].setEditText(o.ToDisplayValue());
    }
  });

  var chkTSCompatibility = TW.findChildWidget(dialog, "chkTSCompatibility");
  chkTSCompatibility.checked = TeXShopCompatibility;

  var result = dialog.exec() == 1;
  if (result) {
    TeXShopCompatibility = chkTSCompatibility.checked;
    magicComments.forEach(function(o) {
      o.Value = chk[o.Key].checked ?
        o.FromDisplayValue(cmb[o.Key].currentText.trim()) : "";
    });
  }
  return result;
}


if (typeof(justLoad) == "undefined") {
  ReadMagicCommentsFromDocument();
  if (ShowDialog("magicComments.ui")) {
    WriteMagicCommentsToDocument();
  }
}
undefined;
