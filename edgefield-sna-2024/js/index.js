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
let curIndex = 0;

let dataWBS = [];
let dataIndex = 0;

let zipFile;

let ignoredStudents = {
	"NONE": true,
};

let studentData = {};

let excelToNodeDataMap = {};

let classListData = {};
let submittedData = {};

let classOutputData = {};
let cohortOutputData = {};

let curGraph;
let curFileName;
let curFileCount;

$(function() {
	
    initHTMLEvents();

	$("#downloadlinkClass").css({
		visibility: "hidden"
	});
	
    $("#downloadlinkCohort").css({
		visibility: "hidden"
	});

	$("#processBtn").click(function(e) {
		wbs.sort(function(a, b) {
			return a["customFileName"].localeCompare(b["customFileName"]);
		});
		console.log(wbs);
		processData();

		M.toast({html: "Student Responses Processed. Click Graph Control to generate the graph" });
	});

	$("#processDataBtn").click(function(e) {
		wbs.sort(function(a, b) {
			return a["customFileName"].localeCompare(b["customFileName"]);
		});
		console.log(wbs);
		processStudentData();

		M.toast({html: "Student Data Processed. Click Graph Control to generate the graph" });
	});

	$(".nameToggle").click(toggleNameData);
	$(".conductToggle").click(toggleConductData);
	$(".gradeToggle").click(toggleGradeData);
	$(".genderToggle").click(toggleGenderData);
	$(".streamToggle").click(toggleStreamData);

	$(".saveImage").click(saveImage);
	$(".downloadZip").click(saveZip);
	$(".automate").click(automateGeneration);
	$(".automateSingle").click(autoclickLayerPermutations);
	$(".resetNodes").click(function(e) {

	});

	zipFile = new JSZip();

	$(".tabs").tabs();
	$(".collapsible").collapsible();

});

function toggleButtonClass(btnClassName)
{
	$("." + btnClassName).toggleClass("toggleOff");
}

function resetButtons()
{
	$(".conductToggle").addClass("toggleOff");
	$(".gradeToggle").addClass("toggleOff");
	$(".genderToggle").addClass("toggleOff");
	$(".streamToggle").addClass("toggleOff");
}

function toggleLayeredData(nodeClasses, edgeClasses, state = undefined)
{
	for (let n of nodeClasses)
	{
		curGraph.$("node > $node").toggleClass(n, state);
	}
	for (let e of edgeClasses)
	{
		curGraph.$("edge").toggleClass(e, state);
	}
}

function toggleNameData()
{
	hideNames = hideNames ? false : true;
	toggleButtonClass("nameToggle");
	if (curFileName !== undefined && excelToNodeDataMap[curFileName] !== undefined)
	{
		parseDataIntoGraph(curFileName, excelToNodeDataMap[curFileName]);
	}
}

function toggleConductData()
{
	toggleButtonClass("conductToggle");
	$(".gradeToggle").addClass("toggleOff");
	toggleLayeredData(["showGradeNode"], ["showGradeEdge"], false);
	toggleLayeredData(["showConductNode"], ["showConductEdge"]);
	// curGraph.$("node > $node").toggleClass("showConductNode");
	// curGraph.$("edge").toggleClass("showConductEdge");
}

function toggleGradeData()
{
	toggleButtonClass("gradeToggle");
	$(".conductToggle").addClass("toggleOff");
	toggleLayeredData(["showConductNode"], ["showConductEdge"], false);
	toggleLayeredData(["showGradeNode"], ["showGradeEdge"]);
}

function toggleGenderData()
{
	toggleButtonClass("genderToggle");
	$(".streamToggle").addClass("toggleOff");
	toggleLayeredData(["showStreamNode"], [], false);
	toggleLayeredData(["showGenderNode"], []);
}

function toggleStreamData()
{
	toggleButtonClass("streamToggle");
	$(".genderToggle").addClass("toggleOff");
	toggleLayeredData(["showGenderNode"], [], false);
	toggleLayeredData(["showStreamNode"], []);
}

function automateGeneration()
{
	$(".graphFile").each(function(ind, ele) {
		$(this).trigger("click");
		console.log(this, ele);

		autoclickLayerPermutations();
	});
}

function autoclickLayerPermutations()
{
	$(".saveImage").trigger("click");

	$(".conductToggle").trigger("click");
	$(".saveImage").trigger("click");
	$(".gradeToggle").trigger("click");
	$(".saveImage").trigger("click");

	$(".genderToggle").trigger("click");
	$(".gradeToggle").trigger("click");
	$(".saveImage").trigger("click");

	$(".conductToggle").trigger("click");
	$(".saveImage").trigger("click");
	$(".gradeToggle").trigger("click");
	$(".saveImage").trigger("click");

	$(".streamToggle").trigger("click");
	$(".gradeToggle").trigger("click");
	$(".saveImage").trigger("click");

	$(".conductToggle").trigger("click");
	$(".saveImage").trigger("click");
	$(".gradeToggle").trigger("click");
	$(".saveImage").trigger("click");
}

function processData()
{
    console.log("FILES: ", wbs);
	//let wb = wbs[curIndex];

	for (let wb of wbs)
	{
		processExcel(processWB(wb), wb);
	}
	//parseDataIntoGraph("Cohort Data", allStudentData);
	console.log("Current: ", curIndex, wbs.length);
}

function processStudentData()
{
	console.log("Student FILES: ", dataWBS);
	//let wb = dataWBS[dataIndex];

	for (let wb of dataWBS)
	{
		processExcelStudentData(processWB(wb), wb);
	}

	console.log("Student Current: ", dataIndex, dataWBS.length);
}

