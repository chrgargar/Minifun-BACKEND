const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');

if (error) {
    document.getElementById('errorMessage').textContent = decodeURIComponent(error);
}

document.getElementById('year').textContent = new Date().getFullYear();
