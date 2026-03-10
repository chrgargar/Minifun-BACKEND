const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

if (username) {
    document.getElementById('username').textContent = decodeURIComponent(username);
}

document.getElementById('year').textContent = new Date().getFullYear();
