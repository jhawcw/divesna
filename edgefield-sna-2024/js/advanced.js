let colourBases = [
    "#9916C1",
    "#F4AB03",
    "#1CF69F",
    "#F4370A",
    "#1C49C1",
    "#A0F623",
    "#23D5F6",
    "#F06292",
    "#E6EE9C",
    "#FF5722",
];

const MAXGROUPS = 7;
const MINLINKS = 3; // Minimum number of links to be considered as a clique
const DELIMITER = ":";

let studentNodesToLinks = {};
let allStudentData = {};
let defaultNodeColour = "#222";
let hideNames = false;

let mainStudents = {};

let wbs = [];
let wbsNames = [];
let wbsData = [];
let wbsClassList = [];

let curIndex = 0;
let dataIndex = 0;

let zipFile = new JSZip();

let ignoredStudents = {
    "NONE": true,
};

let studentData = {};
let emailToName = {};
let usernameToName = {};
let excelToNodeDataMap = {};
let classListData = {};
let submittedData = {};
let classOutputData = {};
let cohortOutputData = {};
let sbbClassListData = {};
let curGraph;
let curFileName;
let curFileCount;
let degreeCentrality;
let studentTies = {};

let conductGradeList = {
    "POOR": 1,
    "FAIR": 2,
    "GOOD": 3,
    "VERY GOOD": 4,
    "EXCELLENT": 5,
};

let conductGradeToColour = {
    "POOR": "#d7191c",
    "FAIR": "#fdae61",
    "GOOD": "#ffdd71",
    "VERY GOOD": "#a6d96a",
    "EXCELLENT": "#1a9641",
};

let streamColourMap = {
    'EXPRESS': '#3069FF',
    'NORMAL(A)': '#FF6C49',
    'NORMAL(T)': '#81CC12',
}

var doc = new jsPDF();
doc.setFont("helvetica");

// Initialise Wizard Steps
$(".tab-wizard").steps({
    headerTag: "h6",
    bodyTag: "section",
    transitionEffect: "fade",
    titleTemplate: '<span class="step">#index#</span> #title#',
    labels: {
        finish: "Submit"
    },
    onFinished: function (event, currentIndex) {
        wbs.sort(function (a, b) {
            return a["customFileName"].localeCompare(b["customFileName"]);
        });
        processStudentNames();
        processData();
        processStudentData();
        processClassListData();
        getStudentLinksData(studentData, studentNodesToLinks);
        $('#wizard-row').addClass('d-none');
        $('#value-box-row').removeClass('d-none');
        $('#output-row').removeClass('d-none');
        showGraph();
        $('#print-pdf-btn').removeClass('d-none');
    }
});

$(function () {

    // Handles uploading of excel
    $("#upExcel").on("change", handleExcelFile);
    $("#upExcelData").on("change", handleExcelDataFile);
    $('#upExcelNameMap').on("change", handleExcelNamesFile);
    $("#upExcelClassList").on("change", handleExcelClassList);

    // Button toggles
    $(".nameToggle").on("click", toggleNameData);
    $(".conductToggle").on("click", toggleConductData);
    $(".gradeToggle").on("click", toggleGradeData);
    $(".genderToggle").on("click", toggleGenderData);
    $(".streamToggle").on("click", toggleStreamData);
    $(".psleToggle").on("click", togglePSLEData);

    // Image Download
    $(".saveImage").on("click", saveImage);
    $(".downloadZip").on("click", saveZip);
    $(".automate").on("click", automateGeneration);
    $(".automateSingle").on("click", autoclickLayerPermutations);

    // Reset Node
    $(".resetNodes").on("click", resetButtons);

    // Generate PDF
    $('#print-pdf-btn').on("click", generatePDF);

});

function getStudentLinksData(studentData, studentNodesToLinks) {
    if (studentData && studentNodesToLinks) {

        Object.keys(studentNodesToLinks).forEach(student => {

            let rawName = studentNodesToLinks[student]['rawName'];
            let inTies = studentNodesToLinks[student]['in'];
            let outTies = studentNodesToLinks[student]['out'];
            let grps = studentNodesToLinks[student]['groups'];

            if (studentTies[student] === undefined) {
                if (studentData[rawName] === undefined) {
                    alert(rawName + "'s student data cannot be found.");
                } else {
                    studentTies[student] = {
                        'stream': studentData[rawName]['STREAM'],
                        'gender': studentData[rawName]['GENDER'],
                        'conduct': studentData[rawName]['CONDUCT'],
                        'groups': grps,
                        'class': rawName.substring(1, 3),
                        'in': {},
                        'out': {}
                    };
                }
            }

            if (inTies && Object.keys(inTies).length > 0) {
                Object.keys(inTies).forEach(friend => {
                    let rawFriendName = studentNodesToLinks[friend]['rawName'];
                    let rawFriendData = studentData[rawFriendName];
                    if (rawFriendData && studentTies[student]['in'][friend] === undefined) {
                        studentTies[student]['in'][friend] = {
                            'stream': studentData[rawFriendName]['STREAM'],
                            'gender': studentData[rawFriendName]['GENDER'],
                            'conduct': studentData[rawFriendName]['CONDUCT'],
                            'class': rawFriendName.substring(1, 3)
                        }
                    }
                });
            }

            if (outTies && Object.keys(outTies).length > 0) {
                Object.keys(outTies).forEach(friend => {
                    let rawFriendName = studentNodesToLinks[friend]['rawName'];
                    let rawFriendData = studentData[rawFriendName];
                    if (rawFriendData && studentTies[student]['out'][friend] === undefined) {
                        studentTies[student]['out'][friend] = {
                            'stream': studentData[rawFriendName]['STREAM'],
                            'gender': studentData[rawFriendName]['GENDER'],
                            'conduct': studentData[rawFriendName]['CONDUCT'],
                            'class': rawFriendName.substring(1, 3)
                        }
                    }
                });
            }

            if (studentTies[student]['totalTies'] === undefined ||
                studentTies[student]['expTies'] === undefined ||
                studentTies[student]['naTies'] === undefined ||
                studentTies[student]['ntTies'] === undefined) {
                let expTies = [];
                let naTies = [];
                let ntTies = [];
                Object.keys(studentTies[student]['in']).forEach(friend => {
                    let friendStream = studentTies[student]['in'][friend]['stream'];
                    if (friendStream === 'EXPRESS') {
                        expTies.push(friend);
                    } else if (friendStream === 'NORMAL(A)') {
                        naTies.push(friend);
                    } else {
                        ntTies.push(friend);
                    }
                });
                studentTies[student]['totalTies'] = Object.keys(studentTies[student]['in']).length;
                studentTies[student]['expTies'] = expTies.length;
                studentTies[student]['naTies'] = naTies.length;
                studentTies[student]['ntTies'] = ntTies.length;
            }

        });
    }

    console.log('Student Ties:', studentTies);

    generateClassStats(studentTies);
    generateStudentLinksTable(studentTies);
}

function intersect(a, b) {
    var setB = new Set(b);
    return [...new Set(a)].filter(x => setB.has(x));
}

