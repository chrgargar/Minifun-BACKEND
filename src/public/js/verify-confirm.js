const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (token) {
    document.getElementById('tokenInput').value = token;
}

document.getElementById('year').textContent = new Date().getFullYear();
