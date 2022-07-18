const ws = new WebSocket("ws://localhost:3000/film");

function drawFilms(film, sessions) {
	const sessions2 = sessions.filter((el) => el.film_id === film.id);
	let res = `
	<div class="film-item ui message" id="#film-item-${film.id}">
	<div class="flex1">
		<div class="flex2">
			<h3>${film.name}</h3>
			<h3> ${film.score}</h3>
			<p>${film.description}</p>
		</div>
		<div class="session-img">
			<img src="${film.img}" />
		</div>
	</div>
	  <div>
		<h3>Сеансы:</h3>`;
	  for(const session of sessions2) {
		res += `
		<div style="width: 100%">
		  <h4>${session.time}</h4>
		  <h4> ${session.price}₽</h4>
		  <p>Зал №${session.hall_id}</p>
		  <button class="watch-session-btn ui tiny teal button" 
		  style="width: 100%" value="${session.id}">Смотреть</button>
		</div>
		`
  
	  }
	  res += '</div></div>'
	  return res;
  
  }

document.addEventListener("DOMContentLoaded", () => {
	const films = document.getElementById("films");

	ws.addEventListener('message', (event) => {
		const data = JSON.parse(event.data);
		if (data.type === "allFilms") {
			if (data.films.length === 0) {
				films.innerHTML = "Пока нет фильмов";
			} else {
				films.innerHTML = "";
				for (let film of data.films) {
					films.innerHTML += drawFilms(film, data.sessions);
				}
				for(let session of data.sessions) {
					document
						.querySelector(`.watch-session-btn[value="${session.id}"]`)
						.addEventListener("click", (event) => {
							window.location.href=`/session?session-id=${session.id}`;});
				}
			}
		}
	});
});
