var X = XLSX;
var rABS = typeof FileReader !== "undefined" && typeof FileReader.prototype !== "undefined" && typeof FileReader.prototype.readAsBinaryString !== "undefined";
var global_wb;

function processData() {
    for (let wb of wbs) {
        processExcel(processWB(wb), wb);
    }
}

function processStudentData() {
    for (let wb of wbsData) {
        processExcelStudentData(processWB(wb), wb);
    }
}

function processStudentNames() {
    for (let wb of wbsNames) {
        processExcelStudentNames(processWB(wb), wb);
    }
}

function processClassListData() {
    for (let wb of wbsClassList) {
        processExcelClassList(processWB(wb), wb);
    }
}

// function handleExcelDropDragover(e)
// {
// 	e.stopPropagation();
// 	e.preventDefault();
// 	if (!e.dataTransfer) {
// 		e.dataTransfer = e.originalEvent.dataTransfer;
// 	}
// 	e.dataTransfer.dropEffect = 'copy';
// }
// function handleExcelDropDragleave(e)
// {
// 	e.stopPropagation();
// 	e.preventDefault();
// }

function handleExcelClassList(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
    let rkeys = {};
    
    if (files) {
        keys = Object.keys(files);
        for (let k of keys) {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

        for (let k of keys) {
            let f = files[rkeys[k]];
            let reader = new FileReader();
            let name = f.name;
            reader.onload = function (e) {
                try {
                    let data = e.target.result;
                    wb = X.read(data, { type: 'binary' });
                    wb["customFileName"] = k;
                    wbsClassList.push(wb);
                }
                catch (e) {
                    console.log(e);
                }
            };
            if (rABS) {
                reader.readAsBinaryString(f);
            }
        }
    }
}

function handleExcelNamesFile(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
    let rkeys = {};
    
    if (files) {
        keys = Object.keys(files);
        for (let k of keys) {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

        for (let k of keys) {
            let f = files[rkeys[k]];
            let reader = new FileReader();
            let name = f.name;
            reader.onload = function (e) {
                try {
                    let data = e.target.result;
                    wb = X.read(data, { type: 'binary' });
                    wb["customFileName"] = k;
                    wbsNames.push(wb);
                }
                catch (e) {
                    console.log(e);
                }
            };
            if (rABS) {
                reader.readAsBinaryString(f);
            }
        }
    }
}

function handleExcelDataFile(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
    let rkeys = {};
    
    if (files) {
        keys = Object.keys(files);
        for (let k of keys) {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

        for (let k of keys) {
            let f = files[rkeys[k]];
            let reader = new FileReader();
            let name = f.name;
            reader.onload = function (e) {
                try {
                    let data = e.target.result;
                    wb = X.read(data, { type: 'binary' });
                    wb["customFileName"] = k;
                    wbsData.push(wb);
                }
                catch (e) {
                    console.log(e);
                }
            };
            if (rABS) {
                reader.readAsBinaryString(f);
            }
        }
    }
}

function handleExcelFile(e) {
    wbs = [];
    wb = {};
    e.stopPropagation();
    e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
    let rkeys = {};
    
    if (files) {
        keys = Object.keys(files);
        for (let k of keys) {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

        for (let k of keys) {
            let f = files[rkeys[k]];
            let reader = new FileReader();
            let name = f.name;
            reader.onload = function (e) {
                try {
                    let data = e.target.result;
                    wb = X.read(data, { type: 'binary' });
                    wb["customFileName"] = k;
                    wbs.push(wb);
                }
                catch (e) {
                    console.log(e);
                }
            };
            if (rABS) {
                reader.readAsBinaryString(f);
            }
        }
    }
}

function processWB(wb) {
    global_wb = wb;
    var output = "";
    output = JSON.stringify(wbToJSON(wb), 2, 2);
    return output;
}

function wbToJSON(workbook) {
    let result = {};
    let name;
    let heads = [];
    let maxCols = 50;

    for (let i = 1; i < maxCols; i++) {
        heads.push(numToColName(i));
    }

    for (let v of workbook.Workbook.Sheets) {
        if (v.Hidden == 0) {
            result[v.name] = X.utils.sheet_to_json(workbook.Sheets[v.name], { header: heads, defval: '' }); // defval ensures that rows that are empty are retained
        }
    }
    return result;
}

function s2ab(s) {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

function sheet_to_workbook(sheet/*:Worksheet*/, opts)/*:Workbook*/ {
    var n = opts && opts.sheet ? opts.sheet : "Sheet1";
    var sheets = {}; sheets[n] = sheet;
    return { SheetNames: [n], Sheets: sheets };
}

function aoa_to_workbook(data/*:Array<Array<any> >*/, opts)/*:Workbook*/ {
    return sheet_to_workbook(XLSX.utils.aoa_to_sheet(data, opts), opts);
}

function aoa_to_sheet(data/*:Array<Array<any> >*/, opts)/*:Workbook*/ {
    return XLSX.utils.aoa_to_sheet(data, opts);
}

function saveAsFile(inFile) {
    var textFile = null,
        makeTextFile = function (text) {
            var data = new Blob([text], { type: 'application/octet-stream' });

            // If we are replacing a previously generated file we need to
            // manually revoke the object URL to avoid memory leaks.
            if (textFile !== null) {
                window.URL.revokeObjectURL(textFile);
            }

            textFile = window.URL.createObjectURL(data);

            return textFile;
        };

    return makeTextFile(inFile);
}

/**
 * Converts number to excel column name.
*/
function numToColName(num) {
    for (var ret = '', a = 1, b = 26; (num -= a) >= 0; a = b, b *= 26) {
        ret = String.fromCharCode(parseInt((num % b) / a) + 65) + ret;
    }
    return ret;
}