function generateClassStats(studentTies) {
    let classSize = Object.keys(studentTies).length;
    let groupByStream = {
        'EXPRESS': [],
        'NORMAL(A)': [],
        'NORMAL(T)': []
    };
    let totalTies = [];
    let totalMutualTies = [];
    let totalTiesCount = 0;
    let totalMutualTiesCount = 0;
    let mutualTiesPercentage = 0;
    let mixStreamFriendships = {
        'EXPRESS': [],
        'NORMAL(A)': [],
        'NORMAL(T)': []
    };
    let circleOfInfluence = {
        'EXPRESS': [],
        'NORMAL(A)': [],
        'NORMAL(T)': []
    };
    Object.keys(studentTies).forEach(student => {

        let studentData = studentTies[student];
        let inTies = Object.keys(studentData.in);
        let outTies = Object.keys(studentData.out);
        let mututalFriends = intersect(inTies, outTies);
        let hasMixStreamFriendship = false;

        totalTies.push(outTies.length);
        totalMutualTies.push(mututalFriends.length);

        if (studentData.stream === 'EXPRESS') {
            groupByStream['EXPRESS'].push(student);
        } else if (studentData.stream == 'NORMAL(A)') {
            groupByStream['NORMAL(A)'].push(student);
        } else if (studentData.stream == 'NORMAL(T)') {
            groupByStream['NORMAL(T)'].push(student);
        }

        Object.keys(studentData.out).forEach(friend => {
            let friendData = studentData.out[friend];
            if (studentData.stream !== friendData.stream) {
                hasMixStreamFriendship = true;
            }
        });

        if (studentData.stream.length == 0) {
            if (mixStreamFriendships['UNKNOWN'] === undefined) {
                mixStreamFriendships['UNKNOWN'] = [];
            }
            if (circleOfInfluence['UNKNOWN'] === undefined) {
                circleOfInfluence['UNKNOWN'] = [];
            }
            mixStreamFriendships['UNKNOWN'].push(hasMixStreamFriendship);
            // Circle of Influence (>= 4 in-degree friends with at least one mix-stream friend)
            if (inTies.length >= 4 && hasMixStreamFriendship) {
                circleOfInfluence['UNKNOWN'].push(student);
            }
        } else {
            mixStreamFriendships[studentData.stream].push(hasMixStreamFriendship);
            // Circle of Influence (>= 4 in-degree friends with at least one mix-stream friend)
            if (inTies.length >= 4 && hasMixStreamFriendship) {
                circleOfInfluence[studentData.stream].push(student);
            }
        }

    });

    totalTiesCount = totalTies.reduce((a, b) => a + b, 0); // Array sum
    totalMutualTiesCount = totalMutualTies.reduce((a, b) => a + b, 0); // Array sum
    mutualTiesPercentage = Math.round(totalMutualTiesCount / totalTiesCount * 100).toFixed(1);

    $('#class-size').text(classSize);
    $('#exp-students').text(groupByStream['EXPRESS'].length);
    $('#na-students').text(groupByStream['NORMAL(A)'].length);
    $('#nt-students').text(groupByStream['NORMAL(T)'].length);

    $('#total-ties').text(totalTiesCount);
    $('#total-mutual-ties').text(totalMutualTiesCount);
    $('#percentage-mutual-ties').text(mutualTiesPercentage + '%');

    $('#exp-students-mix-stream').text(mixStreamFriendships['EXPRESS'].reduce((a, b) => a + b, 0));
    $('#na-students-mix-stream').text(mixStreamFriendships['NORMAL(A)'].reduce((a, b) => a + b, 0));
    $('#nt-students-mix-stream').text(mixStreamFriendships['NORMAL(T)'].reduce((a, b) => a + b, 0));

    $('#exp-students-influence').text(circleOfInfluence['EXPRESS'].length);
    $('#na-students-influence').text(circleOfInfluence['NORMAL(A)'].length);
    $('#nt-students-influence').text(circleOfInfluence['NORMAL(T)'].length);
}

function generateStudentLinksTable(studentTies) {
    let output = '';
    let streamMap = {
        'EXPRESS': 'E',
        'NORMAL(A)': 'NA',
        'NORMAL(T)': 'NT'
    };
    Object.keys(studentTies).forEach(student => {

        let studentData = studentTies[student];
        let inTies = Object.keys(studentData.in);
        let outTies = Object.keys(studentData.out);
        let mututalFriends = intersect(inTies, outTies);
        let hasMixStreamFriendship = false;
        let isInfluencer = false;

        Object.keys(studentData.out).forEach(friend => {
            let friendData = studentData.out[friend];
            if (studentData.stream !== friendData.stream) {
                hasMixStreamFriendship = true;
            }
        });

        // Circle of Influence (>= 4 in-degree friends with at least one mix-stream friend)
        if (inTies.length >= 4 && hasMixStreamFriendship) {
            isInfluencer = true;
        }

        // Generate HTML
        output += '<tr>';
        if (isInfluencer) {
            output += '<td class="bg-success">' + student + '</td>';
        } else {
            output += '<td>' + student + '</td>';
        }
        output += '<td class="text-center">' + streamMap[studentTies[student]['stream']] + '</td>';
        output += '<td class="text-center">' + studentTies[student]['totalTies'] + '</td>';
        output += '<td class="text-center">' + mututalFriends.length + '</td>';
        output += '<td class="text-center">' + studentTies[student]['expTies'] + '</td>';
        output += '<td class="text-center">' + studentTies[student]['naTies'] + '</td>';
        output += '<td class="text-center">' + studentTies[student]['ntTies'] + '</td>';
        output += '</tr>';
    });
    $('#summary-table-body').html(output);
    $('#summary-table').DataTable({
        "order": [[2, "desc"]],
        "paging": false
    });
}

function toggleButtonClass(btnClassName) {
    $("." + btnClassName).toggleClass("active");
}

function resetButtons() {
    $(".conductToggle").removeClass("active");
    $(".gradeToggle").removeClass("active");
    $(".genderToggle").removeClass("active");
    $(".streamToggle").removeClass("active");
    $(".psleToggle").removeClass("active");
}

function toggleLayeredData(nodeClasses, edgeClasses, state = undefined) {
    for (let n of nodeClasses) {
        curGraph.$("node > $node").toggleClass(n, state);
    }
    for (let e of edgeClasses) {
        curGraph.$("edge").toggleClass(e, state);
    }
}

function toggleNameData() {
    hideNames = hideNames ? false : true;
    toggleButtonClass("nameToggle");
    if (curFileName !== undefined && excelToNodeDataMap[curFileName] !== undefined) {
        parseDataIntoGraph(curFileName, excelToNodeDataMap[curFileName]);
    }
}

function toggleConductData() {
    toggleButtonClass("conductToggle");
    toggleLayeredData(["showGradeNode"], ["showGradeEdge"], false);
    toggleLayeredData(["showPSLENode"], ["showPSLEEdge"], false);
    toggleLayeredData(["showConductNode"], ["showConductEdge"]);
}

function toggleGradeData() {
    toggleButtonClass("gradeToggle");
    toggleLayeredData(["showConductNode"], ["showConductEdge"], false);
    toggleLayeredData(["showPSLENode"], ["showPSLEEdge"], false);
    toggleLayeredData(["showGradeNode"], ["showGradeEdge"]);
}

function toggleGenderData() {
    toggleButtonClass("genderToggle");
    toggleLayeredData(["showStreamNode"], [], false);
    toggleLayeredData(["showGenderNode"], []);
}

function toggleStreamData() {
    toggleButtonClass("streamToggle");
    toggleLayeredData(["showGenderNode"], [], false);
    toggleLayeredData(["showStreamNode"], []);
}

function togglePSLEData() {
    toggleButtonClass("psleToggle");
    toggleLayeredData(["showConductNode"], ["showConductEdge"], false);
    toggleLayeredData(["showGradeNode"], ["showGradeEdge"], false);
    toggleLayeredData(["showPSLENode"], ["showPSLEEdge"]);
}

function automateGeneration() {
    $(".graphFile").each(function (ind, ele) {
        $(this).trigger("click");
        autoclickLayerPermutations();
    });
}