// Events for elements initiated here
function initHTMLEvents()
{
	initSheetJSEvents();
}

function colourStudentNodesByLinks(sortedNodes, targetNodes)
{
	let secondPass = [];
	let assignedGroups = {};

	for (let i = 0; i < MAXGROUPS; i++)
	{
		if (Object.keys(targetNodes[sortedNodes[i]["name"]]["in"]).length >= MINLINKS)
		{
			mainStudents[sortedNodes[i]["name"]] = colourBases[i];
			targetNodes[sortedNodes[i]["name"]]["networkColour"] = colourBases[i];
			assignedGroups[sortedNodes[i]["name"]] = true;
		}
	}

	console.log(assignedGroups);

	// Colour student nodes
	// Colour nodes directly connected to main students first (who chose main student)
	for (let v in mainStudents)
	{
		for (let studentName in targetNodes["in"])
		{
			targetNodes[studentName]["networkColour"] = getColourFromLinks(targetNodes[studentName], targetNodes);
		}
	}

	// Add strength of relationship - ?
	for (let v in targetNodes)
	{
		targetNodes[v]["networkColour"] = getColourFromLinks(targetNodes[v], targetNodes);
		if (targetNodes[v]["networkColour"] === undefined)
		{
			secondPass.push(targetNodes[v]);
			/*
			// Ignore students with no out links
			if (Object.keys(targetNodes[v]["out"]).length > 0)
			{

			}
			else
			{
				targetNodes[v]["networkColour"] = defaultNodeColour;
			}*/
		}

		targetNodes[v]["INLINKS"] = Object.keys(targetNodes[v]["in"]).length;
	}

	console.log(secondPass);

	tmpArr = [];
	// Should never need so many passes
	for (let i = 0; i < 100; i++)
	{
		for (let v of secondPass)
		{
			v["networkColour"] = getColourFromLinks(v, targetNodes);
			if (v["networkColour"] === undefined)
			{
				tmpArr.push(v);
			}
		}

		if (tmpArr.length === 0)
		{
			break;
		}
		secondPass = tmpArr;
		tmpArr = [];
	}

	console.log(sortedNodes, mainStudents, targetNodes);

	return undefined;
}

function colourByConductGrades(targetNodes)
{
	let conductGradeList = {
		"POOR": 1,
		"FAIR": 2,
		"GOOD": 3,
		"VERY GOOD": 4,
		"EXCELLENT": 5,
	};

	let conductGradeToColour = {
		"POOR": "#ff8a65",
		"FAIR": "#ffcc80",
		"GOOD": "#ffee58",
		"VERY GOOD": "#9ccc65",
		"EXCELLENT": "#29b6f6",
	};

	let curColour;
	let conduct;
	let rawName;

	for (let v in targetNodes)
	{
		curColour = defaultNodeColour;
		conduct = "none";
		rawName = targetNodes[v]["rawName"];
		if (studentData[rawName] !== undefined)
		{
			if (studentData[rawName]["CONDUCT"] !== undefined)
			{
				conduct = studentData[rawName]["CONDUCT"].trim().toLocaleUpperCase();
			}
			if (conductGradeToColour[conduct] !== undefined)
			{
				curColour = conductGradeToColour[conduct];
			}
			else
			{
				console.log("Conduct colour not found ", v, rawName, conduct)
			}
		}
		else
		{
			console.log("No conduct data for ", v, rawName)
		}
		targetNodes[v]["conductColour"] = curColour;
	}

	return "CONDUCT";
}

function colourByOverallGrades(targetNodes)
{
	let overallGrade = 0;
	let curColour;
	let rawName;

	for (let v in targetNodes)
	{
		overallGrade = 0;
		curColour = "#000";
		rawName = targetNodes[v]["rawName"];
		if (studentData[rawName] !== undefined)
		{
			if (studentData[rawName]["OVERALL"] !== undefined)
			{
				overallGrade = studentData[rawName]["OVERALL"];
			}
			curColour = getColourFromGrade(Number(overallGrade));
		}
		else
		{
			//console.log("Student ", rawName, "not found");
		}

		targetNodes[v]["gradeColour"] = curColour;
	}

	return "OVERALL";
}

function colourByGender(targetNodes)
{
	let gender;
	let curColour;
	let rawName;

	for (let v in targetNodes)
	{
		gender = "";
		curColour = "#000";
		rawName = targetNodes[v]["rawName"];
		if (studentData[rawName] !== undefined)
		{
			if (studentData[rawName]["GENDER"] !== undefined)
			{
				gender = studentData[rawName]["GENDER"];
			}
			curColour = getColourFromGender(gender);
		}
		else
		{
			//console.log("Student ", rawName, "not found");
		}

		targetNodes[v]["genderColour"] = curColour;
	}

	return "GENDER";
}

function colourByStream(targetNodes)
{
	let stream;
	let curColour;
	let rawName;

	for (let v in targetNodes)
	{
		stream = "";
		curColour = "#000";
		rawName = targetNodes[v]["rawName"];
		if (studentData[rawName] !== undefined)
		{
			if (studentData[rawName]["STREAM"] !== undefined)
			{
				stream = studentData[rawName]["STREAM"];
			}
			curColour = getColourFromStream(stream);
		}
		else
		{
			console.log("Stream: Student ", rawName, "not found");
		}

		targetNodes[v]["streamColour"] = curColour;
	}

	return "STREAM";
}

