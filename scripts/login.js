
    const apiUrl = 'http://localhost:8080/api/auth';

    // Przełączanie zakładek
    document.getElementById('login-tab').addEventListener('click', function () {
    document.getElementById('login-tab').classList.add('active');
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    document.getElementById('register-form').classList.remove('active');
});

    document.getElementById('register-tab').addEventListener('click', function () {
    document.getElementById('register-tab').classList.add('active');
    document.getElementById('login-tab').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    document.getElementById('login-form').classList.remove('active');
});

    document.getElementById('show-register').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('register-tab').click();
});

    document.getElementById('show-login').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('login-tab').click();
});

    // Obsługa logowania
    document.querySelector('#login-form form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const login = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value.trim();

    const body = { login, password };

    try {
    const response = await fetch(`${apiUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Ważne dla ciasteczek
    body: JSON.stringify(body)
});

    const result = await response.text();

    if (response.ok) {
    // Zakładamy, że token JWT jest ustawiony w ciasteczku
    // Wysyłamy żądanie do backendu, aby pobrać dane użytkownika z tokenu
    const userResponse = await fetch('http://localhost:8080/api/auth/user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
});

    if (userResponse.ok) {
    const user = await userResponse.json();
    localStorage.setItem('currentUser', JSON.stringify({
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phone: user.phone
}));
    window.location.href = 'home.html';
} else {
    alert('Błąd pobierania danych użytkownika po zalogowaniu');
}
} else {
    alert(result || 'Niepoprawne dane logowania');
}
} catch (err) {
    console.error(err);
    alert('Błąd połączenia z serwerem podczas logowania');
}
});

    // Obsługa rejestracji
    document.querySelector('#register-form form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstname = document.getElementById('firstname').value;
    const lastname = document.getElementById('lastname').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
    alert("Hasła nie są takie same");
    return;
}

    const body = { firstname, lastname, phone, email, password };

    try {
    const response = await fetch(`${apiUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
});

    const text = await response.text();

    if (response.ok) {
    alert("Rejestracja zakończona sukcesem! Teraz możesz się zalogować.");
    document.getElementById('login-tab').click();
} else {
    alert(text || 'Błąd rejestracji');
}
} catch (err) {
    console.error(err);
    alert("Błąd połączenia z serwerem podczas rejestracji");
}
});
