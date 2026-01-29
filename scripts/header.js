document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('global-header');
    if (!headerContainer) return;

    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('currentUser'));
    } catch (e) {
        console.error("Błąd odczytu użytkownika", e);
    }

    const userName = user ? user.firstname : 'Gościu';
    const isLoggedIn = !!user;

    const path = window.location.pathname;
    const isHome = path.includes('home.html');
    const isMarket = path.includes('marketplace.html');
    const isChat = path.includes('chat.html');
    const isProfile = path.includes('profile.html');

    headerContainer.innerHTML = `
    <div class="header">
        <div class="logo-container">
            <div class="logo">
                <a href="home.html">
                    <img src="assets/BeeConnect.png" alt="BeeConnect Logo">
                </a>
            </div>
            <div class="welcome-message hidden-mobile">Witaj, ${userName}</div>
        </div>
        
        <div class="header-controls">
            <div class="nav-links">
                <a href="home.html" class="nav-btn ${isHome ? 'active' : ''}" title="Mapa Pasiek">
                    <i class="fas fa-map-marked-alt"></i> <span class="nav-label">Mapa</span>
                </a>
                <a href="marketplace.html" class="nav-btn ${isMarket ? 'active' : ''}" title="Marketplace">
                    <i class="fas fa-store"></i> <span class="nav-label">Marketplace</span>
                </a>
                <a href="chat.html" class="nav-btn ${isChat ? 'active' : ''}" title="Wiadomości">
                    <i class="fas fa-comments"></i> <span class="nav-label">Czat</span>
                </a>
            </div>

            <div class="notification-wrapper">
                <button class="notification-bell" id="notification-bell">
                    <i class="fas fa-bell"></i>
                    <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
                </button>
                <div class="notification-dropdown" id="notification-dropdown">
                    <div class="notification-header">
                        <h3>Powiadomienia</h3>
                        <button class="btn-text" id="mark-all-read" title="Oznacz wszystkie jako przeczytane">
                            <i class="fas fa-check-double"></i>
                        </button>
                    </div>
                    <div class="notification-list" id="notification-list">
                         <div style="padding: 20px; text-align: center; color: #999;">Ładowanie...</div>
                    </div>
                </div>
            </div>

            <div class="settings-dropdown">
                <button class="settings-btn ${isProfile ? 'active-profile' : ''}" id="profile-dropdown-btn">
                    <i class="fas fa-user-circle" style="font-size: 20px;"></i>
                </button>
                <div id="settingsDropdown" class="dropdown-content">
                    <div class="dropdown-user-info mobile-only">
                        <strong>${userName}</strong>
                    </div>
                    <a href="profile.html"><i class="fas fa-id-card"></i> Mój profil</a>
                    <a href="edit-profile.html"><i class="fas fa-user-edit"></i> Edytuj dane</a>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;">
                    <a href="addFunds.html"><i class="fas fa-wallet"></i> Portfel</a>
                    <a href="https://policja.pl/"><i class="fas fa-life-ring"></i> Pomoc</a>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 5px 0;">
                    ${isLoggedIn ? '<a href="#" id="header-logout-btn" class="text-danger"><i class="fas fa-sign-out-alt"></i> Wyloguj</a>' : '<a href="login.html"><i class="fas fa-sign-in-alt"></i> Zaloguj</a>'}
                </div>
            </div>
        </div>
    </div>
    
    <style>
        .header { position: relative; z-index: 9999 !important; }
        .dropdown-content { z-index: 10000 !important; }
        .notification-dropdown { z-index: 10000 !important; }
        
      
    </style>
    `;

    const profileBtn = document.getElementById('profile-dropdown-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById("settingsDropdown");
            dropdown.classList.toggle("show");

            const notifDropdown = document.getElementById("notification-dropdown");
            if (notifDropdown) notifDropdown.classList.remove("show");
        });
    }

    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }

    if (typeof window.initNotifications === 'function') {
        window.initNotifications();
    } else {
        window.addEventListener('load', () => {
            if (typeof window.initNotifications === 'function') {
                window.initNotifications();
            }
        });
    }

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.settings-btn') && !event.target.closest('.dropdown-content')) {
            const dropdown = document.getElementById("settingsDropdown");
            if (dropdown && dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        }
    });

    document.dispatchEvent(new Event('headerLoaded'));
});