function getColourFromStream(stream)
{
	if (stream === undefined)
	{
		return defaultNodeColour;
	}
	let check = stream.toLocaleUpperCase();
	switch (check)
	{
		case "EXPRESS":
			return "#3069FF"
			break;
		case "NORMAL(A)":
			return "#FF6C49"
			break;
		case "NORMAL(T)":
			return "#81CC12"
			break;
	}

	return defaultNodeColour;
}

function getColourFromGender(gender)
{
	if (gender === undefined)
	{
		gender = "";
	}
	if (gender.substr(0, 1).toLocaleUpperCase() == "M")
	{
		return "#066db1";
	}
	else if (gender.substr(0, 1).toLocaleUpperCase() == "F")
	{
		return "#e776a4";
	}

	return defaultNodeColour;
}

function getColourFromGrade(value)
{
    //value from 0 to 1
    /*var hue=((1-value)*180).toString(10);
	return ["hsl(",hue,",100%,50%)"].join("");*/

	if (value >= 75)
	{
		return "#8bc34a";
	}
	else if (value >= 70)
	{
		return "#cddc39";
	}
	else if (value >= 65)
	{
		return "#ffeb3b";
	}
	else if (value >= 60)
	{
		return "#ffc107";
	}
	else if (value >= 55)
	{
		return "#ff9800";
	}
	else if (value >= 50)
	{
		return "#ffab91";
	}
	else if (value >= 0)
	{
		return "#f4511e";
	}

	return defaultNodeColour;
}

function parseDataIntoGraph(fileName, targetNodes)
{
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
	let growEdge = 1;

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

	let studentNames = [];
	for (let i = 1; i < 100; i++)
	{
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

	for (let v in targetNodes)
	{
		targetNodes[v]["name"] = v;
		sortedNodes.push(targetNodes[v]);
	}

	sortedNodes.sort(function(a, b) {
		return Object.keys(b["in"]).length - Object.keys(a["in"]).length
	});

	if (sortedNodes.length === 0)
	{
		console.log("Warning:  No data for ", fileName);
		return;
	}

	dataElement = colourStudentNodesByLinks(sortedNodes, targetNodes);
	gradeData = colourByOverallGrades(targetNodes);
	conductData = colourByConductGrades(targetNodes);
	genderData = colourByGender(targetNodes);
	streamData = colourByStream(targetNodes);

	console.log(targetNodes);

	for (let v in targetNodes)
	{
		tmpColour = defaultNodeColour;
		conductColour = defaultNodeColour;
		labelTextColour = baselabelTextColour;
		nodeShape = baseNodeShape;

		cur = targetNodes[v]["in"];
		curSize = (baseWidth + (growStep * (Object.keys(cur).length)));
		if (curSize > maxWidth)
		{
			curSize = maxWidth;
		}
		borderWidth = 0;
		if (targetNodes[v]["networkColour"] !== undefined)
		{
			tmpColour = targetNodes[v]["networkColour"];
		}
		if (Object.keys(cur).length === 0)
		{
			borderWidth = 2;
			// Highlight isolated nodes
			labelTextColour = highlightlabelTextColour;
			nodeShape = isolatedNodeShape;
			curSize = baseWidth + (growStep * 3);
			tmpColour = "#000";
		}

		displayName = v;
		if (hideNames)
		{
			displayName = studentNames[studentCount];
		}
		if (displayName.length > 20)
		{
			displayName = displayName.substr(0, 18) + "...";
		}
		//sizeData = Object.keys(cur).length;
		//fontSize = "50px";
		sizeData = Object.keys(cur).length;
		fontSize = "50px";
		if (studentData[targetNodes[v]["rawName"]] !== undefined && dataElement !== undefined)
		{
			sizeData = studentData[targetNodes[v]["rawName"]][dataElement];
			fontSize = "30px";
		}

		conductLabel = "Not Found";
		if (studentData[targetNodes[v]["rawName"]] !== undefined && conductData !== undefined)
		{
			if (targetNodes[v]["conductColour"] !== undefined)
			{
				conductColour = targetNodes[v]["conductColour"];
			}
			conductLabel = studentData[targetNodes[v]["rawName"]][conductData];
		}

		gradeLabel = "Not Found";
		gradeColour = defaultNodeColour;
		if (studentData[targetNodes[v]["rawName"]] !== undefined && gradeData !== undefined)
		{
			if (targetNodes[v]["gradeColour"] !== undefined)
			{
				gradeColour = targetNodes[v]["gradeColour"];
			}
			gradeLabel = studentData[targetNodes[v]["rawName"]][gradeData];
		}

		genderColour = defaultNodeColour;
		if (studentData[targetNodes[v]["rawName"]] !== undefined && genderData !== undefined)
		{
			if (targetNodes[v]["genderColour"] !== undefined)
			{
				genderColour = targetNodes[v]["genderColour"];
			}
		}

		streamColour = defaultNodeColour;
		if (studentData[targetNodes[v]["rawName"]] !== undefined && streamData !== undefined)
		{
			if (targetNodes[v]["streamColour"] !== undefined)
			{
				streamColour = targetNodes[v]["streamColour"];
			}
		}

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
				nodeShape: nodeShape,
			},
		});

		cur = targetNodes[v]["out"];
		curOpac = 0.75;

		// Add edges for out
		for (let ed in cur)
		{
			// Check if double link has already been done
			if (doubleLinkMap[ed+v] !== undefined)
			{
				continue;
			}
			curSize = baseEdgeSize + (Number(cur[ed]) * growEdge);
			arrowScale = 2.5;
			//inWeight = 0;
			if (targetNodes[v]["in"][ed] !== undefined)
			{
				//inWeight = targetNodes[v]["in"][ed];
				// double linked
				arrowScale = 0;
				doubleLinkMap[v+ed] = true;

				edges.push({
					data : {
						id: v + "-e" + count,
						source: v,
						target: ed,
						widthData: curSize,
						opacData: curOpac,
						colourData: tmpColour,
						arrowScaleData: arrowScale,
					},
				});
			}
			else
			{
				edges.push({
					data : {
						id: v + "-e" + count,
						source: v,
						target: ed,
						widthData: curSize,
						opacData: curOpac,
						colourData: tmpColour,
					},
				});
			}

			//curOpac = ((baseEdgeOpac + (inWeight * growOpac)) / 100);
			count++;
		}

		studentCount++;
	}

	for (let v of nodes)
	{
		eles.push(v);
	}
	/*for (let i = 1; i < 4; i++)
	{
		eles.push({
			data: {
				id: "Isolated " + i,
				nameData: "Isolated " + i,
				width: baseWidth + "px",
				colourData: defaultNodeColour,
			},
		});
	}*/

	for (let v of edges)
	{
		eles.push(v);
	}

	console.log(nodes, edges);

	curGraph = showCytoscape(eles, outputImage, fileName);
	curFileName = fileName;
	curFileCount = 0;
}

