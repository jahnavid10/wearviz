// retrieve the subject:
document.getElementById("subjsel").value =
	window.location.search.substr(5) == ""
		? "0"
		: window.location.search.substr(5);
document.getElementById("vid").src =
	"s" + document.getElementById("subjsel").value + ".mp4";
document.getElementById("subjsel").oninput = function (e) {
	window.location.href =
		"index.html?sbj=" + document.getElementById("subjsel").value;
};

function loadScript(url, callback) {
	var head = document.head;
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	script.onreadystatechange = callback;
	script.onload = callback;
	head.appendChild(script);
}

var plotData = function () {
	var vid = document.getElementById("v0"),
		width = window.innerWidth;
	const data = [
		[...Array(raX.length).keys()],
		raX,
		raY,
		raZ,
		laX,
		laY,
		laZ,
		rlX,
		rlY,
		rlZ,
		llX,
		llY,
		llZ,
	];
	// wheel scroll zoom
	function wheelZoomPlugin(opts) {
		let factor = opts.factor || 0.95;
		return {
			hooks: {
				ready: (u) => {
					let rect = u.over.getBoundingClientRect();
					u.over.addEventListener(
						"wheel",
						(e) => {
							let oxRange = u.scales.x.max - u.scales.x.min;
							let nxRange = e.deltaY < 0 ? oxRange * factor : oxRange / factor;
							let nxMin =
								u.posToVal(u.cursor.left, "x") -
								(u.cursor.left / rect.width) * nxRange;
							if (nxMin < 0) nxMin = 0;
							let nxMax = nxMin + nxRange;
							if (nxMax > data[0].length) nxMax = data[0].length;
							u.batch(() => {
								u.setScale("x", { min: nxMin, max: nxMax });
							});
						},
						{ passive: true },
					);
				},
			},
		};
	}
	function bgAnns() {
		function drawBg(u) {
			let { top, height } = u.bbox;
			let { scale } = u.series[0];
			u.ctx.save();
			u.ctx.font = "14px Arial";
			u.ctx.textAlign = "center";
			for (var i = 0; i < pos.length - 1; i++) {
				if (lbl[i] != "null") {
					startPos = u.valToPos(pos[i], scale, true);
					width = u.valToPos(pos[i + 1], scale, true) - startPos;
					if (lbl[i].includes("stret")) u.ctx.fillStyle = "#F0FFE0";
					else if (lbl[i].includes("jogg")) u.ctx.fillStyle = "#FFFFE0";
					else if (lbl[i].includes("burp")) u.ctx.fillStyle = "#FFF0F0";
					else if (lbl[i].includes("lung")) u.ctx.fillStyle = "#FFF0FF";
					else u.ctx.fillStyle = "#F0F0FF";
					u.ctx.fillRect(startPos, top, width, height + 20); // left, width for each annotation
					u.ctx.fillStyle = "black";
					u.ctx.fillText(lbl[i], startPos + width / 2, 707); // annotation
				}
			}
			u.ctx.font = "24px Arial";
			u.ctx.textAlign = "left";
			u.ctx.fillText("right hand", 7, 24);
			u.ctx.fillText("left hand", 7, 200);
			u.ctx.fillText("right ankle", 7, 380);
			u.ctx.fillText("left ankle", 7, 560);
			u.ctx.restore();
		}
		return { hooks: { drawClear: drawBg } }; // TODO: drawClear is here correct, but when zooming/playing?, this chould be called
	}
	let opts = {
		id: "chart1",
		width: window.innerWidth - 9,
		height: 400,
		series: [
			{ fill: false, ticks: { show: false } },
			{ label: "rax", stroke: "red" },
			{ label: "ray", stroke: "green" },
			{ label: "raz", stroke: "blue" },
			{ label: "lax", stroke: "red" },
			{ label: "lay", stroke: "green" },
			{ label: "laz", stroke: "blue" },
			{ label: "rlx", stroke: "red" },
			{ label: "rly", stroke: "green" },
			{ label: "rlz", stroke: "blue" },
			{ label: "llx", stroke: "red" },
			{ label: "lly", stroke: "green" },
			{ label: "llz", stroke: "blue" },
		],
		cursor: {
			bind: {
				mousedown: (u, targ, handler) => {
					return (e) => {
						vid.currentTime = Math.floor(
							(vid.duration * u.cursor.idx) / data[0].length,
						);
						if (vid.paused) vid.play(); // start playing the video when clicked in the plot
					};
				},
			},
			y: false, // hide horizontal crosshair
		},
		plugins: [bgAnns(), wheelZoomPlugin({ factor: 0.95 })],
		axes: [{}, { scale: "readings", side: 1, grid: { show: true } }],
		scales: {
			auto: false,
			x: { time: false },
			y: { range: { max: 160, min: -200 } },
		},
		legend: { show: false },
	};
	let uplot = new uPlot(opts, data, document.body);
	// change cursor in uPlot when playing video:
	vid.ontimeupdate = function () {
		pos = Math.floor((vid.currentTime / vid.duration) * data[0].length); // this works
		uplot.setCursor({ left: uplot.valToPos(uplot.data[0][pos], "x") });
	};
	var grph = document.getElementById("chart1");
	grph.style.border = "solid";
	const bottom_hint = document.createElement("p");
	const txtnode = document.createTextNode(
		"Click on the plot to play, use the scroll wheel to zoom in or out.",
	);
	bottom_hint.appendChild(txtnode);
	document.body.appendChild(bottom_hint);
	cursor_override = document.getElementsByClassName("u-cursor-x");
	cursor_override[0].style = "border-right:3px solid #FF2D7D;";
};

loadScript("dta" + document.getElementById("subjsel").value + ".js", plotData);
