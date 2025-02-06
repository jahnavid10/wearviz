// retrieve the subject:
d = document;
wl = window.location;
subj = d.getElementById("subjsel");
subj.value = wl.search.substr(5) == "" ? "0" : wl.search.substr(5);
subj.oninput = function (e) {
	wl.href = "index.html?sbj=" + subj.value;
};

function loadScript(url, callback) {
	var script = d.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	script.onreadystatechange = callback;
	script.onload = callback;
	d.head.appendChild(script);
}

var plotData = function () {
	///////////// add the info boxes at the top /////////////////////////////////
	var top = d.getElementById("toprow");
	const inb = d.createElement("div");
	inb.setAttribute("class", "topblk");
	inb.innerHTML = "Gender: " + inf[0] + "<br/>Hand: " + inf[1];
	inb.innerHTML += "<br/>Age: " + inf[2] + "<br/>Height: " + inf[3];
	inb.innerHTML += "<br/>Weight: " + inf[4];
	inb.innerHTML += "<hr/>Private Workouts:<br/>" + inf[5];
	inb.innerHTML += "<br/>Frequency: " + inf[6];
	inb.innerHTML += "<hr/>Known Activities: " + inf[7];
	inb.innerHTML += "<br/>Regular Activities: " + inf[8];
	top.appendChild(inb);
	for (s = 0; s < sess.length; s++) {
		const session = document.createElement("div");
		session.setAttribute("class", "topblk");
		session.innerHTML = "Session " + sess[s][0];
		session.innerHTML += "<hr/>Duration: " + sess[s][1];
		session.innerHTML += "<hr/>Activities: " + sess[s][2];
		session.innerHTML += "<hr/>Month: " + sess[s][3];
		session.innerHTML += "<br/>" + sess[s][4];
		session.innerHTML += "<hr/>" + sess[s][5];
		session.innerHTML += "<hr/>Location_ID: " + sess[s][6];
		top.appendChild(session);
	}
	const flb = d.createElement("div");
	flb.setAttribute("class", "topblk");
	const dlpath =
		"https://uni-siegen.sciebo.de/s/enHPo7HwP8RccAe/download?path=%2Fraw%2F";
	var fHTML = 'Data Files: <hr/><a href="' + dlpath + "camera&files=sbj_";
	fHTML += subj.value + '.mp4">Video [' + fls[0] + "GB]</a><br/>";
	fHTML += '<a href="' + dlpath + "inertial%2F50hz&files=sbj_" + subj.value;
	fHTML += '.csv">IMU sensors [' + fls[1] + "MB]</a><br/>";
	flb.innerHTML = fHTML;
	top.appendChild(flb);

	///////////// use uplot to plot all data ////////////////////////////////////
	var vid = d.getElementById("v0");
	const k = [...Array(raX.length).keys()]; // make incrmenting indices
	const data = [k, raX, raY, raZ, laX, laY, laZ, rlX, rlY, rlZ, llX, llY, llZ];
	const wheelZoomHk = [
		(u) => {
			let rect = u.over.getBoundingClientRect();
			u.over.addEventListener("wheel", (e) => {
				let oxRange = u.scales.x.max - u.scales.x.min;
				let nxRange = e.deltaY < 0 ? oxRange * 0.95 : oxRange / 0.95;
				let nxMin =
					u.posToVal(u.cursor.left, "x") -
					(u.cursor.left / rect.width) * nxRange;
				if (nxMin < 0) nxMin = 0;
				let nxMax = nxMin + nxRange;
				if (nxMax > u.data[0].length) nxMax = u.data[0].length;
				u.batch(() => {
					u.setScale("x", { min: nxMin, max: nxMax });
				});
			});
		},
	];
	const drawClearHk = [
		(u) => {
			for (var i = 0; i < pos.length - 1; i++) {
				if (lbl[i] != "null") {
					startPos = u.valToPos(pos[i], "x", true);
					width = u.valToPos(pos[i + 1], "x", true) - startPos;
					if (lbl[i].includes("stret")) u.ctx.fillStyle = "#F0FFE0";
					else if (lbl[i].includes("jogg")) u.ctx.fillStyle = "#FFFFE0";
					else if (lbl[i].includes("burp")) u.ctx.fillStyle = "#FFF0F0";
					else if (lbl[i].includes("lung")) u.ctx.fillStyle = "#FFF0FF";
					else u.ctx.fillStyle = "#F0F0FF";
					u.ctx.fillRect(startPos, u.bbox.top, width, u.bbox.height);
				}
			}
		},
	];
	const drawHk = [
		(u) => {
			u.ctx.textAlign = "center";
			for (var i = 0; i < lbl.length - 1; i++) {
				if (lbl[i] != "null") {
					startPos = u.valToPos(pos[i], "x", true);
					width = u.valToPos(pos[i + 1], "x", true) - startPos;
					u.ctx.fillStyle = "black";
					u.ctx.fillText(lbl[i], startPos + width / 2, u.bbox.height + 7); // annotation
				}
			}
			u.ctx.textAlign = "left";
			u.ctx.fillText("right hand", 7, u.valToPos(190, "y", true));
			u.ctx.fillText("left hand", 7, u.valToPos(70, "y", true));
			u.ctx.fillText("right ankle", 7, u.valToPos(-50, "y", true));
			u.ctx.fillText("left ankle", 7, u.valToPos(-170, "y", true));
		},
	];
	let sers = [{ fill: false, ticks: { show: false } }];
	for (i = 0; i < 12; i++) {
		c = i % 3 == 0 ? "red" : i % 3 == 1 ? "green" : "blue";
		l = i % 6 < 3 ? "r" : "l";
		l += i < 6 ? "a" : "l";
		l += i % 3 == 0 ? "x" : i % 3 == 1 ? "y" : "z";
		sers.push({ label: l, stroke: c });
	}
	let opts = {
		id: "chrt",
		width: window.innerWidth - 9,
		height: 400,
		series: sers,
		cursor: {
			bind: {
				mousedown: (u, targ, handler) => {
					return (e) => {
						vid.currentTime = Math.floor(
							(vid.duration * u.cursor.idx) / u.data[0].length,
						);
						if (vid.paused) vid.play(); // play video when plot is clicked
					};
				},
			},
			y: false, // hide horizontal crosshair
		},
		hooks: { draw: drawHk, drawClear: drawClearHk, ready: wheelZoomHk },
		axes: [{}, { scale: "readings", side: 1, grid: { show: true } }],
		scales: { auto: false, x: { time: false } },
		legend: { show: false },
	};
	let uplot = new uPlot(opts, data, document.body);
	vid.ontimeupdate = function () {
		p = Math.floor((vid.currentTime / vid.duration) * data[0].length);
		uplot.setCursor({ left: uplot.valToPos(data[0][p], "x") });
	};
	d.getElementById("chrt").style.border = "solid";
	d.body.appendChild(
		d
			.createElement("p")
			.appendChild(
				d.createTextNode("Click on plot to play, scroll wheel zooms"),
			),
	);
	cursorOverride = d.getElementsByClassName("u-cursor-x");
	cursorOverride[0].style = "border-right:3px solid #FF2D7D;";

	///////////// load video at last ///////////////////////////////////////////
	vid.src = "s" + subj.value + ".mp4";
	vid.load();
};

loadScript("dta" + subj.value + ".js", plotData);