function saveImage()
{
	if (zipFile !== undefined && curGraph !== undefined)
	{
		curFileCount++;
		console.log("Adding ", curFileName);
		let img = curGraph.png({
			bg: "#fff",
			full: "true",
			output: "base64",
		});

		let imgfileName = curFileName.replace(/.xlsx|.xls/, "");
		let saveFileName = imgfileName + " - " + curFileCount + ".png";

		zipFile.file(saveFileName, img, {
			base64: "true",
		});

		M.toast({html: "Added File: " + saveFileName});

		updateFileList();
	}
}

function saveZip()
{
	console.log("Generating zip", zipFile);
		zipFile.generateAsync({type:"blob"})
		.then(function (blob) {
			saveAs(blob, "networkdata.zip");
		});
}

function outputImage(cy, fileName)
{
    let img = cy.png({
		bg: "#fff",
		full: "true",
		output: "base64",
	});

	let imgfileName = fileName.replace(/.xlsx|.xls/, "");

	zipFile.file(imgfileName + ".png", img, {
		base64: "true",
	});

	console.log("Adding zip image", zipFile);

	/*curIndex++;
	if (curIndex < wbs.length)
	{
		processData();
	}
	else
	{
		zipFile.generateAsync({type:"blob"})
		.then(function (blob) {
			saveAs(blob, "networkdata.zip");
		});
	}*/
}

