// scripts/edit-profile.js

const API_BASE = 'http://localhost:8080';

// Funkcja ładowania danych użytkownika
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();

            // Ustaw wartości w polach (readonly i edytowalnych)
            if(document.getElementById('firstname')) document.getElementById('firstname').value = user.firstname || '';
            if(document.getElementById('lastname')) document.getElementById('lastname').value = user.lastname || '';
            if(document.getElementById('email')) document.getElementById('email').value = user.email || '';
            if(document.getElementById('phone')) document.getElementById('phone').value = user.phone || '';

            // Aktualizacja sidebara
            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
            }

            // Aktualizacja roli w sidebarze (opcjonalnie)
            const userRole = document.querySelector('.user-role');
            if (userRole && user.role === 'BEEKEEPER') {
                userRole.textContent = 'Pszczelarz';
            } else if (userRole) {
                userRole.textContent = 'Użytkownik';
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

// Główna inicjalizacja po załadowaniu DOM
window.addEventListener('DOMContentLoaded', function() {

    // 1. Załaduj dane profilu
    loadUserProfile();

    // 2. Obsługa zakładek (Sidebar)
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const tabContents = document.querySelectorAll('.tab-content');

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            // Pobierz cel zakładki z atrybutu data-target
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;

            // Zaktualizuj klasy active w menu
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Zaktualizuj widoczność sekcji
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // 3. Obsługa formularza edycji profilu (Dane kontaktowe)
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
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
                    try { updatedUser = await response.json(); } catch {}

                    alert('✅ Profil zaktualizowany pomyślnie!');

                    // Aktualizacja localStorage jeśli istnieje
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
    }

    // 4. Obsługa zmiany hasła
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
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
                    headers: { 'Content-Type': 'application/json' },
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
    }

    // 5. Obsługa formularza weryfikacji (Dynamiczne pola)
    const docTypeSelect = document.getElementById('document-type');
    if (docTypeSelect) {
        docTypeSelect.addEventListener('change', function() {
            const otherDocumentContainer = document.getElementById('other-document-container');
            const otherDocInput = document.getElementById('other-document');

            if (this.value === 'other') {
                otherDocumentContainer.style.display = 'block';
                if(otherDocInput) otherDocInput.setAttribute('required', '');
            } else {
                otherDocumentContainer.style.display = 'none';
                if(otherDocInput) otherDocInput.removeAttribute('required');
            }
        });
    }

    // Obsługa input file (Upload pliku)
    const docUpload = document.getElementById('document-upload');
    if (docUpload) {
        docUpload.addEventListener('change', function(e) {
            const fileInfo = document.getElementById('selected-file-info');
            const uploadText = document.querySelector('.file-upload-text');

            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                const fileSize = (this.files[0].size / 1024).toFixed(2);
                if(fileInfo) {
                    fileInfo.innerHTML = `<i class="fas fa-file"></i> ${fileName} (${fileSize} KB)`;
                    fileInfo.style.display = 'block';
                }
                if(uploadText) uploadText.textContent = 'Zmień plik';
            } else {
                if(fileInfo) fileInfo.style.display = 'none';
                if(uploadText) uploadText.textContent = 'Wybierz plik';
            }
        });
    }

    // 6. Wysyłanie wniosku weryfikacyjnego
    const verificationForm = document.getElementById('verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const termsCheckbox = document.querySelector('input[name="terms"]');
            if (termsCheckbox && !termsCheckbox.checked) {
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
                    const fileInfo = document.getElementById('selected-file-info');
                    if(fileInfo) fileInfo.textContent = '';
                    const uploadText = document.querySelector('.file-upload-text');
                    if(uploadText) uploadText.textContent = 'Wybierz plik';
                } else {
                    const errorText = await response.text();
                    alert('❌ Wystąpił błąd: ' + (errorText || 'Nie udało się wysłać wniosku.'));
                }
            } catch (error) {
                console.error('Błąd połączenia:', error);
                alert('❌ Wystąpił błąd podczas łączenia z serwerem.');
            }
        });
    }
});