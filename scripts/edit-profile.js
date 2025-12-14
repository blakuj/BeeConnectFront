
    const API_BASE = 'http://localhost:8080';

    async function loadUserProfile() {
    try {
    const response = await fetch(`${API_BASE}/api/auth/user`, {
    method: 'GET',
    credentials: 'include'
});

    if (response.ok) {
    const user = await response.json();

    document.getElementById('firstname').value = user.firstname || '';
    document.getElementById('lastname').value = user.lastname || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';

    const userName = document.querySelector('.user-name');
    if (userName) {
    userName.textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
}
} else if (response.status === 401) {
    alert('Sesja wygasła. Zaloguj się ponownie.');
    setTimeout(() => {
    window.location.href = 'login.html';
}, 2000);
}
} catch (error) {
    console.error('Błąd:', error);
}
}

    window.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
});

    document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('.sidebar-item').forEach(i => {
            i.classList.remove('active');
        });

        this.classList.add('active');

        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        if (this.querySelector('span').textContent === 'Dane osobowe') {
            document.getElementById('personal-data').classList.add('active');
        } else if (this.querySelector('span').textContent === 'Bezpieczeństwo') {
            document.getElementById('password-change').classList.add('active');
        } else if (this.querySelector('span').textContent === 'Zweryfikuj') {
            document.getElementById('verification').classList.add('active');
        }
    });
});

    document.getElementById('profile-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();

    const data = { phone, email };

    try {
    const response = await fetch(`${API_BASE}/api/person/updateProfile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
});

    if (response.ok) {
    let updatedUser = {};
    try {
    updatedUser = await response.json();
} catch {}

    alert('✅ Profil zaktualizowany pomyślnie!');

    if (updatedUser.phone) document.getElementById('phone').value = updatedUser.phone;
    if (updatedUser.email) document.getElementById('email').value = updatedUser.email;

    if (localStorage.getItem('currentUser')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (updatedUser.phone) currentUser.phone = updatedUser.phone;
    if (updatedUser.email) currentUser.email = updatedUser.email;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

} else {
    const errorText = await response.text();
    alert('❌ ' + (errorText || 'Nie udało się zaktualizować profilu.'));
}
} catch (error) {
    console.error('❌ Błąd połączenia:', error);
    alert('❌ Wystąpił błąd podczas łączenia z serwerem.');
}
});


    document.getElementById('password-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('current-password').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-new-password').value.trim();

    if (!oldPassword || !newPassword || !confirmPassword) {
    alert('Uzupełnij wszystkie pola!');
    return;
}

    if (newPassword !== confirmPassword) {
    alert('Hasła nie są identyczne!');
    return;
}

    const data = {
    oldPassword: oldPassword,
    newPassword: newPassword,
    confirmPassword: confirmPassword
};

    try {
    const response = await fetch(`${API_BASE}/api/person/changePassword`, {
    method: 'PUT',
    headers: {
    'Content-Type': 'application/json'
},
    credentials: 'include',
    body: JSON.stringify(data)
});

    if (response.ok) {
    alert('✅ Hasło zostało pomyślnie zmienione!');
    this.reset();
} else {
    const errorText = await response.text();
    alert('❌ ' + (errorText || 'Nie udało się zmienić hasła.'));
}
} catch (error) {
    console.error('❌ Błąd połączenia:', error);
    alert('❌ Wystąpił błąd podczas łączenia z serwerem.');
}
});


    document.getElementById('document-type').addEventListener('change', function() {
    const otherDocumentContainer = document.getElementById('other-document-container');
    if (this.value === 'other') {
    otherDocumentContainer.style.display = 'block';
    document.getElementById('other-document').setAttribute('required', '');
} else {
    otherDocumentContainer.style.display = 'none';
    document.getElementById('other-document').removeAttribute('required');
}
});

    document.getElementById('document-upload').addEventListener('change', function(e) {
    e.preventDefault();

    const fileInfo = document.getElementById('selected-file-info');
    if (this.files.length > 0) {
    const fileName = this.files[0].name;
    const fileSize = (this.files[0].size / 1024).toFixed(2);
    fileInfo.innerHTML = `<i class="fas fa-file"></i> ${fileName} (${fileSize} KB)`;
    fileInfo.style.display = 'block';
    document.querySelector('.file-upload-text').textContent = 'Zmień plik';
} else {
    fileInfo.style.display = 'none';
    document.querySelector('.file-upload-text').textContent = 'Wybierz plik';
}
});

    document.getElementById('verification-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!document.querySelector('input[name="terms"]').checked) {
    alert('Proszę zaakceptować warunki weryfikacji.');
    return;
}

    const verificationDTO = {
    beeGardenName: document.getElementById('apiary-name').value.trim(),
    countHives: parseInt(document.getElementById('apiary-size').value) || 0,
    yearsOfExperience: parseInt(document.getElementById('experience').value) || 0,
    adress: document.getElementById('apiary-address').value.trim(),
    honeyType: document.getElementById('honey-types').value.trim(),
    docType: document.getElementById('document-type').value
};

    if (!verificationDTO.beeGardenName || !verificationDTO.docType || verificationDTO.countHives <= 0) {
    alert('Wypełnij wymagane pola: Nazwa pasieki, Rodzaj dokumentu i Liczba uli.');
    return;
}

    const fileInput = document.getElementById('document-upload');
    if (!fileInput.files || fileInput.files.length === 0) {
    alert('Proszę wybrać plik do przesłania.');
    return;
}

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('verificationDTO', new Blob(
    [JSON.stringify(verificationDTO)],
{ type: 'application/json' }
    ));

    try {
    const response = await fetch(`${API_BASE}/api/verification/submit`, {
    method: 'POST',
    credentials: 'include',
    body: formData
});

    if (response.ok) {
    alert('✅ Wniosek o weryfikację został wysłany! Poinformujemy Cię o wyniku.');
    this.reset();
    document.getElementById('selected-file-info').textContent = '';
    document.querySelector('.file-upload-text').textContent = 'Wybierz plik';
} else {
    const errorText = await response.text();
    alert('❌ Wystąpił błąd: ' + (errorText || 'Nie udało się wysłać wniosku.'));
}
} catch (error) {
    console.error('Błąd połączenia:', error);
    alert('❌ Wystąpił błąd podczas łączenia z serwerem.');
}
});