// Calculates colour based off out links
function getColourFromLinks(student, targetNodes)
{
	if (mainStudents[student["name"]])
	{
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
	for (let i = 0; i < 2; i++)
	{
		if (i === 1)
		{
			target = inLinks;
		}
		// If linked to a mainstudent take student colour
		for (let v in target)
		{
			// Main student colours take priority over other links
			if (mainStudents[v])
			{
				if (baseColour === undefined)
				{
					// No previous colour
					baseColour = mainStudents[v]
					oldWeight = 1;
					if (inLinks[v])
					{
						oldWeight += 5;
					}
				}
				else
				{
					newWeight = 1;
					if (inLinks[v])
					{
						newWeight += 5;
					}
					// Blend colours based on weights (more weight if link goes both ways)
					baseColour = blend_colors(baseColour, mainStudents[v], newWeight / (oldWeight + newWeight));
					oldWeight += newWeight;
				}
			}
		}

		if (baseColour === undefined)
		{
			// No main student links
			for (let v in target)
			{
				// Colour based off other student links
				if (targetNodes[v]["networkColour"])
				{
					if (baseColour === undefined)
					{
						// No previous colour
						baseColour = targetNodes[v]["networkColour"]
						oldWeight = 1;
						if (inLinks[v])
						{
							oldWeight += 1;
						}
					}
					else
					{
						newWeight = 1;
						if (inLinks[v])
						{
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
function parseStudentName(inName, ret = 1)
{
	if (inName === undefined)
	{
		return inName;
	}
	let split = inName.split(DELIMITER);

	if (split.length !== 2)
	{
		return undefined;
	}

	return split[ret];
}

function processSubmitted()
{
	let output = [];

	console.log(submittedData);

	// Output those who have yet to submit
	for (let s in classListData)
	{
		if (submittedData[s] === undefined)
		{
			output.push(s);
		}
	}

	console.log(output);
	let str = "";

	for (let v of output)
	{
		str += v + "<br>";
	}

	$("#tempOut").html(str);

	console.log(classOutputData, cohortOutputData);
}

function generateRawOutput()
{
	let output = {};
	let output2 = [];
	let output3 = {};
	let trow = [];

	let parsedName;
	let parsedClass;

	let data;
	let dataTypes = ["GENDER", "OVERALL", "CONDUCT"];
	let baseDataRow = [];

	//output.push(["Name", "Friend 1", "Friend 2", "Friend 3"]);
	baseDataRow = ["id", "label"];
	for (let v of dataTypes)
	{
		baseDataRow.push(v);
	}

	for (let v in classOutputData)
	{
		/*trow = [];
		trow.push(v);
		for (let c of classOutputData[v])
		{
			trow.push(c);
		}
		output.push(trow);*/
		parsedName = parseStudentName(v);
		parsedClass = parseStudentName(v, 0);

		if (output[parsedClass] === undefined)
		{
			output[parsedClass] = [];
			output[parsedClass].push(["Name", "Friend"]);

			output3[parsedClass] = [];
			output3[parsedClass].push(baseDataRow);
		}
		for (let c of classOutputData[v])
		{
			output[parsedClass].push([parsedName, parseStudentName(c)]);
		}

		trow = [parsedName, parsedName];

		for (let t of dataTypes)
		{
			data = "";
			if (studentData[v] !== undefined)
			{
				if (studentData[v][t] !== undefined)
				{
					data = studentData[v][t];
				}
			}

			trow.push(data);
		}

		output3[parsedClass].push(trow);
	}

	output2.push(["Name", "Cohort Friend"]);
	for (let v in cohortOutputData)
	{
		/*trow = [];
		trow.push(v);
		for (let c of cohortOutputData[v])
		{
			trow.push(c);
		}
		output2.push(trow);*/
		for (let c of cohortOutputData[v])
		{
			output2.push([v, c]);
		}
	}

	let sheetNames = [];
	let sheetsArr = {};
	let opts = {};
	let sname;

	for (let n in output)
	{
		sname = n;
		if (n.length > 10)
		{
			sname = n.substr(0, 10);
		}
		sheetsArr[sname] = XLSX.utils.aoa_to_sheet(output[n], opts);
		sheetNames.push(sname);
	}

	let workbook = { SheetNames: sheetNames, Sheets: sheetsArr}
	let outbin = XLSX.write(workbook, {bookType:'xlsx', bookSST:true, type: 'binary'});
	let link = saveAsFile(s2ab(outbin));

	$("#downloadlinkClass").attr("href", link);
	$("#downloadlinkClass").css({
        visibility: "visible"
	});

	let outxls = aoa_to_workbook(output2);
    outbin = XLSX.write(outxls, {bookType:'xlsx', bookSST:true, type: 'binary'});
	link = saveAsFile(s2ab(outbin));

	$("#downloadlinkCohort").attr("href", link);
	$("#downloadlinkCohort").css({
        visibility: "visible"
	});

	console.log(output3);

	sheetNames = [];
	sheetsArr = {};
	for (let n in output3)
	{
		sname = n;
		if (n.length > 15)
		{
			sname = n.substr(0, 15);
		}
		sheetsArr[sname] = XLSX.utils.aoa_to_sheet(output3[n], opts);
		sheetNames.push(sname);
	}

	workbook = { SheetNames: sheetNames, Sheets: sheetsArr}
	outbin = XLSX.write(workbook, {bookType:'xlsx', bookSST:true, type: 'binary'});
	link = saveAsFile(s2ab(outbin));

	$("#downloadlinkData").attr("href", link);
	$("#downloadlinkData").css({
        visibility: "visible"
	});

	/*
	let output = [];
	let orow = Object.keys(data[0]);
	let keys;

	output.push(orow);

	console.log(combi);

	console.log(classGroups);

	for (let v of data)
	{
		orow = [];
		keys = Object.keys(v);

		for (let k of keys)
		{
			if (k === "choices")
			{
				for (let i = 0; i < v[k].length; i++)
				{
					orow.push(v[k][i]);
				}
				continue;
			}
			orow.push(v[k]);
		}
		output.push(orow);
	}

	output.push([]);
	output.push([]);
	for (let v of studentChoice)
	{
		orow = [];
		keys = Object.keys(v);

		for (let k of keys)
		{
			if (k === "choices")
			{
				for (let i = 0; i < v[k].length; i++)
				{
					orow.push(v[k][i]);
				}
				continue;
			}
			orow.push(v[k]);
		}
		output.push(orow);
	}

	var outxls = aoa_to_workbook(output);
	output = [];
	for (let v in classGroups)
	{
		orow = [v, "Size: " + classGroups[v].cur, "Max Size: " + classGroups[v].max, "Average Score: " + classGroups[v].avg];
		output.push(orow);

		orow = [];
		for (let c in classGroups[v].combi)
		{
			orow.push(c + ": " + classGroups[v].combi[c]);
		}
		output.push(orow);

		orow = [];

		output.push([]);
	}

	output.push(["Combination Allocation Sizes"]);
	keys = Object.keys(codeCount);
	keys.sort();
	for (let v of keys)
	{
		output.push([v, codeCount[v]]);
	}

	var extraSheet = aoa_to_sheet(output);
	outxls.SheetNames.push("ExtraData");
	outxls.Sheets["ExtraData"] = extraSheet;

	var outbin = XLSX.write(outxls, {bookType:'xlsx', bookSST:true, type: 'binary'});
	var link = saveAsFile(s2ab(outbin));

	$("#downloadlink").attr("href", link);
	$("#downloadlink").css({
		visibility: "visible"
	});*/
}

function processExcel(arr, wb)
{
	arr = JSON.parse(arr);
	let rows;
	// Get sheet names
	let sheets = Object.keys(arr);

	if (sheets[0] == "Data - Classlist")
	{
		processClassList(arr, wb);

		processNext();
	}
	else
	{
		processClassData(arr, wb);

		processSubmitted();
	}
}

function processExcelStudentData(arr, wb)
{
	arr = JSON.parse(arr);
	let rows;
	// Get sheet names
	let sheets = Object.keys(arr);

	for (let n of sheets)
	{
		switch (n.toLocaleUpperCase().trim())
		{
			case "DATA - GENDER":
				processAdditionalData(arr[n], "GENDER");
				break;
			case "DATA - OVERALL":
				processAdditionalData(arr[n], "OVERALL");
				break;
			case "DATA - CONDUCT":
				processAdditionalData(arr[n], "CONDUCT");
				break;
			case "DATA - STREAM":
				processAdditionalData(arr[n], "STREAM");
				break;
			case "DATA - CLASSLIST":
				processClassList(arr[n], wb)
				break;
		}
	}

	console.log(studentData);
}

function processAdditionalData(arr, type)
{
	//arr = JSON.parse(arr);
	let rows;

	// Rows start from 0
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

	//console.log(s);
	rows = arr;

	for (let i = dataStartRow; i < rows.length; i++)
	{
		data[count] = {};
		cur = data[count];

		for (let v in dataKeys)
		{
			cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
			if (cur[dataKeys[v].key] === undefined)
			{
				cur[dataKeys[v].key] = "";
			}
		}
		count++;
	}

	for (let v in data)
	{
		name = data[v]["name"];
		className = data[v]["className"].replace(" ", "");
		outName = className + DELIMITER + name;

		if (studentData[outName] === undefined)
		{
			studentData[outName] = {};
		}
		studentData[outName][type] = data[v]["data"];
	}

	console.log(data, studentData);
}

function processNext()
{
	curIndex++;
	if (curIndex < wbs.length)
	{
		processData();
	}
	else
	{
		processSubmitted();
		generateRawOutput();
	}
}

function processClassList(arr, wb)
{
	//arr = JSON.parse(arr);
	let rows;
	// Get sheet names
	//let sheets = Object.keys(arr);

	// Rows start from 0
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
	dataKeys["gender"] = { key: "gender", col: "D" };
	dataKeys["className"] = { key: "className", col: "C" };

	//console.log(sheets);

	rows = arr;

	for (let i = dataStartRow; i < rows.length; i++)
	{
		data[count] = {};
		cur = data[count];

		for (let v in dataKeys)
		{
			cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
			if (cur[dataKeys[v].key] === undefined)
			{
				cur[dataKeys[v].key] = "";
			}
		}
		count++;
	}

	/*for (let s of sheets)
	{
		//console.log(s);

	}*/

	console.log(data);

	for (let v in data)
	{
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
}

function processClassData(arr, wb)
{
	//arr = JSON.parse(arr);
	let rows;
	// Get sheet names
	let sheets = Object.keys(arr);

	// Rows start from 0
	let dateRow = 1;

	let dataStartRow = 1;

	let data = [];
	let dataKeys = {};
	let choiceKeys = {};
	let count = 0;
	let tempCount = 0;
	let cur;
	let tempStr;
	let tempMap;
	let tempClass;
	let friendName;


	dataKeys["name"] = { key: "name", col: "C" };
	/*dataKeys["friend1"] = { key: "friend1", col: "G" };
	dataKeys["friend2"] = { key: "friend2", col: "H" };
	dataKeys["friend3"] = { key: "friend3", col: "I" };
	dataKeys["friend1cohort"] = { key: "friend1cohort", col: "J" };
	dataKeys["friend2cohort"] = { key: "friend2cohort", col: "K" };
	dataKeys["friend3cohort"] = { key: "friend3cohort", col: "L" };*/
	dataKeys["friend1"] = { key: "friend1", col: "G" };
	dataKeys["friend2"] = { key: "friend2", col: "H" };
	dataKeys["friend3"] = { key: "friend3", col: "I" };
	dataKeys["friend1cohort"] = { key: "friend1cohort", col: "J" };
	dataKeys["friend2cohort"] = { key: "friend2cohort", col: "K" };
	dataKeys["friend3cohort"] = { key: "friend3cohort", col: "L" };

	console.log(sheets);

	for (let s of sheets)
	{
		//console.log(s);
        rows = arr[s];

		for (let i = dataStartRow; i < rows.length; i++)
		{
			data[count] = {};
			cur = data[count];

			for (let v in dataKeys)
			{
				cur[dataKeys[v].key] = rows[i][dataKeys[v].col];
				if (cur[dataKeys[v].key] === undefined)
				{
					cur[dataKeys[v].key] = "";
                }
            }
			count++;
		}
	}

	console.log(data);

	let changeArr = ["name", "friend1", "friend2", "friend3"]; //, "friend1cohort", "friend2cohort", "friend3cohort"];
	let friendArr = ["friend1", "friend2", "friend3"];
	let cohortArr = ["friend1cohort", "friend2cohort", "friend3cohort"];

	// For excel output of checked raw data
	for (let v in data)
	{
		cur = data[v]["name"];
		classOutputData[cur] = [];
		cohortOutputData[cur] = [];
		tempMap = {};
		tempClass = parseStudentName(cur, 0);

		// Checks class list
		for (let c of friendArr)
		{
			friendName = data[v][c];
			if (friendName == cur || friendName.toLocaleUpperCase() == "NONE")
			{
				continue;
			}
			if (tempMap[friendName] !== undefined)
			{
				continue;
			}
			tempMap[friendName] = 1;

			classOutputData[cur].push(friendName);
		}

		// Checks cohort list, cannot be in the same class
		tempMap = {};
		for (let c of cohortArr)
		{
			friendName = data[v][c];
			if (friendName == v || friendName.toLocaleUpperCase() == "NONE")
			{
				continue;
			}
			tempStr = parseStudentName(friendName, 0);
			if (tempStr == tempClass)
			{
				// Same class, ignore
				continue;
			}
			if (tempMap[friendName] !== undefined)
			{
				continue;
			}

			tempMap[friendName] = 1;
			cohortOutputData[cur].push(friendName)
		}
	}

	// get actual names
	for (let v in data)
	{
		submittedData[data[v]["name"]] = data[v];
		data[v]["rawName"] = data[v]["name"];
		for (let c of changeArr)
		{
			tempStr = parseStudentName(data[v][c]);
			if (tempStr !== undefined)
			{
				data[v][c + "RawName"] = data[v][c];
				data[v][c] = tempStr;
			}
		}
	}

	console.log("changed", data);

    // Generate data analysis
    let output = [];
    let out2 = [];
	let trow = [];

	studentNodesToLinks = {};

	for (let v in data)
	{
		if (ignoredStudents[data[v]["name"].toLocaleUpperCase()] !== undefined)
		{
			continue;
		}
		if (studentNodesToLinks[data[v]["name"]] === undefined)
		{
			studentNodesToLinks[data[v]["name"]] = {
				"in" : {},
				"out" : {},
				"rawName": data[v]["rawName"],
			};
		}
		else
		{
			// prevent duplicates
			studentNodesToLinks[data[v]["name"]]["out"] = {};
		}

		trow = [];
		trow.push(data[v]["name"]);

		for (let f of friendArr)
		{
			if (ignoredStudents[data[v][f].toLocaleUpperCase()] !== undefined || data[v][f] == data[v]["name"])
			{
				continue;
			}
			trow.push(data[v][f]);
			studentNodesToLinks[data[v]["name"]]["out"][data[v][f]] = 5;
			if (studentNodesToLinks[data[v][f]] === undefined)
			{
				studentNodesToLinks[data[v][f]] = {
					"in" : {},
					"out" : {},
					"rawName": data[v][f + "RawName"],
				};
			}

			// Set incoming edge for chosen person
			studentNodesToLinks[data[v][f]]["in"][data[v]["name"]] = 5;
		}
		output.push(trow);
	}

	console.log(studentNodesToLinks);

	for (let v in studentNodesToLinks)
	{
		allStudentData[v] = studentNodesToLinks[v];
	}



	//parseDataIntoGraph(wb["customFileName"], studentNodesToLinks);
	excelToNodeDataMap[wb["customFileName"]] = studentNodesToLinks;

	updateGraphList();

	console.log(output);
}

function updateFileList()
{
	let str = "";
	zipFile.forEach((relativePath, file) => {
		console.log(file, relativePath);
		str += "<div class=\"zipFile\"" + "data-fileKey=\"" + file + "\">" + file.name + "</div>";
	});

	$("#imageFileLayer").html(str);
}

function updateGraphList()
{
	let str = "";
	for (let fn in excelToNodeDataMap)
	{
		str += "<div class=\"graphFile\"" + "data-fileKey=\"" + fn + "\">" + fn + "</div>";
	}

	$("#graphListArea").html(str);

	$(".graphFile").click(showGraph);
}

function showGraph(e)
{
	let targ = $(e.target);

	$(".graphFile").removeClass("graphFileSelected");
	resetButtons();
	targ.addClass("graphFileSelected");

	let fn = targ.attr("data-fileKey");

	if (excelToNodeDataMap[fn] !== undefined)
	{
		parseDataIntoGraph(fn, excelToNodeDataMap[fn]);
	}
}

/**
 * Converts from dddd dd. mmmm YYYY
 * (eg. Tuesday 10. January 2017)
 * @param {string} str
 */
function convertToDate(str)
{
	let split = str.split(" ");
	if (split.length < 4)
	{
		console.log("Error: Invalid Length, should be 4 after split: ", str);
		return undefined;
	}
	let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	for (let k in months)
	{
		months[k] = months[k].toLocaleUpperCase();
	}

	let date = split[1].replace(".", "");
	let mon = 0;
	split[2] = split[2].toLocaleUpperCase();
	let found = false;
	for (let v of months)
	{
		if (v.indexOf(split[2]) !== -1)
		{
			found = true;
			break;
		}
		mon++;
	}

	if (!found)
	{
		console.log("Error: Unrecognised Month in date: ", str, split[2]);
		return undefined;
	}

	return new Date(Date.UTC(Number(split[3]), mon, Number(date)));
}

/**
 * Just ZZ max for now. Columns start at 1 = A
*/
function numberToColumnName(num)
{
	let ret = "";
	if (num > 26)
	{
		ret = String.fromCharCode(64 + Math.floor(Number(num / 26)));
		num = num % 26;
	}

	ret += String.fromCharCode(64 + Number(num));

	return ret;
}

/**
 * Converts column names to number for array use. A = 0 because of use in array
 * @param col Starts from A = 0
 */
function columnNameToNumber(col)
{
	let sp = col.toLocaleUpperCase().split("");
	let ret = 0;
	let max = sp.length;

	// Ignore last letter
	for (let i = 0; i < max - 1; i++)
	{
		ret += Math.pow(26, max - i - 1);
	}

	ret += Number(sp[max - 1].charCodeAt(0)) - 65;

	//console.log("COLNAME: ", sp, "NUM: ", ret);

	return ret;
}

function s2ab(s)
{
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);
	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	return buf;
}

function sheet_to_workbook(sheet/*:Worksheet*/, opts)/*:Workbook*/
{
	var n = opts && opts.sheet ? opts.sheet : "Sheet1";
	var sheets = {}; sheets[n] = sheet;
	return { SheetNames: [n], Sheets: sheets };
}

function aoa_to_workbook(data/*:Array<Array<any> >*/, opts)/*:Workbook*/
{
	return sheet_to_workbook(XLSX.utils.aoa_to_sheet(data, opts), opts);
}

function aoa_to_sheet(data/*:Array<Array<any> >*/, opts)/*:Workbook*/
{
	return XLSX.utils.aoa_to_sheet(data, opts);
}

function saveAsFile(inFile)
{
	var textFile = null,
	makeTextFile = function (text) {
		var data = new Blob([text], {type: 'application/octet-stream'});

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

/*
 *
 * 	SheetJS Handling Area
 *
 */
var X = XLSX;
var rABS = typeof FileReader !== "undefined" && typeof FileReader.prototype !== "undefined" && typeof FileReader.prototype.readAsBinaryString !== "undefined";
var global_wb;

function initSheetJSEvents()
{
	$("#upExcel").on("change", handleExcelFile);
	var drop = document.getElementById("dropAreaDrop");

	// JQuery doesn't handle datatransfer
	drop.addEventListener('dragenter', handleExcelDropDragover, false);
	drop.addEventListener('dragover', handleExcelDropDragover, false);
	drop.addEventListener('dragleave', handleExcelDropDragleave, false);
	drop.addEventListener('drop', handleExcelFile, false);

	$("#upExcelData").on("change", handleExcelDataFile);
}

function handleExcelDropDragover(e)
{
	e.stopPropagation();
	e.preventDefault();
	if (!e.dataTransfer)
	{
		e.dataTransfer = e.originalEvent.dataTransfer;
	}
	e.dataTransfer.dropEffect = 'copy';
}
function handleExcelDropDragleave(e)
{
	e.stopPropagation();
	e.preventDefault();
}

function handleExcelDataFile(e)
{
	e.stopPropagation();
	e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
	let rkeys = {};

	if (files)
	{
		console.log(files);
        keys = Object.keys(files);
        for (let k of keys)
        {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

		console.log(keys);

		for (let k of keys)
		{
            console.log("Key: ", k);
            let f = files[rkeys[k]];
			let reader = new FileReader();
			let name = f.name;
			reader.onload = function(e) {
				try {
					let data = e.target.result;
					wb = X.read(data, {type: 'binary'});
					//processExcel(processWB(wb), wb);
					wb["customFileName"] = k;
					dataWBS.push(wb);

					updateProcessDataBtn();
				}
				catch (e) {
					console.log(e);
				}
				//console.log(processWB(wb));
			};
			if(rABS)
			{
				reader.readAsBinaryString(f);
			}
		}
	}
}

function handleExcelFile(e)
{
	wbs = [];
	wb = {};
	e.stopPropagation();
	e.preventDefault();
    let files = (e.dataTransfer) ? e.dataTransfer.files : e.target.files;
    let keys;
	let rkeys = {};

	if (files)
	{
		console.log(files);
        keys = Object.keys(files);
        for (let k of keys)
        {
            rkeys[files[k].name] = k;
        }
        keys = Object.keys(rkeys);
        keys.sort();

		console.log(keys);

		for (let k of keys)
		{
            console.log("Key: ", k);
            let f = files[rkeys[k]];
			let reader = new FileReader();
			let name = f.name;
			reader.onload = function(e) {
				try {
					let data = e.target.result;
					wb = X.read(data, {type: 'binary'});
					//processExcel(processWB(wb), wb);
					wb["customFileName"] = k;
					wbs.push(wb);

					updateProcessBtn();
				}
				catch (e) {
					console.log(e);
				}
				//console.log(processWB(wb));
			};
			if(rABS)
			{
				reader.readAsBinaryString(f);
			}
		}
	}
}

function updateProcessDataBtn()
{
	$("#processDataBtn").text("Process Student Data (" + dataWBS.length + " Files Loaded)");
}

function updateProcessBtn()
{
	$("#processBtn").text("Process (" + wbs.length + " Files Loaded)");
}

function processWB(wb)
{
	global_wb = wb;
	var output = "";
	output = JSON.stringify(wbToJSON(wb), 2, 2);

	return output;
}
/*
function wbToJSON(workbook)
{
	var result = {};
	workbook.SheetNames.forEach(function(sheetName)	{
		var roa = X.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		if(roa.length > 0)
		{
			result[sheetName] = roa;
		}
	});
	return result;
}*/
function wbToJSON(workbook)
{
	let result = {};
	let name;
	let heads = [];
	let maxCols = 30;

	for (let i = 1; i < maxCols; i++)
	{
		heads.push(numberToColumnName(i));
	}

	// console.log(heads, workbook);
	for (let v of workbook.Workbook.Sheets) // Ignore hidden sheets
	{
		if (v.Hidden == 0)
		{
			result[v.name] = X.utils.sheet_to_json(workbook.Sheets[v.name], {header: heads});
		}
	}
	/*workbook.SheetNames.forEach(function(sheetName)	{
		console.log(workbook.Sheets[sheetName].hidden);

		//let roa = X.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		let roa = X.utils.sheet_to_json(workbook.Sheets[sheetName], {header:["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]});
		//let roa = X.utils.sheet_to_json(workbook.Sheets[sheetName]);

		if(roa.length > 0)
		{
			result[sheetName] = roa;
		}
	});*/
	return result;
}
