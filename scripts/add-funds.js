
    const API_BASE = 'http://localhost:8080';


    function formatBalance(amount) {
    return (amount || 0).toFixed(2).replace('.', ',') + ' PLN';
}


    async function fetchBalance() {
    try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
    method: 'GET',
    headers: {
    'Content-Type': 'application/json'
},
    credentials: 'include'
});

    if (response.ok) {
    const user = await response.json();
    document.getElementById('balance-amount').textContent = formatBalance(user.balance);
} else if (response.status === 401) {
    alert('Sesja wygasła. Zaloguj się ponownie.');
    setTimeout(() => {
    window.location.href = 'login.html';
}, 2000);
} else {
    const errorText = await response.text();
    document.getElementById('error-message').textContent = errorText || 'Nie udało się pobrać salda.';
    document.getElementById('error-message').style.display = 'block';
}
} catch (error) {
    console.error('Błąd:', error);
    document.getElementById('error-message').textContent = 'Wystąpił błąd podczas łączenia z serwerem.';
    document.getElementById('error-message').style.display = 'block';
}
}


    async function addFunds(amount) {

    try {
    const response = await fetch(`${API_BASE}/api/person/addFunds`, {
    method: 'PUT',
    headers: {
    'Content-Type': 'application/json'
},
    credentials: 'include',
    body: JSON.stringify({ amount })
});

    if (response.ok) {
    document.getElementById('success-message').style.display = 'block';
    document.getElementById('error-message').style.display = 'none';
    fetchBalance();
    document.getElementById('topup-form').reset();
    document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
} else {
    const errorText = await response.text();
    document.getElementById('error-message').textContent = errorText || 'Nie udało się doładować konta.';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}
} catch (error) {
    console.error('Błąd:', error);
    document.getElementById('error-message').textContent = 'Wystąpił błąd podczas łączenia z serwerem.';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
}
}

    document.querySelectorAll('.amount-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.amount-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        document.getElementById('amount').value = option.getAttribute('data-amount');
    });
});

    document.getElementById('topup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = document.querySelector('.topup-btn');
    button.disabled = true;
    button.textContent = 'Ładowanie...';

    const amount = parseInt(document.getElementById('amount').value);
    const blikCode1 = document.getElementById('blik-code-1').value;
    const blikCode2 = document.getElementById('blik-code-2').value;

    // Walidacja kodu BLIK
    if (blikCode1.length !== 3 || blikCode2.length !== 3 || !/^\d+$/.test(blikCode1 + blikCode2)) {
    document.getElementById('error-message').textContent = 'Nieprawidłowy kod BLIK. Wprowadź 6 cyfr.';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
    button.disabled = false;
    button.textContent = 'Doładuj konto';
    return;
}

    if (amount < 10) {
    document.getElementById('error-message').textContent = 'Minimalna kwota doładowania to 10 PLN.';
    document.getElementById('error-message').style.display = 'block';
    document.getElementById('success-message').style.display = 'none';
    button.disabled = false;
    button.textContent = 'Doładuj konto';
    return;
}

    await addFunds(amount);
    button.disabled = false;
    button.textContent = 'Doładuj konto';
});

    window.addEventListener('DOMContentLoaded', fetchBalance);
