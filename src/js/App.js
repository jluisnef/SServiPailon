import { StorageManager } from './StorageManager.js';
import { TalentManager } from './TalentManager.js';
import { UIController } from './UIController.js';

export class App {
    constructor() {
        this.storage = new StorageManager();
        this.talentManager = new TalentManager(this.storage);
        this.ui = new UIController();
        this.isAdmin = false;

        this.init();
    }

    init() {
        if (this.storage.getAdminToken()) {
            this.isAdmin = true;
            const adminBtnText = document.getElementById('adminBtnText');
            if (adminBtnText) adminBtnText.textContent = 'Cerrar Admin';
            const openProModalBtn = document.getElementById('openProModalBtn');
            if (openProModalBtn) openProModalBtn.style.display = 'inline-flex';
            const dashboardStats = document.getElementById('dashboardStats');
            if (dashboardStats) dashboardStats.style.display = '';
        }

        this.renderAll();
        this.setupEventListeners();

        // Sincronizar en segundo plano con la base de datos Neon (en Netlify)
        this.storage.syncFromCloud(() => {
            this.talentManager.pros = this.storage.getProfessionals();
            this.talentManager.hirings = this.storage.getHirings();
            this.renderAll();
        });
    }

    renderAll() {
        const stats = this.talentManager.getStatistics();
        this.ui.updateDashboardStats(stats, this.talentManager.hirings.length);

        const filteredPros = this.talentManager.getFilteredProfessionals();
        this.ui.renderDirectory(filteredPros, this.talentManager.currentSearchQuery);

        this.ui.renderHirings(this.talentManager.hirings);
    }

    setupEventListeners() {
        // --- 1. NAVEGACIÓN ENTRE DIRECTORIO Y MIS CONTRATACIONES ---
        const navLinks = document.querySelectorAll('#mainNav .nav-link');
        navLinks.forEach(btn => {
            btn.addEventListener('click', (e) => {
                navLinks.forEach(b => b.parentElement.classList.remove('active'));
                btn.parentElement.classList.add('active');

                const targetView = btn.dataset.view || 'directory';
                this.ui.switchView(targetView);
            });
        });

        const logoHomeBtn = document.getElementById('logoHomeBtn');
        logoHomeBtn?.addEventListener('click', () => {
            navLinks.forEach(b => b.parentElement.classList.remove('active'));
            this.ui.switchView('directory');
        });

        // --- 2. FILTROS POR ÁREA DE TRABAJO ---
        const areaBtns = document.querySelectorAll('.filter-btn');
        areaBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetArea = btn.dataset.area || 'all';
                
                // Remover active de todos y poner solo a los que coincidan con el targetArea
                areaBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`.filter-btn[data-area="${targetArea}"]`).forEach(b => b.classList.add('active'));

