export function setCookie(name, value, days) {
	var expires = "";
	if (days) {
		var date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
document.getElementById("add-key-btn").addEventListener("click", (event) => {
	setCookie("admin-secret-key", document.getElementById("admin-sk").value, 1);
});

export function mySend(obj, ws) {
	if (ws.readyState === 1) {
		ws.send(JSON.stringify(obj));
	}
}
