import { mySend } from "./shareCode.js";

function drawSession(session, hall_config) {
	let res = `
	<div class="film-item ui message" id="#film-item-${session.film_id}">
		<div class="flex1">
			<div class="flex2">
				<h3>${session.name}</h3>
				<h3> ${session.score}</h3>
				<p>${session.description}</p>
			</div>
			<div class="session-img">
				<img src="${session.img}" />
			</div>
		</div>
		<div>
		<h3>Сеанс:</h3>
		<div class="width100">
		  <h4>${session.time}</h4>
		  <h4> ${session.price}₽</h4>
		  <p>Зал №${session.hall_id}</p></div><div class="hall">
		`;
	for (let i = 0; i < hall_config.length; ++i) {
		res += `<div class="row" id="row${i + 1}">`
		for(let j = 0; j < hall_config[i]; ++j) {
			res += `<button class="place" id="row${i + 1}col${j + 1}"></button>`;
		}
		res += "</div>";
	}
	res += `</div>
	</div></div>`;
	return res;
}

document.addEventListener("DOMContentLoaded", () => {
	const sessionId = new URL(window.location.href).searchParams.get("session-id");
	const ws = new WebSocket(`ws://localhost:3000/session?session-id=${sessionId}`);
	const film = document.getElementById("film");
	ws.addEventListener('message', (event) => {
		const data = JSON.parse(event.data);
		if (data.type === "Session") {
			let tokens = undefined;
			let curSelected = undefined; //to move place
			if(data.places.length !== 0 && data.places[0].user_token) {
				tokens = data.places.map(el => el.user_token);
			}
			data.places = data.places.map((el) => [el.row_num, el.col_num]);
			film.innerHTML = drawSession(data.session, data.hall_config);
			for(let place of data.places) {
				document.getElementById(`row${place[0]}col${place[1]}`).classList.add('checked');
			}
			for(let i = 0; i < data.hall_config.length; ++i) {
				for(let j = 0; j < data.hall_config[i]; ++j) {
					const elem = document.getElementById(`row${i + 1}col${j + 1}`);
					elem.addEventListener('click', () => {
						if(!elem.classList.contains('checked')) {
							const userToken = document.getElementById('user-token').value + 
								`_r${i + 1}c${j + 1}`;
							const req = {type: "addPlace", data: {sessionId: Number(sessionId),
								rowNum: i + 1, colNum: j + 1, userToken: userToken}};
							if(curSelected + 1) { //Boolean(0) = false!!!
								req.type = "movePlace";
								req.data.oldRowNum = data.places[curSelected][0];
								req.data.oldColNum = data.places[curSelected][1];
								req.data.userToken = tokens[curSelected];
							}
							mySend(req, ws);
						}
					});
					elem.addEventListener('contextmenu', (event) => {
						event.preventDefault();
						const userToken = document.getElementById('user-token').value + 
								`_r${i + 1}c${j + 1}`;
						const req = {type: "removePlace", data: { sessionId: Number(sessionId),
							rowNum: i + 1, colNum: j + 1, userToken: userToken }};
						mySend(req, ws);
						curSelected = undefined;
					});
				}
			}
			if(tokens) {
				const adminDiv = document.createElement('div');
				adminDiv.style.minHeight = "1.5rem";
				let adminText = document.createTextNode('');
				adminDiv.appendChild(adminText);
				film.appendChild(adminDiv);
				for(let i = 0; i < tokens.length; ++i) {
					const elem = document.getElementById(
						`row${data.places[i][0]}col${data.places[i][1]}`);
					elem.addEventListener('mouseenter', () => {
						if(!(curSelected + 1)){
							adminText.nodeValue = tokens[i];
						}
					});
					elem.addEventListener('mouseleave', () => {
						if(!(curSelected + 1)){
							adminText.nodeValue = '';
						}
					});
					elem.addEventListener('dblclick', () => {
						curSelected = i;
						adminText.nodeValue = 'Выберите новое место.';
					})
				}	
			}
		}
	});
});
