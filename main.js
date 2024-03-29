"use strict";

import { Clock } from "./clocks/clock.js";
import { CountdownClock } from "./clocks/countdownClock.js";
import { getClock } from "./helpers.js";

function getAuth(password) { return JSON.stringify({ action: "authenticate", protocol: 750, password: password }); }

let ws, main;
let host = "192.168.2.130";
let port = 49404;
let loggedin = false;
let library = [];
let currentPresentationId = -1;
let currentSlideIndex = -1;
let currentPresentation = null;
let showOnlyFirstLine = true;

window.addEventListener("load", _ => {

	Swal.fire({
		title: 'Authentication',
		text: "Please provide the password for ProPresenter 7",
		input: 'password',
		inputValue: "pizza",
		inputAttributes: {
			autocapitalize: 'off',
			autocomplete: 'off',
			placeholder: "pizza",
		},
		showCancelButton: true,
		confirmButtonText: 'Sign in',
		showLoaderOnConfirm: true,
		preConfirm: (passwd) => {
			return new Promise((resolve, reject) => {

				ws = new WebSocket(`ws://${host}:${port}/remote`);

				ws.onerror = e => {
					console.log("event")
					reject(e);
				};
				ws.onopen = _ => {
					ws.send(getAuth(passwd));
				};
				ws.onmessage = event => {
					resolve(event.data);
				};
			}).catch(e => {
				console.error(e);
				Swal.fire({
					title: 'Couldn\'t connect!',
					html: `The url was ws://${host}:${port}<br><br>Is the IP/port correct?<br>If it is, chech that PP7 is running. Otherwise, change the configuration, and retry.`,
					icon: 'error',
					showConfirmButton: true,
					confirmButtonText: "Retry",
				}).then(_ => {
					location.reload();
				});
			});
		},
		allowOutsideClick: () => !Swal.isLoading()
	}).then((data) => {
		let msg = JSON.parse(data.value);
		if (msg.authenticated) {
			Swal.fire({
				title: 'Logged in!',
				icon: 'success',
				showConfirmButton: false,
				timer: 1500
			});
			loggedin = true;

			loadInfo();
		} else {
			Swal.fire({
				title: 'Unkown exception!',
				text: msg.error,
				icon: 'error',
				showConfirmButton: true,
				confirmButtonText: "Retry",
			}).then(_ => {
				location.reload();
			});
		}
	})

});


function loadInfo() {
	ws.onmessage = event => {
		let msg = JSON.parse(event.data);
		switch (msg.action) {
			case 'presentationCurrent':
				handlePresentationCurrent(msg);
				break;
			case 'libraryRequest':
				handleLibrary(msg);
				break;
			case 'clearText':
				break;
			case 'presentationTriggerIndex':
				handlePresentationTriggerIndex(msg);
				break;
			case 'clockRequest':
				handleClockInfo(msg);
				break;
			default:
				console.warn("unhandled " + msg.action)
				console.log(msg)
				break;
		}
	};
	ws.send('{"action":"clockRequest"}');
	ws.send('{"action":"libraryRequest"}');
	setTimeout(_ => {
		getCurrentPresentation();
	}, 1000)
}

function handlePresentationCurrent(msg) {
	currentPresentation = msg.presentation;

	updateCurrentSlide();
}


function updateCurrentSlide() {
	let img = document.getElementById("slide");
	let slidesUL = document.getElementById("currentSlides");
	let text = "";
	let counter = 0;
	currentPresentation.presentationSlideGroups.forEach(group => {
		text += `<li style="background-color: ${doRGBA(group.groupColor)};">${group.groupName}`;

		console.log(group)
		text += `<ul>`;
		group.groupSlides.forEach(slide => {
			if (slide.slideText != "" && slide.slideText != " ") {
				if (counter == currentSlideIndex) {
					text += `<li class="active"> ${doText(slide.slideText)}</li>`;
				} else {

					text += `<li>${doText(slide.slideText)}</li>`;
				}
			}
			if (counter == currentSlideIndex) {
				img.src = "data:image/png;base64," + slide.slideImage;
			}
			counter++;
		});
		text += `</ul>`;
		text += `</li>`;

	});
	slidesUL.innerHTML = text;
}

function handleLibrary(msg) {
	library = msg.library;
	let lib = document.getElementById("libraryList");
	library.forEach(e => {
		let a = e.split('/');
		a = a[a.length - 1];
		a = a.substr(0, a.length - 4);
		if (lib) lib.innerHTML += `<li>${a}</li>`;
	});

}

function handlePresentationTriggerIndex(msg) {
	if (msg.presentationPath != currentPresentationId) {
		getCurrentPresentation();
		currentPresentationId = msg.presentationPath;
	}
	currentSlideIndex = msg.slideIndex;
	updateCurrentSlide();
}

function handleClockInfo(msg) {
	msg.clockInfo.forEach(clock => {
		if (clock.clockName == "Pregação") {
			handleClockPregacao(clock)
		}
	});
	return
}

function handleClockPregacao(cl) {
	let clp = getClock(cl)
	console.log(clp)
	let cpNode = document.getElementById("clockPregacao");
	cpNode.getElementsByClassName("finishTime")[0].textContent = clp.clockEnd.toLocaleTimeString();
	setInterval(() => {
		cpNode.getElementsByClassName("remaningTime")[0].textContent = clp.getTimeRemaining();
	}, 9);
}

function getCurrentPresentation() {
	ws.send('{ "action":"presentationCurrent", "presentationSlideQuality": 100}');
}

/**
 * 
 * @param {string} colorString a proporesenter color string (e.g. 0.23 0.74 0.44 1)
 * @returns {string} a css rgba() string
 */
function doRGBA(colorString) {
	let colors = colorString.split(" ");
	let ret = "rgba(";
	let i = 0;
	colors.forEach(c => {
		c = c.replace(",", ".")
		c *= 100;
		if (i++ < 3)
			ret += c + "%, ";
		else
			ret += c
	});
	return ret + ")";
}

function doText(t) {
	t = t.replace(/(\r\n|\n|\r)/gm, "<br />");
	if (showOnlyFirstLine) {
		t = t.split("\r\n\r\n")[0];
	}
	return t;
}