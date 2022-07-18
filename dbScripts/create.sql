-- Database: cinema


CREATE DATABASE cinema
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Russian_Russia.1251'
    LC_CTYPE = 'Russian_Russia.1251'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
	

CREATE TABLE film (
    id        	SERIAL PRIMARY KEY,
    name       	varchar(100) NOT NULL,
    score       varchar(4) NOT NULL,
    description varchar(1000) NOT NULL,
    img  text NOT NULL
);


CREATE TABLE hall (
	id SERIAL PRIMARY KEY,
	num_of_rows integer NOT NULL CHECK(num_of_rows > 0)
);

CREATE TABLE hall_config (
	hall_id integer NOT NULL,
	row_num integer NOT NULL,
	num_of_columns integer NOT NULL CHECK(num_of_columns > 0),
	CONSTRAINT fk_hall_config FOREIGN KEY(hall_id) 
		REFERENCES hall(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE session1 (
	id SERIAL PRIMARY KEY,
	film_id integer NOT NULL,
	hall_id integer NOT NULL,
	time timestamp NOT NULL,
	price real NOT NULL CHECK(price > 0),
	CONSTRAINT fk_session_film_id FOREIGN KEY(film_id)
		REFERENCES film(id) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT fk_session_hall_id FOREIGN KEY(hall_id)
		REFERENCES hall(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE places (
	session_id integer NOT NULL,
	row_num integer NOT NULL CHECK(row_num > 0),
	col_num integer NOT NULL CHECK(col_num > 0),
	user_token varchar(100) NOT NULL,
	CONSTRAINT fk_prices FOREIGN KEY(session_id)
		REFERENCES session1(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE places
ADD CONSTRAINT uq_places UNIQUE(session_id, row_num, col_num);

-- DROP TABLE places;
-- DROP TABLE session1;
-- DROP TABLE hall_config;
-- DROP TABLE hall;
-- DROP TABLE film;


