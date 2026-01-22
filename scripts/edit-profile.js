// scripts/edit-profile.js

const API_BASE = 'http://localhost:8080';


function showError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.classList.add('input-error');


    let errorSpan = input.parentNode.querySelector('.error-message');
    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        input.parentNode.appendChild(errorSpan);
    }
    errorSpan.textContent = message;
}

function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    const inputs = form.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));

    const messages = form.querySelectorAll('.error-message');
    messages.forEach(msg => msg.remove());
}

function validateEmail(email) {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
}


async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/api/auth/user`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();

            if(document.getElementById('firstname')) document.getElementById('firstname').value = user.firstname || '';
            if(document.getElementById('lastname')) document.getElementById('lastname').value = user.lastname || '';
            if(document.getElementById('email')) document.getElementById('email').value = user.email || '';
            if(document.getElementById('phone')) document.getElementById('phone').value = user.phone || '';

            const userName = document.querySelector('.user-name');
            if (userName) {
                userName.textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Użytkownik';
            }

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

window.addEventListener('DOMContentLoaded', function() {

    loadUserProfile();

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const tabContents = document.querySelectorAll('.tab-content');

    sidebarItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;

            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                }
            });
        });
    });

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrors('profile-form');

            const phoneInput = document.getElementById('phone');
            const emailInput = document.getElementById('email');

            const phone = phoneInput.value.trim();
            const email = emailInput.value.trim();

            let isValid = true;

            if (!phone) {
                showError('phone', 'Telefon jest wymagany');
                isValid = false;
            } else if (!/^\d{9,11}$/.test(phone)) {
                showError('phone', 'Telefon musi składać się z 9 do 11 cyfr');
                isValid = false;
            }

            if (!email) {
                showError('email', 'Email jest wymagany');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError('email', 'Nieprawidłowy format adresu email');
                isValid = false;
            }

            if (!isValid) return;

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

    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrors('password-form');

            const oldPassword = document.getElementById('current-password').value.trim();
            const newPassword = document.getElementById('new-password').value.trim();
            const confirmPassword = document.getElementById('confirm-new-password').value.trim();

            let isValid = true;

            if (!oldPassword) {
                showError('current-password', 'Obecne hasło jest wymagane');
                isValid = false;
            }

            if (!newPassword) {
                showError('new-password', 'Nowe hasło jest wymagane');
                isValid = false;
            } else if (newPassword.length < 6) {
                showError('new-password', 'Hasło musi mieć co najmniej 6 znaków');
                isValid = false;
            }

            if (newPassword !== confirmPassword) {
                showError('confirm-new-password', 'Hasła nie są identyczne');
                isValid = false;
            }

            if (!isValid) return;

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

    const verificationForm = document.getElementById('verification-form');
    if (verificationForm) {
        verificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearErrors('verification-form');

            const apiaryName = document.getElementById('apiary-name').value.trim();
            const apiarySize = document.getElementById('apiary-size').value;
            const experience = document.getElementById('experience').value;
            const address = document.getElementById('apiary-address').value.trim();
            const honeyType = document.getElementById('honey-types').value.trim();
            const docType = document.getElementById('document-type').value;

            let isValid = true;

            // Walidacja pól
            if (!apiaryName) {
                showError('apiary-name', 'Nazwa pasieki jest wymagana');
                isValid = false;
            }

            if (!apiarySize || parseInt(apiarySize) <= 0) {
                showError('apiary-size', 'Liczba uli musi być większa od 0');
                isValid = false;
            }

            if (experience === '' || parseInt(experience) < 0) {
                showError('experience', 'Lata doświadczenia nie mogą być ujemne');
                isValid = false;
            }

            if (!docType) {
                showError('document-type', 'Wybierz rodzaj dokumentu');
                isValid = false;
            }

            if (!address) {
                showError('apiary-address', 'Adres pasieki jest wymagany');
                isValid = false;
            } else if (address.length > 255) {
                showError('apiary-address', 'Adres może mieć maksymalnie 255 znaków');
                isValid = false;
            }

            if (!honeyType) {
                showError('honey-types', 'Rodzaje produkowanego miodu są wymagane.');
                isValid = false;
            } else if (honeyType.length > 50) {
                showError('honey-types', 'Rodzaje miodu mogą mieć maksymalnie 50 znaków');
                isValid = false;
            }

            const fileInput = document.getElementById('document-upload');
            if (!fileInput.files || fileInput.files.length === 0) {
                const uploadContainer = document.querySelector('.file-upload-label');
                if (uploadContainer) {
                    let err = document.createElement('div');
                    err.className = 'error-message';
                    err.style.color = '#e74c3c';
                    err.style.marginTop = '5px';
                    err.textContent = 'Proszę wybrać plik do przesłania.';
                    // Dodaj tymczasowo
                    uploadContainer.parentNode.appendChild(err);
                    setTimeout(() => err.remove(), 3000);
                }
                isValid = false;
            }

            const termsCheckbox = document.querySelector('input[name="terms"]');
            if (termsCheckbox && !termsCheckbox.checked) {
                alert('Proszę zaakceptować warunki weryfikacji.');
                isValid = false;
            }

            if (!isValid) return;

            const verificationDTO = {
                beeGardenName: apiaryName,
                countHives: parseInt(apiarySize),
                yearsOfExperience: parseInt(experience) || 0,
                adress: address,
                honeyType: honeyType,
                docType: docType
            };

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