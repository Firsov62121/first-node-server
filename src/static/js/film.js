import { mySend } from "./shareCode.js";

function previewFile() {
	var preview = document.querySelector("img");
	var file = document.querySelector("input[type=file]").files[0];
	var reader = new FileReader();
	reader.addEventListener('loadend', () => preview.src = reader.result);

	if (file) {
		reader.readAsDataURL(file);
	} else {
		preview.src = "";
	}
}

function getBase64(file, sendFunc) {
	if (!file) {
		sendFunc("");
		return;
	}
	var reader = new FileReader();
	reader.readAsDataURL(file);
	reader.addEventListener('load', () => sendFunc(reader.result));
	reader.addEventListener('error', () => console.log("Read file error!"));
}

function drawFilm(film, sessions) {
	const sessions2 = sessions.filter((el) => el.film_id === film.id);
	let res = `
	<div class="film-item ui message" id="#film-item-${film.id}">
		<div class="flex1">
			<div class="flex2">
				<h3>${film.name}</h3>
				<h3>${film.score}</h3>
				<p>${film.description}</p>
			</div>
			<div class="session-img">
				<img src="${film.img}" />
			</div>
		</div>
		<button class="del-btn ui tiny teal button width100"
			value="${film.id}">Удалить</button>
		<div>
			<input type="textarea" rows="1" id="film${film.id}-hall"
			style="width: 100%;" placeholder="Номер зала">
			<input type="textarea" rows="1" id="film${film.id}-time"
			style="width: 100%;" placeholder="Время">
			<input type="textarea" rows="1" id="film${film.id}-price"
			style="width: 100%;" placeholder="Цена билета">
			<button class="add-session-btn ui tiny teal button width100" 
				value="${film.id}">Добавить сеанс</button>
		</div>
		<div>
			<h3>Сеансы:</h3>`;
	for (const session of sessions2) {
		res += `
			<div class="width100">
				<h4>${session.time}</h4>
				<h4> ${session.price}₽</h4>
				<p>Зал №${session.hall_id}</p>
				<button class="del-session-btn ui tiny teal button width100" 
					value="${session.id}">Удалить сеанс</button>
			</div>`;
	}
	res += "</div></div>";
	return res;
}

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("file-img").addEventListener("change", () => {
		previewFile();
	});
	document.getElementById("new-film-form")
		.addEventListener("submit", (event) => {
			event.preventDefault();
			const file = document.querySelector("#file-img").files[0];
			getBase64(file, (base64str) => {
				const film = {
					name: document.getElementById("film-name").value,
					description: document.getElementById("film-desc").value,
					score: document.getElementById("film-score").value,
					img: base64str,
				};
				const tmp = { type: "addFilm", film: film };
				mySend(tmp, ws);
				//document.getElementById("new-film-form").reset();
			});
		});
	const films = document.getElementById("films");
	const ws = new WebSocket("ws://localhost:3000/film");
	ws.addEventListener("message", (event) => {
		const data = JSON.parse(event.data);
		if (data.type === "allFilms") {
			if (data.films.length === 0) {
				films.innerHTML = "Пока нет фильмов";
			} else {
				films.innerHTML = "";
				data.films.forEach((film) => 
					films.innerHTML += drawFilm(film, data.sessions));
				data.films.forEach((film) => {
					document.querySelector(`.del-btn[value="${film.id}"]`)
						.addEventListener("click", () => 
							mySend({ type: "delFilm", id: film.id }, ws));
					document.querySelector(`.add-session-btn[value="${film.id}"]`)
						.addEventListener("click", () => {
							const session = {};
							session.id_hall = Number(document.getElementById(`film${film.id}-hall`).value);
							session.id_film = film.id;
							session.time = document.getElementById(`film${film.id}-time`).value;
							session.price = Number(document.getElementById(`film${film.id}-price`).value);
							mySend({session: session, type: "addSession"}, ws)
						});
				});
				data.sessions.forEach(session => {
					document.querySelector(`.del-session-btn[value="${session.id}"]`)
						.addEventListener("click", () => 
							mySend({ type: "delSession", id: session.id }, ws));
				});
			}
		}
	});
});