function autoclickLayerPermutations() {
    /**
     * Overall
     */

    // By Ties
    $(".saveImage").trigger("click");

    // By Conduct
    $(".conductToggle").trigger("click");
    $(".saveImage").trigger("click");

    // By Grade
    $(".gradeToggle").trigger("click");
    $(".saveImage").trigger("click");

    // By PSLE
    $(".psleToggle").trigger("click");
    $(".saveImage").trigger("click");

    /**
     * By Gender
     */
    $(".genderToggle").trigger("click");

    // Gender + Grade
    $(".gradeToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Gender + PSLE
    $(".psleToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Gender + Conduct
    $(".conductToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Gender + Ties
    $(".conductToggle").trigger("click");
    $(".saveImage").trigger("click");

    /**
     * By Stream
     */
    $(".streamToggle").trigger("click");

    // Stream + Grade
    $(".gradeToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Stream + PSLE
    $(".psleToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Stream + Conduct
    $(".conductToggle").trigger("click");
    $(".saveImage").trigger("click");

    // Stream + Ties
    $(".conductToggle").trigger("click");
    $(".saveImage").trigger("click");

}

function colourStudentNodesByLinks(sortedNodes, targetNodes) {
    
    let secondPass = [];
    let assignedGroups = {};

    for (let i = 0; i < MAXGROUPS; i++) {
        if (Object.keys(targetNodes[sortedNodes[i]["name"]]["in"]).length >= MINLINKS) {
            mainStudents[sortedNodes[i]["name"]] = colourBases[i];
            targetNodes[sortedNodes[i]["name"]]["networkColour"] = colourBases[i];
            assignedGroups[sortedNodes[i]["name"]] = true;
        }
    }

    // console.log(assignedGroups);

    // Colour student nodes
    // Colour nodes directly connected to main students first (who chose main student)
    for (let v in mainStudents) {
        for (let studentName in targetNodes["in"]) {
            targetNodes[studentName]["networkColour"] = getColourFromLinks(targetNodes[studentName], targetNodes);
        }
    }

    // Add strength of relationship - ?
    for (let v in targetNodes) {
        targetNodes[v]["networkColour"] = getColourFromLinks(targetNodes[v], targetNodes);
        if (targetNodes[v]["networkColour"] === undefined) {
            secondPass.push(targetNodes[v]);
        }

        targetNodes[v]["INLINKS"] = Object.keys(targetNodes[v]["in"]).length;
    }

    // console.log(secondPass);

    tmpArr = [];

    // Should never need so many passes
    for (let i = 0; i < 100; i++) {
        for (let v of secondPass) {
            v["networkColour"] = getColourFromLinks(v, targetNodes);
            if (v["networkColour"] === undefined) {
                tmpArr.push(v);
            }
        }

        if (tmpArr.length === 0) {
            break;
        }
        secondPass = tmpArr;
        tmpArr = [];
    }

    // console.log(sortedNodes, mainStudents, targetNodes);

    return undefined;
}

function colourByConductGrades(targetNodes) {
    let curColour;
    let conduct;
    let rawName;

    for (let v in targetNodes) {
        curColour = defaultNodeColour;
        conduct = "none";
        rawName = targetNodes[v]["rawName"];

        if (studentData[rawName] !== undefined) {
            if (studentData[rawName]["CONDUCT"] !== undefined) {
                conduct = studentData[rawName]["CONDUCT"].trim().toLocaleUpperCase();
            }
            if (conductGradeToColour[conduct] !== undefined) {
                curColour = conductGradeToColour[conduct];
            }
            else {
                console.log("Conduct colour not found ", v, rawName, conduct)
            }
        }
        else {
            console.log("No conduct data for ", v, rawName)
        }
        targetNodes[v]["conductColour"] = curColour;
    }

    return "CONDUCT";
}

function colourByOverallGrades(targetNodes) {
    let overallGrade = 0;
    let curColour;
    let rawName;

    for (let v in targetNodes) {
        overallGrade = 0;
        curColour = "#000";
        rawName = targetNodes[v]["rawName"];
        if (studentData[rawName] !== undefined) {
            if (studentData[rawName]["OVERALL"] !== undefined) {
                overallGrade = studentData[rawName]["OVERALL"];
            }
            curColour = getColourFromGrade(Number(overallGrade));
        }
        else {
            // console.log("Student ", rawName, "not found");
        }

        targetNodes[v]["gradeColour"] = curColour;
    }

    return "OVERALL";
}

function colourByGender(targetNodes) {
    let gender;
    let curColour;
    let rawName;

    for (let v in targetNodes) {
        gender = "";
        curColour = "#000";
        rawName = targetNodes[v]["rawName"];
        if (studentData[rawName] !== undefined) {
            if (studentData[rawName]["GENDER"] !== undefined) {
                gender = studentData[rawName]["GENDER"];
            }
            curColour = getColourFromGender(gender);
        }
        else {
            // console.log("Student ", rawName, "not found");
        }

        targetNodes[v]["genderColour"] = curColour;
    }

    return "GENDER";
}

function colourByStream(targetNodes) {
    let stream;
    let curColour;
    let rawName;

    for (let v in targetNodes) {
        stream = "";
        curColour = "#000";
        rawName = targetNodes[v]["rawName"];
        if (studentData[rawName] !== undefined) {
            if (studentData[rawName]["STREAM"] !== undefined) {
                stream = studentData[rawName]["STREAM"];
            }
            curColour = getColourFromStream(stream);
        }
        else {
            // console.log("Stream: Student ", rawName, "not found");
        }

        targetNodes[v]["streamColour"] = curColour;
    }

    return "STREAM";
}

function colourByPSLE(targetNodes) {

    let PSLE = 0;
    let curColour;
    let rawName;

    for (let v in targetNodes) {
        PSLE = 0;
        curColour = "#000";
        rawName = targetNodes[v]["rawName"];
        if (studentData[rawName] !== undefined) {
            if (studentData[rawName]["PSLE"] !== undefined) {
                PSLE = studentData[rawName]["PSLE"];
            }
            curColour = getColourFromPSLE(Number(PSLE));
        }
        else {
            // console.log("Student ", rawName, "not found");
        }

        targetNodes[v]["psleColour"] = curColour;
    }

    return "PSLE";
}

function getColourFromStream(stream) {
    if (stream === undefined) {
        return defaultNodeColour;
    } else {
        return streamColourMap[stream.toLocaleUpperCase()];
    }
}

function getColourFromGender(gender) {
    if (gender === undefined) {
        gender = "";
    }
    if (gender.substr(0, 1).toLocaleUpperCase() == "M") {
        return "#066db1";
    }
    else if (gender.substr(0, 1).toLocaleUpperCase() == "F") {
        return "#e776a4";
    }

    return defaultNodeColour;
}

function getColourFromGrade(value) {
    if (value >= 75) {
        return "#8bc34a";
    }
    else if (value >= 70) {
        return "#cddc39";
    }
    else if (value >= 65) {
        return "#ffeb3b";
    }
    else if (value >= 60) {
        return "#ffc107";
    }
    else if (value >= 55) {
        return "#ff9800";
    }
    else if (value >= 50) {
        return "#ffab91";
    }
    else if (value >= 0) {
        return "#f4511e";
    }

    return defaultNodeColour;
}

function getColourFromPSLE(value) {

    if (value >= 240) {
        return "#8bc34a";
    }
    else if (value >= 220) {
        return "#cddc39";
    }
    else if (value >= 200) {
        return "#ffeb3b";
    }
    else if (value >= 180) {
        return "#ffc107";
    }
    else if (value >= 160) {
        return "#ff9800";
    }
    else if (value >= 140) {
        return "#ffab91";
    }
    else if (value >= 0) {
        return "#f4511e";
    }

    return defaultNodeColour;
}

function parseDataIntoGraph(fileName, targetNodes) {

    let eles = [];
    let nodes = [];
    let edges = [];
    let cur;
    let baselabelTextColour = "#222";
    let highlightlabelTextColour = "#EF2020";
    let labelTextColour;
    let baseNodeShape = "ellipse";
    let isolatedNodeShape = "diamond";
    let nodeShape;
    let count = 0;
    let baseWidth = 10;
    let growStep = 25;
    let maxWidth = 180;
    let baseEdgeSize = 1;
    let growEdge = 3;
    let baseEdgeOpac = 40;
    let growOpac = 12;
    let curSize;
    let curOpac;
    let sortedNodes = [];
    let tmpArr;
    let inWeight;
    let tmpColour;
    let doubleLinkMap = {};
    let arrowScale;
    let largerFontSize = '50px';
    let smallerFontSize = '30px';

    // For toggling of names
    let studentNames = [];
    for (let i = 1; i < 200; i++) {
        studentNames.push("Student " + i);
    }

    let displayName;
    let studentCount = 0;
    let sizeData;
    let fontSize;
    let dataElement;
    let conductData;
    let conductColour;
    let conductLabel;
    let gradeData;
    let gradeColour;
    let gradeLabel;
    let genderData;
    let genderColour;
    let streamData;
    let streamColour;
    let psleData;
    let psleColour;
    let psleLabel;
    // let grpData;
    // let grpColour;

    for (let v in targetNodes) {
        targetNodes[v]["name"] = v;
        sortedNodes.push(targetNodes[v]);
    }

    // Sort in descending order by students with the most in-links
    sortedNodes.sort(function (a, b) {
        return Object.keys(b["in"]).length - Object.keys(a["in"]).length
    });

    if (sortedNodes.length === 0) {
        console.log("Warning:  No data for ", fileName);
        return;
    }

    dataElement = colourStudentNodesByLinks(sortedNodes, targetNodes);
    gradeData = colourByOverallGrades(targetNodes);
    conductData = colourByConductGrades(targetNodes);
    genderData = colourByGender(targetNodes);
    streamData = colourByStream(targetNodes);
    psleData = colourByPSLE(targetNodes);
    // grpData = colorByTeachingGroup(targetNodes);

    // console.log(dataElement, gradeData, conductData, genderData, streamData, psleData);

    for (let v in targetNodes) {
        tmpColour = defaultNodeColour;
        conductColour = defaultNodeColour;
        labelTextColour = baselabelTextColour;
        nodeShape = baseNodeShape;

        cur = targetNodes[v]["in"];
        curSize = (baseWidth + (growStep * (Object.keys(cur).length)));
        if (curSize > maxWidth) {
            curSize = maxWidth;
        }
        borderWidth = 0;
        if (targetNodes[v]["networkColour"] !== undefined) {
            tmpColour = targetNodes[v]["networkColour"];
        }
        if (Object.keys(cur).length === 0) {
            borderWidth = 2;
            // Highlight isolated nodes
            labelTextColour = highlightlabelTextColour;
            nodeShape = isolatedNodeShape;
            curSize = baseWidth + (growStep * 3);
            tmpColour = "#000";
        }

        displayName = v;
        if (hideNames) {
            displayName = studentNames[studentCount];
        }
        // if (displayName.length > 20) {
        // 	displayName = displayName.substr(0, 18) + "...";
        // }

        sizeData = Object.keys(cur).length;
        fontSize = largerFontSize;

        if (studentData[targetNodes[v]["rawName"]] !== undefined && dataElement !== undefined) {
            sizeData = studentData[targetNodes[v]["rawName"]][dataElement];
            fontSize = smallerFontSize;
        }

        conductLabel = "Not Found";
        if (studentData[targetNodes[v]["rawName"]] !== undefined && conductData !== undefined) {
            if (targetNodes[v]["conductColour"] !== undefined) {
                conductColour = targetNodes[v]["conductColour"];
            }
            conductLabel = studentData[targetNodes[v]["rawName"]][conductData];
        }

        gradeLabel = "Not Found";
        gradeColour = defaultNodeColour;
        if (studentData[targetNodes[v]["rawName"]] !== undefined && gradeData !== undefined) {
            if (targetNodes[v]["gradeColour"] !== undefined) {
                gradeColour = targetNodes[v]["gradeColour"];
            }
            gradeLabel = studentData[targetNodes[v]["rawName"]][gradeData];
        }

        genderColour = defaultNodeColour;
        if (studentData[targetNodes[v]["rawName"]] !== undefined && genderData !== undefined) {
            if (targetNodes[v]["genderColour"] !== undefined) {
                genderColour = targetNodes[v]["genderColour"];
            }
        }

        streamColour = defaultNodeColour;
        if (studentData[targetNodes[v]["rawName"]] !== undefined && streamData !== undefined) {
            if (targetNodes[v]["streamColour"] !== undefined) {
                streamColour = targetNodes[v]["streamColour"];
            }
        }

        psleLabel = "Not Found";
        psleColour = defaultNodeColour;
        if (studentData[targetNodes[v]["rawName"]] !== undefined && psleData !== undefined) {
            if (targetNodes[v]["psleColour"] !== undefined) {
                psleColour = targetNodes[v]["psleColour"];
            }
            psleLabel = studentData[targetNodes[v]["rawName"]][psleData];
        }

        // grpColour = defaultNodeColour;
        // if (studentData[targetNodes[v]["rawName"]] !== undefined && grpData !== undefined) {
        //     if (targetNodes[v]["grpColour"] !== undefined) {
        //         grpColour = targetNodes[v]["grpColour"];
        //     }
        // }

        // Add to nodes
        nodes.push({
            data: {
                id: v + "-parent",
                nameData: displayName,
                width: curSize + "px",
                colourData: tmpColour,
                labelTextColour: labelTextColour,
            },
        });

        // Add child to node, for extra label
        nodes.push({
            data: {
                id: v,
                parent: v + "-parent",
                width: curSize + "px",
                colourData: tmpColour,
                sizeData: sizeData,
                fontSize: fontSize,
                labelTextColour: labelTextColour,
                borderWidthData: borderWidth,
                conductColour: conductColour,
                conductLabel: conductLabel,
                gradeColour: gradeColour,
                gradeLabel: gradeLabel,
                genderColour: genderColour,
                streamColour: streamColour,
                psleColour: psleColour,
                psleLabel: psleLabel,
                // grpColor: grpColor,
                // grpLabel: grpLabel,
                nodeShape: nodeShape,
            },
        });

        cur = targetNodes[v]["out"];
        curOpac = 0.75;

        // Add edges for out
        for (let ed in cur) {
            // Check if double link has already been done
            if (doubleLinkMap[ed + v] !== undefined) {
                continue;
            }
            curSize = baseEdgeSize + (Number(cur[ed]) * growEdge);
            arrowScale = 2.5;
            // inWeight = 0;
            if (targetNodes[v]["in"][ed] !== undefined) {
                // inWeight = targetNodes[v]["in"][ed];
                // double linked
                arrowScale = 0;
                doubleLinkMap[v + ed] = true;

                edges.push({
                    data: {
                        id: v + "-e" + count,
                        source: v,
                        target: ed,
                        widthData: curSize,
                        opacData: curOpac,
                        colourData: tmpColour,
                        arrowScaleData: arrowScale,
                    },
                });
            } else {
                edges.push({
                    data: {
                        id: v + "-e" + count,
                        source: v,
                        target: ed,
                        widthData: curSize,
                        opacData: curOpac,
                        colourData: tmpColour,
                    },
                });
            }

            // curOpac = ((baseEdgeOpac + (inWeight * growOpac)) / 100);
            count++;
        }

        studentCount++;
    }

    for (let v of nodes) {
        eles.push(v);
    }

    for (let v of edges) {
        eles.push(v);
    }

    // console.log(nodes, edges);
    curGraph = showCytoscape(eles, outputImage, fileName);
    curFileName = fileName;
    curFileCount = 0;

    // curGraph.on('click', function (e) {
    //     console.log('Clicked: ' + e.target);
    // });
}

function saveImage() {
    if (zipFile !== undefined && curGraph !== undefined) {

        curFileCount++;

        let img = curGraph.png({
            bg: "#fff",
            full: "true",
            output: "base64",
        });
        // console.log("Adding: ", curFileName);

        let imgfileName = curFileName.replace(/.xlsx|.xls/, "");
        let saveFileName = imgfileName + " - " + curFileCount + ".png";

        zipFile.file(saveFileName, img, {
            base64: "true",
        });

        toastr.info('Added File: ' + saveFileName);

        updateFileList();
    }
}

function saveZip() {
    // console.log("Generating zip", zipFile);
    zipFile.generateAsync({ type: "blob" })
        .then(function (blob) {
            saveAs(blob, "network_data.zip");
        });
}

function outputImage(cy, fileName) {
    let img = cy.png({
        bg: "#fff",
        full: "true",
        output: "base64",
    });

    let imgfileName = fileName.replace(/.xlsx|.xls/, "");

    zipFile.file(imgfileName + ".png", img, {
        base64: "true",
    });

    // console.log("Adding zip image", zipFile);
}

function generatePDF() {
    let img = '';
    let alias = '';
    let data;
    let result = [];
    let attr = { full: "true", quality: 1 };
    let fileName = curFileName.replace(/.xlsx|.xls/, "");
    let pdfName = fileName + '.pdf';

    // Dynamically Generate Chart Images into JPG

    /**
     * Without Mappings
     */
    // By Ties
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Ties', 'image': img });

    // By Conduct
    $(".conductToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Conduct', 'image': img });

    // By Grade
    $(".gradeToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Grade', 'image': img });

    // By PSLE
    $(".psleToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by PSLE T-Score', 'image': img });

    /**
     * Gender Mapping
     */
    $(".genderToggle").trigger("click");

    // Gender + Grade
    $(".gradeToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Grade (Gender Map)', 'image': img });

    // Gender + PSLE
    $(".psleToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by PSLE T-Score (Gender Map)', 'image': img });

    // Gender + Conduct
    $(".conductToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Conduct (Gender Map)', 'image': img });

    // Gender + Ties
    $(".conductToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Ties (Gender Map)', 'image': img });

    /**
     * By Stream
     */
    $(".streamToggle").trigger("click");

    // Stream + Grade
    $(".gradeToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Grade (Stream Map)', 'image': img });

    // Stream + PSLE
    $(".psleToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by PSLE T-Score (Stream Map)', 'image': img });

    // Stream + Conduct
    $(".conductToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Conduct (Stream Map)', 'image': img });

    // Stream + Ties
    $(".conductToggle").trigger("click");
    img = curGraph.jpg(attr);
    result.push({ 'header': 'Analysis by Ties (Stream Map)', 'image': img });

    // Create Cover Page
    doc.text(15, 120, fileName);
    doc.text(15, 140, 'Social Network Analysis Report');

    // Loop through each image and insert into PDF
    for (let i = 0; i < result.length; i++) {
        data = result[i];
        alias = 'alias-' + i;
        doc.addPage();
        doc.addImage(data['image'], 'JPEG', 15, 30, 180, 160, alias, 'FAST'); // imageData, format, x, y, width, height, alias, compression
        doc.text(15, 16, data['header']);
    }

    // Save the PDF
    doc.save(pdfName);

}

// Calculates colour based off out links
function getColourFromLinks(student, targetNodes) {
    if (mainStudents[student["name"]]) {
        return mainStudents[student["name"]];
    }
    let baseColour;
    let outLinks = student["out"];
    let inLinks = student["in"];

    let oldWeight = 0;
    let newWeight = 0;

    let curColour;
    let distance = 0;
    let target = outLinks;

    // Check outlinks first, then in links
    for (let i = 0; i < 2; i++) {
        if (i === 1) {
            target = inLinks;
        }
        // If linked to a mainstudent take student colour
        for (let v in target) {
            // Main student colours take priority over other links
            if (mainStudents[v]) {
                if (baseColour === undefined) {
                    // No previous colour
                    baseColour = mainStudents[v]
                    oldWeight = 1;
                    if (inLinks[v]) {
                        oldWeight += 5;
                    }
                }
                else {
                    newWeight = 1;
                    if (inLinks[v]) {
                        newWeight += 5;
                    }
                    // Blend colours based on weights (more weight if link goes both ways)
                    baseColour = blend_colors(baseColour, mainStudents[v], newWeight / (oldWeight + newWeight));
                    oldWeight += newWeight;
                }
            }
        }

        if (baseColour === undefined) {
            // No main student links
            for (let v in target) {
                // Colour based off other student links
                if (targetNodes[v]["networkColour"]) {
                    if (baseColour === undefined) {
                        // No previous colour
                        baseColour = targetNodes[v]["networkColour"]
                        oldWeight = 1;
                        if (inLinks[v]) {
                            oldWeight += 1;
                        }
                    }
                    else {
                        newWeight = 1;
                        if (inLinks[v]) {
                            newWeight += 1;
                        }
                        // Blend colours based on weights (more weight if link goes both ways)
                        baseColour = blend_colors(baseColour, targetNodes[v]["networkColour"], newWeight / (oldWeight + newWeight));
                        oldWeight += newWeight;
                    }
                }
            }
        }
    }

    return baseColour;
}

// ret determines which portion of the split to return, class or student
function parseStudentName(inName, ret = 1) {
    if (inName === undefined) {
        return inName;
    }
    let split = inName.split(DELIMITER);

    if (split.length !== 2) {
        return undefined;
    }

    return split[ret];
}

function processSubmitted() {
    let output = [];
    
    console.log('submittedData', submittedData);

    // Output those who have yet to submit
    for (let s in classListData) {
        if (submittedData[s] === undefined) {
            output.push(s);
        }
    }

    let str = "";

    for (let v of output) {
        str += v + "<br>";
    }

    $("#tempOut").html(str);

    console.log('classOutputData', classOutputData);
    console.log('cohortOutputData', cohortOutputData);
}

function generateRawOutput() {
    let output = {};
    let output2 = [];
    let output3 = {};
    let trow = [];
    let parsedName;
    let parsedClass;
    let data;
    let dataTypes = ["GENDER", "OVERALL", "CONDUCT", "PSLE"];
    let baseDataRow = ["id", "label"];

    for (let v of dataTypes) {
        baseDataRow.push(v);
    }

    for (let v in classOutputData) {
        parsedName = parseStudentName(v);
        parsedClass = parseStudentName(v, 0);

        if (output[parsedClass] === undefined) {
            output[parsedClass] = [];
            output[parsedClass].push(["Name", "Friend"]);

            output3[parsedClass] = [];
            output3[parsedClass].push(baseDataRow);
        }
        for (let c of classOutputData[v]) {
            output[parsedClass].push([parsedName, parseStudentName(c)]);
        }

        trow = [parsedName, parsedName];

        for (let t of dataTypes) {
            data = "";
            if (studentData[v] !== undefined) {
                if (studentData[v][t] !== undefined) {
                    data = studentData[v][t];
                }
            }

            trow.push(data);
        }

        output3[parsedClass].push(trow);
    }

    output2.push(["Name", "Cohort Friend"]);

    for (let v in cohortOutputData) {
        for (let c of cohortOutputData[v]) {
            output2.push([v, c]);
        }
    }

    let sheetNames = [];
    let sheetsArr = {};
    let opts = {};
    let sname;

    for (let n in output) {
        sname = n;
        if (n.length > 10) {
            sname = n.substr(0, 10);
        }
        sheetsArr[sname] = XLSX.utils.aoa_to_sheet(output[n], opts);
        sheetNames.push(sname);
    }

    let workbook = { SheetNames: sheetNames, Sheets: sheetsArr }
    let outbin = XLSX.write(workbook, { bookType: 'xlsx', bookSST: true, type: 'binary' });
    let link = saveAsFile(s2ab(outbin));

    $("#downloadlinkClass").attr("href", link);
    $("#downloadlinkClass").css({
        visibility: "visible"
    });

    let outxls = aoa_to_workbook(output2);
    outbin = XLSX.write(outxls, { bookType: 'xlsx', bookSST: true, type: 'binary' });
    link = saveAsFile(s2ab(outbin));

    $("#downloadlinkCohort").attr("href", link);
    $("#downloadlinkCohort").css({
        visibility: "visible"
    });

    console.log(output3);

    sheetNames = [];
    sheetsArr = {};
    for (let n in output3) {
        sname = n;
        if (n.length > 15) {
            sname = n.substr(0, 15);
        }
        sheetsArr[sname] = XLSX.utils.aoa_to_sheet(output3[n], opts);
        sheetNames.push(sname);
    }

    workbook = { SheetNames: sheetNames, Sheets: sheetsArr }
    outbin = XLSX.write(workbook, { bookType: 'xlsx', bookSST: true, type: 'binary' });
    link = saveAsFile(s2ab(outbin));

    $("#downloadlinkData").attr("href", link);
    $("#downloadlinkData").css({
        visibility: "visible"
    });
}

/**
 * Process Survey Responses Excel File
 * @param {arr} arr
 * @param {arr} wb
 */
function processExcel(arr, wb) {
    arr = JSON.parse(arr);
    let rows;
    let sheets = Object.keys(arr);

    if (sheets[0] == "Data - Classlist") {
        processClassList(arr, wb);
        processNext();
    } else {
        processClassData(arr, wb);
        processSubmitted();
    }
}

/**
 * Process Student Data Excel File
 * @param {arr} arr 
 * @param {arr} wb 
 */
function processExcelStudentData(arr, wb) {

    let data = JSON.parse(arr);
    let rows;
    let sheets = Object.keys(data);

    for (let n of sheets) {
        switch (n.toLocaleUpperCase().trim()) {
            case "DATA - GENDER":
                processAdditionalData(data[n], "GENDER");
                break;
            case "DATA - OVERALL":
                processAdditionalData(data[n], "OVERALL");
                break;
            case "DATA - CONDUCT":
                processAdditionalData(data[n], "CONDUCT");
                break;
            case "DATA - STREAM":
                processAdditionalData(data[n], "STREAM");
                break;
            case "DATA - PSLE":
                processAdditionalData(data[n], "PSLE");
                break;
            case "DATA - CLASSLIST":
                processClassList(data[n], wb)
                break;
        }
    }

    console.log('Student Data', studentData);
}

/**
 * Process SBB Class List Excel File
 * @param {arr} arr
 * @param {arr} wb
 */
function processExcelStudentNames(arr, wb) {
    let data = JSON.parse(arr);
    let rows;
    let sheets = Object.keys(data);
    let dataStartRow = 1;
    for (let s of sheets) {
        rows = data[s];
        for (let i = dataStartRow; i < rows.length; i++) {
            let username = rows[i]["B"].toLocaleUpperCase();
            let fullname = rows[i]["C"].toLocaleUpperCase();
            let email = rows[i]['D'];
            if (email && email.length > 0) {
                if (!emailToName[email]) {
                    emailToName[email] = {
                      username: username,
                      fullname: fullname,
                    };
                }
            }
            if (!usernameToName[username]) {
                usernameToName[username] = fullname;
            }
        }
    }
    console.log('emailToName:', emailToName);
    console.log('usernameToName:', usernameToName);
}


/**
 * Process SBB Class List Excel File
 * @param {arr} arr
 * @param {arr} wb
 */
function processExcelClassList(arr, wb) {

    let data = JSON.parse(arr);
    let rows;
    let sheets = Object.keys(data);
    let dataStartRow = 1;

    for (let grp of sheets) {

        // Skips the first sheet
        if (grp.toLocaleUpperCase() == "MAP") {
            continue;
        }
        rows = data[grp];

        for (let i = dataStartRow; i < rows.length; i++) {

            let index = rows[i]['A'];
            let cls = rows[i]['B'];
            let student = rows[i]['C'];
            let stream = rows[i]['D'];

            if (student && student.length > 0) {
                if (sbbClassListData[student] === undefined) {
                    sbbClassListData[student] = {
                        'groups': [],
                        'class': cls,
                        'index': index,
                        'stream': stream,
                    };
                }

                if (!sbbClassListData[student]['groups'].includes(grp)) {
                    sbbClassListData[student]['groups'].push(grp);
                }
            }
        }
    }

    console.log('SBB Class List:', sbbClassListData);
}

function processAdditionalData(arr, type) {
    let rows;
    let dateRow = 1;
    let dataStartRow = 1;
    let data = [];
    let dataKeys = {};
    let count = 0;
    let cur;
    let tempStr;
    let name = "";
    let className = "";
    let outName = "";

    dataKeys["name"] = { key: "name", col: "B" };
    dataKeys["data"] = { key: "data", col: "D" };
    dataKeys["className"] = { key: "className", col: "C" };

    rows = arr;

    for (let i = dataStartRow; i < rows.length; i++) {
        data[count] = {};
        cur = data[count];

        for (let v in dataKeys) {
            cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
            if (cur[dataKeys[v].key] === undefined) {
                cur[dataKeys[v].key] = "";
            }
        }
        count++;
    }

    for (let v in data) {
        name = data[v]["name"];
        className = data[v]["className"].replace(" ", "");
        outName = className + DELIMITER + name;
        if (studentData[outName] === undefined) {
            studentData[outName] = {};
        }
        studentData[outName][type] = data[v]["data"];
    }

    // console.log(data, studentData);
}

function processNext() {
    curIndex++;
    if (curIndex < wbs.length) {
        processData();
    } else {
        processSubmitted();
        generateRawOutput();
    }
}

function processClassList(arr, wb) {
    let rows;
    let dateRow = 1;
    let dataStartRow = 1;
    let data = [];
    let dataKeys = {};
    let count = 0;
    let cur;
    let tempStr;
    let name = "";
    let className = "";
    let outName = "";

    dataKeys["name"] = { key: "name", col: "B" };
    dataKeys["className"] = { key: "className", col: "C" };
    dataKeys["gender"] = { key: "gender", col: "D" };

    rows = arr;

    for (let i = dataStartRow; i < rows.length; i++) {
        data[count] = {};
        cur = data[count];
        for (let v in dataKeys) {
            cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
            if (cur[dataKeys[v].key] === undefined) {
                cur[dataKeys[v].key] = "";
            }
        }
        count++;
    }

    // console.log('data', data);
    // console.log('cur', cur);

    for (let v in data) {
        name = data[v]["name"];
        className = data[v]["className"].replace(" ", "");
        outName = className + DELIMITER + name;
        classListData[outName] = {
            studentName: name,
            className: className,
            id: outName,
            gender: data[v]["gender"],
        };
    }

    console.log('classListData', classListData);
}

/**
 * Process Survey Responses Excel File
 * @param {arr} arr 
 * @param {arr} wb 
 */
function processClassData(arr, wb) {

    let rows;
    let sheets = Object.keys(arr);
    let dataStartRow = 1;
    let data = [];
    let dataKeys = {};
    let count = 0;
    let cur;
    let tempStr;
    let tempMap;
    // let tempClass;
    let friendName;

    dataKeys["email"] = { key: "email", col: "B" };
    dataKeys["name"] = { key: "name", col: "C" };
    dataKeys["friend1"] = { key: "friend1", col: "G" };
    dataKeys["friend2"] = { key: "friend2", col: "H" };
    dataKeys["friend3"] = { key: "friend3", col: "I" };
    dataKeys["friend1score"] = { key: "friend1score", col: "J" };
    dataKeys["friend2score"] = { key: "friend2score", col: "K" };
    dataKeys["friend3score"] = { key: "friend3score", col: "L" };

    for (let s of sheets) {
        rows = arr[s];
        for (let i = dataStartRow; i < rows.length; i++) {

            let email = rows[i]['B'];
            let username = rows[i]['C'];
            let fullname = usernameToName[username];

            let cls = rows[i]['F'].replace(' ', '');
            let friend1Data = rows[i]['G'];
            let friend2Data = rows[i]['H'];
            let friend3Data = rows[i]['I'];

            let friend1 = '';
            let friend2 = '';
            let friend3 = '';

            if (friend1Data && friend1Data.length > 0) {
                let friend1Arr = friend1Data.split(':');
                let friend1Name = friend1Arr[1];
                friend1 = friend1Arr[0].replace(' ', '') + ":" + usernameToName[friend1Name];
            }

            if (friend2Data && friend2Data.length > 0) {
                let friend2Arr = friend2Data.split(':');
                let friend2Name = friend2Arr[1];
                friend2 = friend2Arr[0].replace(' ', '') + ":" + usernameToName[friend2Name];
            }

            if (friend3Data && friend3Data.length > 0) {
                let friend3Arr = friend3Data.split(':');
                let friend3Name = friend3Arr[1];
                friend3 = friend3Arr[0].replace(' ', '') + ":" + usernameToName[friend3Name];
            }

            let friend1score = rows[i]['J'].length == 0 ? 0 : Number(rows[i]['J']);
            let friend2score = rows[i]['K'].length == 0 ? 0 : Number(rows[i]['K']);
            let friend3score = rows[i]['L'].length == 0 ? 0 : Number(rows[i]['L']);
            // console.log(username, fullname, friend1, friend2, friend3, friend1score, friend2score, friend3score);

            cur = {
                email: email,
                username: username,
                name: fullname,
                rawName: cls + ":" + fullname,
                friend1: friend1,
                friend2: friend2,
                friend3: friend3,
                friend1score: friend1score,
                friend2score: friend2score,
                friend3score: friend3score,
            };
            // console.log(cur);
            data.push(cur);

            // data[count] = {};
            // cur = data[count];
            // for (let v in dataKeys) {
            //     cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
            //     if (cur[dataKeys[v].key] === undefined) {
            //         cur[dataKeys[v].key] = "";
            //     }
            // }
            count++;
        }
    }

    console.log('data', data);

    let changeArr = ["name", "friend1", "friend2", "friend3"]; //, "friend1cohort", "friend2cohort", "friend3cohort"];
    let friendArr = ["friend1", "friend2", "friend3"];
    // let cohortArr = ["friend1cohort", "friend2cohort", "friend3cohort"];

    // For excel output of checked raw data
    for (let record in data) {

        cur = data[record]["name"];
        classOutputData[cur] = [];
        // cohortOutputData[cur] = [];
        tempMap = {};
        tempClass = parseStudentName(cur, 0);

        // Checks class list
        for (let c of friendArr) {
            friendName = data[record][c];
            if (friendName == cur || friendName.toLocaleUpperCase() == "NONE") {
                continue;
            }
            if (tempMap[friendName] !== undefined) {
                continue;
            }
            tempMap[friendName] = 1;

            classOutputData[cur].push(friendName);
        }

        // Checks cohort list, cannot be in the same class
        // tempMap = {};
        // for (let c of cohortArr) {
        //     friendName = data[record][c];
        //     if (friendName == record || friendName.toLocaleUpperCase() == "NONE") {
        //         continue;
        //     }
        //     tempStr = parseStudentName(friendName, 0);
        //     if (tempStr == tempClass) {
        //         // Same class, ignore
        //         continue;
        //     }
        //     if (tempMap[friendName] !== undefined) {
        //         continue;
        //     }

        //     tempMap[friendName] = 1;
        //     cohortOutputData[cur].push(friendName)
        // }

    }

    // get actual names
    for (let record in data) {
        submittedData[data[record]["name"]] = data[record];
        data[record]["rawName"] = data[record]["rawName"];
        for (let c of changeArr) {
            tempStr = parseStudentName(data[record][c]);
            if (tempStr !== undefined) {
                data[record][c + "RawName"] = data[record][c];
                data[record][c] = tempStr;
            }
        }
    }

    // Generate data analysis
    let output = [];
    let out2 = [];
    let trow = [];

    studentNodesToLinks = {};

    for (let record in data) {

        let response = data[record];
        
        if (!response.name) {
            console.log('Name not found:', response);
            continue;
        }

        if (response.name.length == 0 || ignoredStudents[response.name.toLocaleUpperCase()] !== undefined) {
            console.log('Name not found:', response);
            continue;
        }

        if (studentNodesToLinks[response["name"]] === undefined) {
            studentNodesToLinks[response["name"]] = {
                "in": {},
                "out": {},
                "rawName": response["rawName"],
            };
        } else {
            studentNodesToLinks[response["name"]]["out"] = {}; // prevent duplicates
        }

        trow = [];
        trow.push(response["name"]);

        for (let f of friendArr) {

            if (ignoredStudents[response[f].toLocaleUpperCase()] !== undefined || 
                response[f] == response["name"] ||
                response[f].length == 0) {
                continue;
            }

            trow.push(response[f]);
            // console.log(response, f);

            studentNodesToLinks[response["name"]]["out"][response[f]] = response[f + 'score'];

            if (studentNodesToLinks[response[f]] === undefined) {
                studentNodesToLinks[response[f]] = {
                    "in": {},
                    "out": {},
                    "rawName": response[f + "RawName"],
                };
            }

            // Set incoming edge for chosen person
            studentNodesToLinks[response[f]]["in"][response["name"]] = response[f + 'score'];
        }
        output.push(trow);
    }

    for (let student in studentNodesToLinks) {
        allStudentData[student] = studentNodesToLinks[student];
        if (sbbClassListData[student] !== undefined) {
            // Checks if student is from the correct class (in case there are students with the same name)
            // if (sbbClassListData[student]['class'] == studentNodesToLinks[student]['class']) {
            if (studentNodesToLinks[student]['groups'] === undefined) {
                studentNodesToLinks[student]['groups'] = sbbClassListData[student]['groups'];
            }
            // }
        }
    }

    console.log('studentNodesToLinks', studentNodesToLinks);

    excelToNodeDataMap[wb["customFileName"]] = studentNodesToLinks;

    updateGraphList();
}

function updateFileList() {
    let str = "";
    zipFile.forEach((relativePath, file) => {
        // console.log(file, relativePath);
        str += '<div class="zipFile" ' + 'data-fileKey="' + file + '">' + file.name + "</div>";
    });
    $("#imageFileLayer").html(str);
}

function updateGraphList() {
    let str = "";
    for (let fn in excelToNodeDataMap) {
        str += '<div class="graphFile " ' + 'data-fileKey="' + fn + '">' + fn + '</div>';
    }
    $("#graphListArea").html(str);
    $(".graphFile").click(showGraph);
}

function showGraph(e) {
    let targ = $(".graphFile");
    $(".graphFile").removeClass("graphFileSelected");
    resetButtons();
    targ.addClass("graphFileSelected");

    let fileName = targ.attr("data-fileKey");

    if (excelToNodeDataMap[fileName] !== undefined) {
        parseDataIntoGraph(fileName, excelToNodeDataMap[fileName]);
    }

    // Checks if both studentData and classOutputData has been loaded and is not empty
    if (Object.keys(studentData).length !== 0 && Object.keys(classOutputData).length !== 0) {

        let classData = {};
        let surveyRespondents = Object.keys(classOutputData);
        let absentStudents = []; // Students who did not take survey
        let uploadedClass = Object.keys(classOutputData)[0].substring(0, 3);

        // Filter students based on uploaded class data
        Object.keys(studentData).forEach(function (key) {
            if (key.substring(0, 3) == uploadedClass) {
                classData[key] = studentData[key];
            }
        });

        // Loop through each student in student data to see if student did the survey
        Object.keys(classData).forEach(function (key) {
            if (!surveyRespondents.includes(key)) {
                absentStudents.push(key);
            }
        });

        // Output absent students
        if (absentStudents.length > 0) {

            let str = '<p class="mb-2">The following students were absent from the SNA survey:</p>';
            str += '<ul>';
            for (let i = 0; i < absentStudents.length; i++) {
                str += '<li>' + absentStudents[i] + '</li>';
            }
            str += '</ul>';
            $('#absenceList').html(str);

        } else {

            let str = '<p class="mb-0">There are no absentees.</p>';
            $('#absenceList').html(str);

        }

    }

    let centralityScores = {};

    /* Normalised Closeness Centrality */
    // let ccn = curGraph.elements().closenessCentralityNormalized({
    // 	options: {
    // 		alpha: 0, directed: true,
    // 	}
    // });

    // curGraph.nodes().forEach(n => {
    // 	n.data({
    // 		ccn: ccn.closeness(n)
    // 	});
    // 	let node = n['_private']['data']['id'];
    // 	if (!node.includes("-parent")) {
    // 		centralityScores[node] = {}; // To be removed
    // 		centralityScores[node]['ccn'] = parseFloat(ccn.closeness(n).toFixed(3));
    // 	}
    // });

    // /* Normalised Degree Centrality */
    // let dcn = curGraph.elements().degreeCentralityNormalized({
    // 	options: {
    // 		alpha: 0,
    // 		directed: true,
    // 	}
    // });

    // let degreeCentralityNormalized = {};
    // curGraph.nodes().forEach(n => {
    // 	n.data({
    // 		dcn: dcn.degree(n)
    // 	});
    // 	let node = n['_private']['data']['id'];
    // 	if (!node.includes("-parent")) {
    // 		centralityScores[node]['dcn'] = parseFloat(dcn.degree(n).toFixed(3));
    // 	}
    // });

    /* Betweeness Centrality */
    if (curGraph && curGraph.elements().length > 0 && curGraph.nodes().lenght > 0) {
      let bc = curGraph.elements().betweennessCentrality({
        options: {
          directed: true,
        },
      });
      curGraph.nodes().forEach((n) => {
        n.data({
          bc: bc.betweenness(n),
        });
        let node = n["_private"]["data"]["id"];
        if (!node.includes("-parent")) {
          centralityScores[node] = {};
          centralityScores[node]["bc"] = parseFloat(
            bc.betweenness(n).toFixed(3)
          );
        }
      });

      /* Degree Centrality */
      curGraph.nodes().forEach((n) => {
        let node = n["_private"]["data"]["id"];
        if (!node.includes("-parent")) {
          centralityScores[node]["dc"] = curGraph.$().dc({ root: n }).degree;
        }
      });
      // console.log(centralityScores);

      // let str = "<thead>";
      // str += "<th>Student</th>";
      // str += "<th>Degree Centrality</th>";
      // str += "<th>Betweeness Centrality</th>";
      // // str += "<th>Degree Centrality (Normalised)</th>";
      // // str += "<th>Closeness Centrality</th>";
      // str += "</thead>";

      // str += "<tbody>";
      // for (var student in centralityScores) {
      // 	str += "<tr>";
      // 	str += "<td>" + student + "</td>";
      // 	str += "<td>" + centralityScores[student]['dc'] + "</td>";
      // 	str += "<td>" + centralityScores[student]['bc'] + "</td>";
      // 	// str += "<td>" + centralityScores[student]['dcn'] + "</td>";
      // 	// str += "<td>" + centralityScores[student]['ccn'] + "</td>";
      // 	str += "</tr>";
      // }
      // str += "</tbody>";
      // $('#table').html(str);
      // $('#table').DataTable();
      // $('#explanation').removeClass('fullDisabled');
    }

    if (Object.keys(centralityScores).length > 0) {
      // Convert object to array
      let centralityScoresArr = Object.keys(centralityScores).map(function (
        key
      ) {
        let obj = centralityScores[key];
        obj["student"] = key;
        return obj;
      });

      // Rank by Centrality Measures
      let rankedByDC = centralityScoresArr;
      let rankedByBC = centralityScoresArr;
      // let rankedByDCN = centralityScoresArr;
      // let rankedByCCN = centralityScoresArr;

      rankedByDC.sort((a, b) => Number(b.dc) - Number(a.dc));
      rankedByBC.sort((a, b) => Number(b.bc) - Number(a.bc));
      // rankedByDCN.sort((a, b) => Number(b.dcn) - Number(a.dcn));
      // rankedByCCN.sort((a, b) => Number(b.ccn) - Number(a.ccn));

      // Generate HTML Table
      let popularityTableOutput = generateTable(rankedByDC, "dc");
      $("#popularity-table").html(popularityTableOutput);

      let influenceTableOutput = generateTable(rankedByBC, "bc");
      $("#influence-table").html(influenceTableOutput);
    }

    if ($(".right-side-toggle").hasClass("d-none")) {
        $(".right-side-toggle").removeClass("d-none");
    }
    $(".right-side-toggle").popover('show');

}

/**
 * Generate Table HTML Output
 * @param {array}   arr
 * @param {string}  measure
 */
function generateTable(arr, measure) {
    let output = '';

    output += '<thead>';
    output += '<tr>';
    output += '<th class="text-center">Rank</th>';
    output += '<th>Student</th>';
    output += '<th class="text-center">Score</th>';
    output += '</tr>';
    output += '</thead>';

    output += '<tbody>';

    // Top 10 students
    for (let i = 0; i < 10; i++) {
        let index = i + 1;
        output += '<tr>';
        output += '<td class="text-center">' + index + '</td>';
        output += '<td>' + arr[i]['student'] + '</td>';
        output += '<td class="text-center">' + arr[i][measure].toFixed(1) + '</td>';
        output += '</tr>';
    }

    output += '</tbody>';

    return output;
}