                this.talentManager.currentAreaFilter = targetArea;
                this.renderAll();
            });
        });


        // --- 3. BUSCADOR EN TIEMPO REAL & PALABRAS CLAVE ---
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const quickKeywordsWrapper = document.getElementById('quickKeywordsWrapper');
        const keywordChips = document.querySelectorAll('.keyword-chip');
        const searchContainer = document.querySelector('.search-container');

        const showKeywords = () => {
            if (quickKeywordsWrapper) quickKeywordsWrapper.classList.add('visible');
        };

        const hideKeywords = () => {
            if (quickKeywordsWrapper) quickKeywordsWrapper.classList.remove('visible');
        };

        const syncChipsWithQuery = (query) => {
            const clean = (query || '').trim().toLowerCase();
            keywordChips.forEach(chip => {
                const chipKw = (chip.dataset.keyword || '').toLowerCase();
                if (clean && clean === chipKw) {
                    chip.classList.add('active');
                } else {
                    chip.classList.remove('active');
                }
            });
        };

        // Mostrar opciones rápidas cuando el usuario enfoca o hace clic en el buscador
        searchInput?.addEventListener('focus', () => {
            showKeywords();
        });

        searchInput?.addEventListener('click', () => {
            showKeywords();
        });

        searchInput?.addEventListener('input', (e) => {
            const val = e.target.value;
            this.talentManager.currentSearchQuery = val;
            showKeywords();
            syncChipsWithQuery(val);
            this.renderAll();
        });

        // Prevenir que hacer clic en los chips cause blur prematuro en el input
        quickKeywordsWrapper?.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        // Ocultar las sugerencias cuando el usuario hace clic fuera del buscador
        document.addEventListener('click', (e) => {
            if (searchContainer && !searchContainer.contains(e.target)) {
                hideKeywords();
            }
        });

        // Cerrar sugerencias con la tecla Escape
        searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideKeywords();
                searchInput.blur();
            }
        });

        clearSearchBtn?.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            this.talentManager.currentSearchQuery = '';
            keywordChips.forEach(c => c.classList.remove('active'));
            this.renderAll();
            searchInput?.focus();
            showKeywords();
        });

        // Clic en chips de palabras clave
        keywordChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const keyword = chip.dataset.keyword || '';
                if (chip.classList.contains('active')) {
                    // Desactivar chip si ya estaba activo
                    chip.classList.remove('active');
                    if (searchInput) searchInput.value = '';
                    this.talentManager.currentSearchQuery = '';
                } else {
                    // Activar chip
                    keywordChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (searchInput) searchInput.value = keyword;
                    this.talentManager.currentSearchQuery = keyword;
                }
                this.renderAll();
                searchInput?.focus();
            });
        });

        // Botón en el estado vacío "Ver todos los emprendimientos"
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'resetSearchFromEmptyBtn') {
                if (searchInput) searchInput.value = '';
                keywordChips.forEach(c => c.classList.remove('active'));
                this.talentManager.currentSearchQuery = '';
                this.renderAll();
                hideKeywords();
                searchInput?.focus();
            }
        });

        // --- 4. MODAL 1: REGISTRO / EDICIÓN DE PROFESIONALES ---
        const openProModalBtn = document.getElementById('openProModalBtn');
        const closeProModalBtn = document.getElementById('closeProModalBtn');
        const cancelProModalBtn = document.getElementById('cancelProModalBtn');

        // Lógica para subida de fotos (Compresión con Canvas)
        const proPhotoFile = document.getElementById('proPhotoFile');
        const proPhotoHidden = document.getElementById('proPhoto');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const photoPreviewContainer = document.getElementById('photoPreviewContainer');
        const photoPreview = document.getElementById('photoPreview');

        proPhotoFile?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                if (fileNameDisplay) fileNameDisplay.textContent = 'Sin seleccionar';
                return;
            }

            if (fileNameDisplay) fileNameDisplay.textContent = file.name;
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    if (proPhotoHidden) proPhotoHidden.value = compressedBase64;
                    if (photoPreview) photoPreview.src = compressedBase64;
                    if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        openProModalBtn?.addEventListener('click', () => this.ui.openProModal());
        closeProModalBtn?.addEventListener('click', () => this.ui.closeModal(this.ui.proModal));
        cancelProModalBtn?.addEventListener('click', () => this.ui.closeModal(this.ui.proModal));

        this.ui.proModal.addEventListener('click', (e) => {
            if (e.target === this.ui.proModal) this.ui.closeModal(this.ui.proModal);
        });

        this.ui.proForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const proId = document.getElementById('proId').value;
            const proData = {
                businessName: document.getElementById('proBusinessName').value,
                name: document.getElementById('proName').value,
                photo: document.getElementById('proPhoto').value,
                area: document.getElementById('proArea').value,
                title: document.getElementById('proTitle').value,
                phone: document.getElementById('proPhone').value,
                skills: document.getElementById('proSkills').value,
                experience: document.getElementById('proExperience').value,
                status: document.getElementById('proStatus').value
            };
            if (proId) {
                this.talentManager.updateProfessional(proId, proData);
                this.ui.showToast('Perfil del trabajador actualizado correctamente', 'info');
            } else {
                this.talentManager.createProfessional(proData);
                this.ui.showToast('¡Nuevo trabajador registrado y verificado con éxito!', 'success');
            }

            this.ui.closeModal(this.ui.proModal);
            this.renderAll();
        });

        // --- 5. EVENT DELEGATION EN DIRECTORIO ---
        this.ui.professionalsGrid.addEventListener('change', (e) => {
            if (e.target.classList.contains('admin-quick-status') && this.isAdmin) {
                const proId = e.target.dataset.id;
                const newStatus = e.target.value;
                this.talentManager.updateProfessional(proId, { status: newStatus });
                this.ui.showToast(newStatus === 'available' ? 'Marcado como Disponible' : 'Marcado como Ocupado', 'info');
                this.renderAll();
            }
        });

        this.ui.professionalsGrid.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-pro-btn');
            if (deleteBtn && this.isAdmin) {
                e.stopPropagation();
                const proId = deleteBtn.dataset.id;
                const pro = this.talentManager.getProfessionalById(proId);
                if (confirm(`¿Estás seguro de eliminar el registro de "${pro ? pro.name : ''}"?`)) {
                    this.talentManager.deleteProfessional(proId);
                    this.ui.showToast('Trabajador eliminado del directorio', 'error');
                    this.renderAll();
                }
                return;
            }

            const editBtn = e.target.closest('.edit-pro-btn');
            if (editBtn && this.isAdmin) {
                e.stopPropagation();
                const proId = editBtn.dataset.id;
                const pro = this.talentManager.getProfessionalById(proId);
                if (pro) this.ui.openProModal(pro);
                return;
            }

            // --- A. CLIC EN ESTRELLA DE VOTACIÓN (VOTAR / DESELECCIONAR) ---
            const starBtn = e.target.closest('.vote-star-btn');
            if (starBtn) {
                e.stopPropagation();
                const proId = starBtn.dataset.id;
                if (!proId) return;

                const isCurrentlyVoted = this.storage.hasVoted(proId);
                const countSpan = starBtn.querySelector('.vote-count');
                const cardCount = document.getElementById(`cardVotes-${proId}`);
                const currentCount = parseInt(countSpan ? countSpan.textContent : '0') || 0;

                if (isCurrentlyVoted) {
                    // DESELECCIONAR VOTO
                    starBtn.classList.remove('active', 'voted-now');
                    starBtn.title = 'Votar por este emprendimiento';
                    const newCount = Math.max(0, currentCount - 1);
                    if (countSpan) countSpan.textContent = newCount;
                    if (cardCount) cardCount.textContent = `⭐ ${newCount}`;

                    this.talentManager.toggleVoteForProfessional(proId).then(res => {
                        if (res && res.interacciones !== undefined) {
                            if (countSpan) countSpan.textContent = res.interacciones;
                            if (cardCount) cardCount.textContent = `⭐ ${res.interacciones}`;
                        }
                        this.ui.showToast('Voto retirado', 'info');
                    });
                } else {
                    // SELECCIONAR VOTO
                    starBtn.classList.add('active', 'voted-now');
                    starBtn.title = 'Ya votaste por este emprendimiento (clic para deseleccionar)';
                    const newCount = currentCount + 1;
                    if (countSpan) countSpan.textContent = newCount;
                    if (cardCount) cardCount.textContent = `⭐ ${newCount}`;

                    this.talentManager.toggleVoteForProfessional(proId).then(res => {
                        if (res && res.interacciones !== undefined) {
                            if (countSpan) countSpan.textContent = res.interacciones;
                            if (cardCount) cardCount.textContent = `⭐ ${res.interacciones}`;
                        }
                        if (res && res.success) {
                            this.ui.showToast('¡Gracias por tu voto y recomendación! ⭐', 'success');
                        }
                    });
                }
                return;
            }

            // --- B. CLIC EN BOTÓN DE WHATSAPP ---
            const waBtn = e.target.closest('.whatsapp-btn');
            if (waBtn) {
                e.preventDefault();
                const isAvailable = waBtn.dataset.available === 'true';
                if (!isAvailable) {
                    this.ui.showToast('El especialista se encuentra ocupado actualmente.', 'info');
                    return;
                }

                const proId = waBtn.dataset.id;
                const phone = (waBtn.dataset.phone || '').replace(/\D/g, '');
                const message = waBtn.dataset.message || 'Hola, me gustaría consultar sobre tus servicios.';

                // 1. Disparar el voto en segundo plano si no ha votado aún
                if (proId && !this.storage.hasVoted(proId)) {
                    const starBtnEl = document.querySelector(`.vote-star-btn[data-id="${proId}"]`);
                    if (starBtnEl) {
                        starBtnEl.classList.add('active', 'voted-now');
                        starBtnEl.title = 'Ya votaste por este emprendimiento';
                        const countSpan = starBtnEl.querySelector('.vote-count');
                        const cardCount = document.getElementById(`cardVotes-${proId}`);
                        const currentCount = parseInt(countSpan ? countSpan.textContent : '0') || 0;
                        if (countSpan) countSpan.textContent = currentCount + 1;
                        if (cardCount) cardCount.textContent = `⭐ ${currentCount + 1}`;
                    }
                    this.talentManager.voteForProfessional(proId);
                }

                // 2. Redirigir de inmediato a WhatsApp sin demoras en nueva pestaña
                const encodedMsg = encodeURIComponent(message);
                const waUrl = `https://wa.me/${phone}?text=${encodedMsg}`;
                window.open(waUrl, '_blank', 'noopener,noreferrer');
                return;
            }
        });

        // --- 5.5. LOGIN DE ADMINISTRADOR SEGURO ---
        const loginAdminBtn = document.getElementById('loginAdminBtn');
        const adminBtnText = document.getElementById('adminBtnText');
        loginAdminBtn?.addEventListener('click', async () => {
            if (this.isAdmin) {
                this.isAdmin = false;
                this.storage.clearAdminToken();
                adminBtnText.textContent = 'Acceso Admin';
                document.getElementById('openProModalBtn').style.display = 'none';
                document.getElementById('dashboardStats').style.display = 'none';
                this.ui.showToast('Sesión de administrador cerrada', 'info');
                this.renderAll();
            } else {
                const password = prompt('Ingrese la contraseña de Administrador:');
                if (password === null || password.trim() === '') return;

                const authResult = await this.storage.loginAdmin(password.trim());
                if (authResult.success) {
                    this.isAdmin = true;
                    adminBtnText.textContent = 'Cerrar Admin';
                    document.getElementById('openProModalBtn').style.display = 'inline-flex';
                    document.getElementById('dashboardStats').style.display = '';
                    this.ui.showToast('Bienvenido, Administrador (Sesión segura iniciada)', 'success');
                    this.renderAll();
                } else {
                    this.ui.showToast(authResult.message || 'Contraseña incorrecta', 'error');
                }
            }
        });

        // --- 6. MODAL 2: CONFIRMAR CONTRATACIÓN ---
        const closeHireModalBtn = document.getElementById('closeHireModalBtn');
        const cancelHireModalBtn = document.getElementById('cancelHireModalBtn');

        closeHireModalBtn?.addEventListener('click', () => this.ui.closeModal(this.ui.hireModal));
        cancelHireModalBtn?.addEventListener('click', () => this.ui.closeModal(this.ui.hireModal));

        this.ui.hireModal.addEventListener('click', (e) => {
            if (e.target === this.ui.hireModal) this.ui.closeModal(this.ui.hireModal);
        });

        this.ui.hireForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hireData = {
                proId: document.getElementById('hireProId').value,
                projectTitle: document.getElementById('hireProjectTitle').value,
                projectDesc: document.getElementById('hireProjectDesc').value,
                startDate: document.getElementById('hireStartDate').value
            };

            const createdHire = this.talentManager.createHiring(hireData);
            if (createdHire) {
                this.ui.showToast('¡Especialista contratado con éxito! Da seguimiento en "Mis Contrataciones"', 'success');
                this.ui.closeModal(this.ui.hireModal);
                this.renderAll();
                document.getElementById('navHiringsBtn').click();
            }
        });

        // --- 7. EVENT DELEGATION EN TABLERO DE CONTRATACIONES ---

        this.ui.hiringsGrid.addEventListener('change', (e) => {
            if (e.target.classList.contains('hiring-status-changer')) {
                const hireId = e.target.dataset.id;
                const newStatus = e.target.value;
                this.talentManager.updateHiringStatus(hireId, newStatus);
                this.ui.showToast('Estado de la contratación actualizado', 'info');
                this.renderAll();
            }
        });

        // --- 8. SIDEBAR Y MODO DE TEMA (CLARO AMIGABLE VS OSCURO RELAJANTE) ---
        const openSidebarBtn = document.getElementById('openSidebarBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        const sidebar = document.getElementById('sidebar');

        openSidebarBtn?.addEventListener('click', () => sidebar.classList.add('open'));
        closeSidebarBtn?.addEventListener('click', () => sidebar.classList.remove('open'));

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
}

