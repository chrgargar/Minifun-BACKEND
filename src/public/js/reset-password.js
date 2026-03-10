const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const error = urlParams.get('error');

if (token) {
    document.getElementById('tokenInput').value = token;
}

if (error) {
    const errorDiv = document.getElementById('errorDiv');
    errorDiv.textContent = decodeURIComponent(error);
    errorDiv.style.display = 'block';
}

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('resetForm').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const validationError = document.getElementById('validationError');

    validationError.style.display = 'none';

    if (password.length < 6) {
        e.preventDefault();
        validationError.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        validationError.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        e.preventDefault();
        validationError.textContent = 'Las contraseñas no coinciden.';
        validationError.style.display = 'block';
        return;
    }
});
