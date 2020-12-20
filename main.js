"use strict";

function getAuth(password) { return JSON.stringify({ action: "authenticate", protocol: 700, password: password }); }

let ws, main;
let host = "192.168.1.74";
let port = 20562;
let loggedin = false;
let library = [];
let currentPresentationId = -1;
let currentSlideIndex = -1;
let currentPresentation = null;

window.addEventListener("load", _ => {

	Swal.fire({
		title: 'Authentication',
		text: "Please provide the password for ProPresenter 7",
		input: 'password',
		inputAttributes: {
			autocapitalize: 'off',
			autocomplete: 'off',
			placeholder: "pizza"
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
				title: 'Wrong password!',
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
			default:
				console.warn("unhandled " + msg.action)
				break;
		}
	};
	ws.send('{"action":"libraryRequest"}');
	getCurrentPresentation();
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
			if (slide.slideText != "" && slide.slideText != " ")
				text += `<li>${slide.slideText.replace(/(\r\n|\n|\r)/gm, "<br />")}</li>`;
			if (counter++ == currentSlideIndex) {
				img.src = "data:image/png;base64," + slide.slideImage;
			}
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
		lib.innerHTML += `<li>${a}</li>`;
	});

}

function handlePresentationTriggerIndex(msg) {
	console.log(msg);
	if (msg.presentationPath != currentPresentationId) {
		getCurrentPresentation();
		currentPresentationId = msg.presentationPath;
	}
	currentSlideIndex = msg.slideIndex;
	updateCurrentSlide();
}

function getCurrentPresentation() {
	ws.send('{ "action":"presentationCurrent", "presentationSlideQuality": 50}');
}

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