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
        this.renderAll();
        this.setupEventListeners();
    }

    renderAll() {
        const stats = this.talentManager.getStatistics();
        this.ui.updateDashboardStats(stats, this.talentManager.hirings.length);

        const filteredPros = this.talentManager.getFilteredProfessionals();
        this.ui.renderDirectory(filteredPros);

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
        const areaBtns = document.querySelectorAll('#areaFilters .filter-btn');
        areaBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                areaBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.talentManager.currentAreaFilter = btn.dataset.area || 'all';
                this.renderAll();
            });
        });


        // --- 3. BUSCADOR EN TIEMPO REAL ---
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        searchInput?.addEventListener('input', (e) => {
            this.talentManager.currentSearchQuery = e.target.value.trim();
            this.renderAll();
        });

        clearSearchBtn?.addEventListener('click', () => {
            searchInput.value = '';
            this.talentManager.currentSearchQuery = '';
            this.renderAll();
            searchInput.focus();
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
        });

        // --- 5.5. LOGIN DE ADMINISTRADOR ---
        const loginAdminBtn = document.getElementById('loginAdminBtn');
        const adminBtnText = document.getElementById('adminBtnText');
        loginAdminBtn?.addEventListener('click', () => {
            if (this.isAdmin) {
                this.isAdmin = false;
                adminBtnText.textContent = 'Acceso Admin';
                document.getElementById('openProModalBtn').style.display = 'none';
                document.getElementById('dashboardStats').style.display = 'none';
                this.ui.showToast('Sesión de administrador cerrada', 'info');
                this.renderAll();
            } else {
                const password = prompt('Ingrese la contraseña de Administrador:');
                if (password === 'ServiPailon20') {
                    this.isAdmin = true;
                    adminBtnText.textContent = 'Cerrar Admin';
                    document.getElementById('openProModalBtn').style.display = 'inline-flex';
                    document.getElementById('dashboardStats').style.display = '';
                    this.ui.showToast('Bienvenido, Administrador', 'success');
                    this.renderAll();
                } else if (password !== null) {
                    this.ui.showToast('Contraseña incorrecta', 'error');
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

