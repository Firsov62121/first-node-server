class Database {
	constructor() {
		this.client = require("./connect");
	}

	#myQuery(query, callback, reject) {
		this.client.query(query, (err, res) => {
				if (this.#errHandler(err, reject)) { return }
				callback(res);
			});
	}

	#errHandler(err, reject, query) {
		reject = reject === undefined ? console.log : reject;
		if(err) {
			reject(err);
			if(query !== undefined) {
				console.log(query);
			}
		}
		return Boolean(err);
	}

	timeToGood(time) {
		return new Date(time).toLocaleDateString('ru') + ' '
		 + new Date(time).toLocaleTimeString('ru').substring(0, 5)
	}

	selectAllFilms(callback, reject) {
		this.client.query("SELECT * FROM film ORDER BY id DESC", (err, res) => {
			if (this.#errHandler(err, reject)) { return }
			this.client.query("SELECT * FROM session1", (err, res2) => {
				if (this.#errHandler(err, reject)) { return }
				res2.rows.forEach(el => el.time = this.timeToGood(el.time));
				callback({films: res.rows, sessions: res2.rows, type: 'allFilms'});
			});
		});
	}

	selectAllHalls(callback, reject) {
		this.client.query("SELECT * FROM hall_config ORDER BY (hall_id, row_num);", (err, hall_config) => {
			if (this.#errHandler(err, reject)) { return }
			this.client.query("SELECT * FROM hall", (err, hall) => {
				if (this.#errHandler(err, reject)) { return }
				hall_config = hall_config.rows;
				const res2 = hall.rows.map(el => {return {id: el.id, hall: 
					hall_config.filter((val) => val.hall_id === el.id)
					.map((el) => el.num_of_columns)
					}}).reverse();
				callback({halls: res2, type: 'allHalls'});
			});
		});
	}

	addFilm(film, callback, reject) {
		this.#myQuery(`INSERT INTO film (name, score, description, img) 
		VALUES ('${film.name}', '${film.score}', '${film.description}',
		'${film.img}');`, callback, reject);
	}

	delFilm(id, callback, reject) {
		this.#myQuery(`DELETE FROM film WHERE film.id = ${id};`, 
			callback, reject);
	}

	addHall(hall, callback, reject) {
		if (hall.length === 0) { return }
		hall = hall.map((el) => Number(el));
		let query = `INSERT INTO hall (num_of_rows) VALUES (${hall.length});
		INSERT INTO hall_config (hall_id, row_num, num_of_columns) VALUES`;
		for (let i = 0; i < hall.length; ++i) {
			query += `\n((SELECT MAX(hall.id) FROM hall), ${i + 1}, 
				${hall[i]})${i + 1 === hall.length ? "" : ","}`;
		}
		this.#myQuery(query, callback, reject);
	}

	delHall(id, callback, reject) {
		this.#myQuery(`DELETE FROM hall WHERE hall.id = ${id};`, callback, reject);
	}

	addSession(session, callback, reject) {
		let query = `INSERT INTO session1 (film_id, hall_id, price, time) 
		VALUES (${session.id_film}, ${session.id_hall}, ${session.price},
			'${session.time}')`;
		this.#myQuery(query, callback, reject);
	}

	delSession(id, callback, reject) {
		this.#myQuery(`DELETE FROM session1 WHERE id = ${id}`, callback, reject);
	}

	selectSession(id, isAdmin, callback, reject) {
		const query1 = `SELECT * FROM film, session1 
		WHERE film.id = session1.film_id AND session1.id = ${id};`;
		const query2 = `SELECT * FROM places WHERE session_id = ${id}`;
		const query3 = `SELECT hall_config.* FROM hall_config, session1 
			WHERE session1.hall_id = hall_config.hall_id AND session1.id = 
			${id} ORDER BY (row_num)`;
		this.client.query(query1, (err, session) => {
			if (this.#errHandler(err, reject, query1)) { return }
			if (session.rows.length !== 1) {
				console.log(session);
				console.log(query1);
				return;
			}
			session.rows[0].id = id; //it was film_id, not session_id
			session.rows[0].time = this.timeToGood(session.rows[0].time);
			this.client.query(query2, (err, places) => {
				if (this.#errHandler(err, reject, query2)) { return }
				if(!isAdmin) {
					places.rows.forEach(el => el.user_token = undefined);
				}
				this.client.query(query3, (err, hall_config) => {
					if (this.#errHandler(err, reject, query3)) { return }
					hall_config = hall_config.rows.map(el => el.num_of_columns);
					const res = {session: session.rows[0], 
						places: places.rows, hall_config: 
						hall_config, type: 'Session'}
					callback(res);
				});
			});
		});
	}

	addPlace(data, callback, reject) {
		this.#myQuery( `INSERT INTO places (session_id, row_num, col_num, 
			user_token) VALUES (${data.sessionId}, ${data.rowNum}, 
			${data.colNum}, '${data.userToken}')`, callback, reject);
	}

	removePlace(data, isAdmin, callback, reject) {
		const query = isAdmin ? 
			`DELETE FROM places WHERE session_id = ${data.sessionId} AND
			row_num =  ${data.rowNum} AND col_num = ${data.colNum}` : 
			`DELETE FROM places WHERE session_id = ${data.sessionId} AND
			row_num =  ${data.rowNum} AND col_num = ${data.colNum}
			AND user_token = '${data.userToken}'`;
		this.#myQuery(query, callback, reject);
	}

	movePlace(data, callback, reject) {
		this.#myQuery(`UPDATE places SET row_num = ${data.rowNum}, 
			col_num = ${data.colNum} WHERE session_id = ${data.sessionId} 
			AND row_num =  ${data.oldRowNum} AND col_num = ${data.oldColNum}
			AND user_token = '${data.userToken}'`, callback, reject);
	}
}

const db = new Database();

module.exports = db;
