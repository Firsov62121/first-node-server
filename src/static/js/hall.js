import { mySend } from "./shareCode.js";
const ws = new WebSocket("ws://localhost:3000/hall");

document.addEventListener("DOMContentLoaded", () => {
	document
		.getElementById("new-hall-form")
		.addEventListener("submit", (event) => {
			event.preventDefault();
			const hall = document
				.getElementById("hall-cols")
				.value.trim()
				.split(" ")
				.map((el) => Number(el));
			const tmp = { type: "addHall", hall: hall };
			mySend(tmp, ws);
			//document.getElementById("new-hall-form").reset();
		});
});

function drawHall(hall) {
	return `<div class="hall-item ui message" id="#hall-item-${hall.id}">
            <h4> Зал №${hall.id}</h4>
            <h5> Ряды: ${hall.hall.join(" ")}</h5>
            <button class="del-btn ui tiny teal button" value="${hall.id}">
			Удалить</button></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
	const halls = document.getElementById("halls");
	ws.addEventListener('message', (event) => {
		const data = JSON.parse(event.data);
		if (data.type === "allHalls") {
			if (data.halls.length === 0) {
				halls.innerHTML = "Пока нет залов";
			} else {
				halls.innerHTML = "";
				for (let hall of data.halls) {
					halls.innerHTML += drawHall(hall);
				}
				for (let hall of data.halls) {
					document
						.querySelector(`.del-btn[value="${hall.id}"]`)
						.addEventListener("click", (event) => {
							const req = {type: "delHall", id: hall.id,};
							mySend(req, ws);
						});
				}
			}
		}
	});
});
