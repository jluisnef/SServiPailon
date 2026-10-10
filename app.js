/**
 * ============================================================================
 * PANDATASKER — PLATAFORMA DE DIRECTORIO Y CONTRATACIÓN DE PROFESIONALES
 * ============================================================================
 * Arquitectura modular Vanilla JavaScript ES6+ (Friendly UI/UX con fotos de trabajadores):
 * 1. StorageManager: Persistencia en LocalStorage (incluye fotos de alta calidad).
 * 2. TalentManager: Lógica de negocio (CRUD, filtros, cálculo de estadísticas).
 * 3. UIController: Manipulación dinámica y renderizado con respaldo de avatares.
 * 4. App: Coordinación central, Event Delegation y control de modos de tema.
 * ============================================================================
 */

// ============================================================================
// 1. CLASE STORAGE MANAGER (Persistencia de Personal y Contrataciones)
// ============================================================================
class StorageManager {
    constructor(prosKey = 'pandatasker_pros_demo_v4', hiringsKey = 'pandatasker_hirings_demo_v4') {
        this.prosKey = prosKey;
        this.hiringsKey = hiringsKey;
    }

    getProfessionals() {
        try {
            const data = localStorage.getItem(this.prosKey);
            if (!data) {
                const demoPros = this.getInitialDemoProfessionals();
                this.saveProfessionals(demoPros);
                return demoPros;
            }
            const parsed = JSON.parse(data);
            return parsed;
        } catch (error) {
            console.error('Error leyendo profesionales de LocalStorage:', error);
            return [];
        }
    }

    saveProfessionals(pros) {
        try {
            localStorage.setItem(this.prosKey, JSON.stringify(pros));
        } catch (error) {
            console.error('Error guardando profesionales en LocalStorage:', error);
        }
    }

    getHirings() {
        try {
            const data = localStorage.getItem(this.hiringsKey);
            if (!data) {
                const demoHirings = this.getInitialDemoHirings();
                this.saveHirings(demoHirings);
                return demoHirings;
            }
            const parsed = JSON.parse(data);
            const prosMap = new Map(this.getProfessionals().map(p => [p.id, p]));
            let migrated = false;
            parsed.forEach(hire => {
                const pro = prosMap.get(hire.proId);
                if (pro && hire.proName !== pro.name) {
                    hire.proName = pro.name;
                    migrated = true;
                }
                if (!hire.proPhoto || hire.proPhoto.includes('unsplash.com')) {
                    hire.proPhoto = pro ? (pro.photo || '') : '';
                    migrated = true;
                }
            });
            if (migrated) {
                this.saveHirings(parsed);
            }
            return parsed;
        } catch (error) {
            console.error('Error leyendo contrataciones de LocalStorage:', error);
            return [];
        }
    }

    saveHirings(hirings) {
        try {
            localStorage.setItem(this.hiringsKey, JSON.stringify(hirings));
        } catch (error) {
            console.error('Error guardando contrataciones en LocalStorage:', error);
        }
    }

    /**
     * Genera un catálogo inicial de profesionales ejemplares con retratos fotográficos reales.
     */
    getInitialDemoProfessionals() {
        return [
            {
                id: 'pro_101',
                businessName: 'CENTRO DE REHABILITACION FISICA JC',
                name: 'Juan Carlos Choque Llanos',
                area: 'health',
                title: 'Msc. Doctor en Osteópatia',
                photo: 'img/fisioterapia.jpeg',
                phone: '+59177806950',
                skills: ['Fisioterapia Geriátrica', 'Terapia Deportiva', 'Electroterapia', 'Tina hidromasajes', 'Masaje terapeutico', 'Baños de vapor', 'Terapia Acuática', 'Ecografía Músculo esqueletica',],
                experience: 8,
                status: 'available',
            },
            {
                id: 'pro_102',
                businessName: 'VITALDENT',
                name: 'Olga Pacheco Condori',
                area: 'health',
                title: 'Odontóloga',
                photo: 'img/vitaldent.jpeg',
                phone: '+59167744463',
                skills: ['Odontología general', 'Ortodoncia', 'Blanqueamiento Dental', 'Endodoncia'],
                experience: 7,
                status: 'available',
            },
            {
                id: 'pro_103',
                businessName: 'ASOCIACION DE ARBITROS A.A.P.',
                name: 'Gabriel Avalos Escobar',
                area: 'services',
                title: 'A.A.P. asociación de Árbitros de Pailón',
                photo: 'img/arbitro.jpeg',
                phone: '+59177686400',
                skills: ['Árbitro de Futbol', 'Ligas estudiantiles', 'Liga Seniors', 'Campeonatos de Futbol', 'Ligas Municipales'],
                experience: 12,
                status: 'available',
            },

            {
                id: 'pro_104',
                businessName: 'SAMYMED',
                name: 'Dr. Samuel Israel Moreno ',
                area: 'health',
                title: 'Consultorio Médico y Farmacia',
                photo: 'img/SAMYMED.jpeg',
                phone: '+59177097224',
                skills: ['Consulta de medicina general', 'Medición de Glicemia', 'Nebulización', 'Limpieza de Oídos', 'Atención Medica a Domicilio', 'Colocación de Sueros'],
                experience: 9,
                status: 'available',
            },
            {
                id: 'pro_105',
                businessName: 'TECHTONI',
                name: 'Elmer Pinto Pitiga',
                area: 'services',
                title: 'Electricista y Contratista',
                photo: 'img/TECHTONY.png',
                phone: '+59176600931',
                skills: ['Instalación Domiciliaria', 'Diseño e instalación de proyectos', 'Tableros de Control y arranque', 'Rebobinado, mantenimiento y reparación de motores'],
                experience: 5,
                status: 'available',
            },

            {
                id: 'pro_106',
                businessName: 'CENTRO INTEGRAL DE SUPERACIÓN PANAMBÍ (CISPA)',
                name: 'Lic. Jessica Muriel Justiniano Gutiérrez',
                area: 'Education',
                title: 'Psicopedagoga Social',
                photo: 'img/panambi.jpeg',
                phone: '+59170077868',
                skills: ['Estimulación temprana', 'Fortalecimiento escolar', 'Oratoria', 'Orientación vocacional', 'liderasgo', 'proyecto de vida', 'Escucha activa', 'Asesoramiento sobre riesgos sociales', 'Consejería de parejas', 'Talleres grupales (Educación y desarrollo personal)'],
                experience: 15,
                status: 'available',
            },
            {
                id: 'pro_107',
                businessName: '',
                name: 'Noelia Vallejos Veizaga',
                area: 'services',
                title: 'Nutricionista',
                photo: 'img/NEFTIS.jpeg',
                phone: '+59178184654',
                skills: ['Capuchino', 'Frappés', 'Tés', 'Café', 'Moca', 'Bebidas Frías', 'Vita Café', 'Malteadas Cremosas', 'Mascarilla Antioxidante', 'Mascarilla de Spirulina', 'Crema Facial de Cocozhi',],
                experience: 7,
                status: 'available',
            },
            {
                id: 'pro_108',
                businessName: 'MANITAS CREATIVAS',
                name: 'Lic. Diana Paniagua Calizaya',
                area: 'education',
                title: 'Psicóloga Infantil',
                photo: 'img/manitascreativas.jpeg',
                phone: '+59173986342',
                skills: ['Atención de Niños, Jóvenes y Adultos', 'Evaluación Psicológica', 'Maestra Integradora', 'Apoyo Escolar', 'Desarrollo Creativo', 'Educación Inicial'],
                experience: 5,
                status: 'available',
            },
            {
                id: 'pro_109',
                businessName: '',
                name: 'Pedro ',
                area: 'services',
                title: 'Electricista',
                photo: 'img/Elmer.jpeg',
                phone: '+59172857225',
                skills: ['', 'Node.js', 'TypeScript', 'AWS Cloud', 'Docker'],
                experience: 7,
                status: 'available',
            },

        ];
    }

    getInitialDemoHirings() {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return [
            {
                id: 'hire_201',
                proId: 'pro_101',
                proName: 'Juan Carlos Choque Llanos',
                proPhoto: 'img/fisioterapia.jpeg',
                proArea: 'salud',
                projectTitle: 'Msc. Doctor en Osteópatia',
                projectDesc: 'Dolores musculares, Luxaciones, Masajes Terapeuticos, Drenaje Linfático y contracturas.',
                startDate: tomorrow,
                status: 'in-progress',
                createdAt: new Date().toISOString()
            }
        ];
    }
}

// ============================================================================
// 2. CLASE TALENT MANAGER (Modelo y Lógica de Negocio CRUD)
// ============================================================================
class TalentManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.pros = this.storage.getProfessionals();
        this.hirings = this.storage.getHirings();
        this.currentAreaFilter = 'all';
        this.currentSearchQuery = '';
        this.onlyAvailable = false;
    }

    /**
     * Registra un nuevo profesional procesando su fotografía (o asignando una por defecto).
     */
    createProfessional(data) {
        const skillsArray = typeof data.skills === 'string' ?
            data.skills.split(',').map(s => s.trim()).filter(Boolean) : data.skills;

        // Fotos automáticas amigables según área si el usuario no introdujo una URL
        const fallbackPhotos = {
            health: 'img/PATRICIA1.jpeg',
            education: 'img/LELYS.jpeg',
            business: 'img/DEMIA.jpeg',
            services: 'img/ROSIO.jpeg'
        };

        const photoUrl = data.photo ? data.photo.trim() : (fallbackPhotos[data.area] || '');

        const newPro = {
            id: 'pro_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            name: data.name.trim(),
            area: data.area,
            title: data.title.trim(),
            phone: data.phone ? data.phone.trim() : '+59100000000',
            photo: photoUrl,
            skills: skillsArray.length ? skillsArray : ['Profesional'],
            experience: Number(data.experience) || 1,
            status: data.status || 'available',
        };

        this.pros.unshift(newPro);
        this.storage.saveProfessionals(this.pros);
        return newPro;
    }

    getProfessionalById(proId) {
        return this.pros.find(p => p.id === proId);
    }

    updateProfessional(proId, updatedFields) {
        const index = this.pros.findIndex(p => p.id === proId);
        if (index !== -1) {
            if (typeof updatedFields.skills === 'string') {
                updatedFields.skills = updatedFields.skills.split(',').map(s => s.trim()).filter(Boolean);
            }
            this.pros[index] = { ...this.pros[index], ...updatedFields };
            this.storage.saveProfessionals(this.pros);
            return this.pros[index];
        }
        return null;
    }

    deleteProfessional(proId) {
        const initialLength = this.pros.length;
        this.pros = this.pros.filter(p => p.id !== proId);
        if (this.pros.length !== initialLength) {
            this.storage.saveProfessionals(this.pros);
            return true;
        }
        return false;
    }

    createHiring(hireData) {
        const pro = this.getProfessionalById(hireData.proId);
        if (!pro) return null;

        const newHire = {
            id: 'hire_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            proId: pro.id,
            proName: pro.name,
            proPhoto: pro.photo || '',
            proArea: pro.area,
            projectTitle: hireData.projectTitle.trim(),
            projectDesc: hireData.projectDesc.trim(),
            startDate: hireData.startDate,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.hirings.unshift(newHire);
        this.storage.saveHirings(this.hirings);
        return newHire;
    }

    updateHiringStatus(hireId, newStatus) {
        const index = this.hirings.findIndex(h => h.id === hireId);
        if (index !== -1) {
            this.hirings[index].status = newStatus;
            this.storage.saveHirings(this.hirings);
            return this.hirings[index];
        }
        return null;
    }

    getFilteredProfessionals() {
        return this.pros.filter(pro => {
            const matchesArea = this.currentAreaFilter === 'all' || pro.area === this.currentAreaFilter;
            const matchesStatus = !this.onlyAvailable || pro.status === 'available';

            const query = this.currentSearchQuery.toLowerCase();
            const matchesSearch = !query ||
                pro.name.toLowerCase().includes(query) ||
                pro.title.toLowerCase().includes(query) ||
                pro.skills.some(s => s.toLowerCase().includes(query)) ||
                pro.bio.toLowerCase().includes(query);

            return matchesArea && matchesStatus && matchesSearch;
        });
    }

    getStatistics() {
        const availablePros = this.pros.filter(p => p.status === 'available').length;
        const activeHirings = this.hirings.filter(h => h.status !== 'completed').length;
        const areasCovered = new Set(this.pros.map(p => p.area)).size;

        return {
            totalPros: this.pros.length,
            availablePros: availablePros,
            activeHirings: activeHirings,
            totalAreas: areasCovered || 1
        };
    }
}

// ============================================================================
// 3. CLASE UI CONTROLLER (Manipulación Dinámica y Renderizado de Fotos/DOM)
// ============================================================================
class UIController {
    constructor() {
        this.statTotalPros = document.getElementById('statTotalPros');
        this.statAvailablePros = document.getElementById('statAvailablePros');
        this.statActiveHirings = document.getElementById('statActiveHirings');
        this.statTotalAreas = document.getElementById('statTotalAreas');
        this.progressAvailable = document.getElementById('progressAvailable');
        this.progressHirings = document.getElementById('progressHirings');
        this.badgeHirings = document.getElementById('badgeHirings');

        this.directoryView = document.getElementById('directoryView');
        this.hiringsView = document.getElementById('hiringsView');
        this.professionalsGrid = document.getElementById('professionalsGrid');
        this.hiringsGrid = document.getElementById('hiringsGrid');

        this.proModal = document.getElementById('proModal');
        this.proForm = document.getElementById('proForm');
        this.proModalTitle = document.getElementById('proModalTitle');

        this.hireModal = document.getElementById('hireModal');
        this.hireForm = document.getElementById('hireForm');
        this.selectedProSummary = document.getElementById('selectedProSummary');

        this.toastContainer = document.getElementById('toastContainer');
    }

    switchView(viewName) {
        if (viewName === 'directory') {
            this.directoryView.classList.remove('hidden');
            this.directoryView.classList.add('active');
            this.hiringsView.classList.remove('active');
            this.hiringsView.classList.add('hidden');
            document.getElementById('pageTitle').textContent = 'Directorio de Profesionales';
            document.getElementById('pageSubtitle').textContent = 'Encuentra y contrata al especialista ideal con experiencia verificada para tu proyecto';
        } else {
            this.hiringsView.classList.remove('hidden');
            this.hiringsView.classList.add('active');
            this.directoryView.classList.remove('active');
            this.directoryView.classList.add('hidden');
            document.getElementById('pageTitle').textContent = 'Mis Contrataciones y Solicitudes';
            document.getElementById('pageSubtitle').textContent = 'Monitorea el progreso, la fecha de inicio y el estado de los profesionales seleccionados';
        }
    }

    updateDashboardStats(stats, totalHiringsCount) {
        this.statTotalPros.textContent = stats.totalPros;
        this.statAvailablePros.textContent = stats.availablePros;
        this.statActiveHirings.textContent = stats.activeHirings;
        this.statTotalAreas.textContent = stats.totalAreas;
        this.badgeHirings.textContent = totalHiringsCount;

        const total = stats.totalPros || 1;
        const availPct = Math.round((stats.availablePros / total) * 100);
        this.progressAvailable.style.width = `${stats.totalPros > 0 ? availPct : 0}%`;

        const hiringsPct = Math.min(100, stats.activeHirings * 25);
        this.progressHirings.style.width = `${hiringsPct}%`;
    }

    renderDirectory(pros) {
        this.professionalsGrid.innerHTML = '';

        if (pros.length === 0) {
            this.professionalsGrid.innerHTML = `
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
                    <p>No se encontraron profesionales que coincidan con tu búsqueda actual.</p>
                </div>
            `;
            return;
        }

        const areaLabels = {
            health: '🩺 Salud',
            education: '📚 Educación',
            business: '📈 Negocios',
            services: '🔧 Servicios'
        };

        pros.forEach(pro => {
            const initials = pro.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const isAvailable = pro.status === 'available';

            // Si hay foto, intentamos cargar la img; si falla o está vacía se muestra el fallback con iniciales
            const photoImg = pro.photo ?
                `<img src="${pro.photo}" class="pro-avatar-img" alt="${this.escapeHTML(pro.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
            const fallbackStyle = pro.photo ? 'style="display:none;"' : '';

            const cardHTML = `
                <article class="pro-card glass" data-id="${pro.id}">
                    <div class="pro-card-header">
                        <span class="area-badge area-${pro.area}">${areaLabels[pro.area] || pro.area}</span>
                        ${window.ServiPailonApp && window.ServiPailonApp.isAdmin ? `
                        <div class="pro-actions" style="display: flex; align-items: center; gap: 5px;">
                            <select class="admin-quick-status" data-id="${pro.id}" style="background: var(--bg-input); color: var(--text-primary); font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-glass); cursor: pointer; outline: none;">
                                <option value="available" ${isAvailable ? 'selected' : ''}>🟢 Disponible</option>
                                <option value="busy" ${!isAvailable ? 'selected' : ''}>🔴 Ocupado</option>
                            </select>
                            <button class="action-btn edit-pro-btn" data-id="${pro.id}" aria-label="Editar perfil" title="Editar">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                            <button class="action-btn delete-pro-btn" data-id="${pro.id}" aria-label="Eliminar perfil" title="Eliminar">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                            </button>
                        </div>
                        ` : ''}
                    </div>

                    <div class="pro-profile">
                        <div class="pro-avatar-wrapper">
                            ${photoImg}
                            <div class="pro-avatar" ${fallbackStyle}>${initials}</div>
                            <span class="status-dot ${isAvailable ? 'status-available' : 'status-busy'}" title="${isAvailable ? 'Disponible Ahora' : 'En Proyecto'}"></span>
                        </div>
                        <div class="pro-info">
                            <h4 class="pro-name" title="${this.escapeHTML(pro.name)}">
                                ${this.escapeHTML(pro.name)} 
                                ${!isAvailable ? '<span style="background: var(--status-busy); color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; margin-left: 5px; vertical-align: middle; font-weight: bold;">OCUPADO</span>' : ''}
                            </h4>
                            <span class="pro-title">${this.escapeHTML(pro.title)}</span>
                        </div>
                    </div>

                    <p class="pro-bio">${this.escapeHTML(pro.bio)}</p>

                    <div class="skill-tags">
                        ${pro.skills.slice(0, 4).map(skill => `<span class="skill-tag">${this.escapeHTML(skill)}</span>`).join('')}
                    </div>

                    <div class="pro-stats-bar">

                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Experiencia</span>
                            <span class="pro-stat-value">${pro.experience} años</span>
                        </div>
                    </div>

                    <div class="pro-card-footer">
                        <a href="${isAvailable ? `https://wa.me/${pro.phone}?text=Hola%20${encodeURIComponent(pro.name)},%20te%20encontré%20en%20ServiPailon%20y%20me%20gustaría%20solicitar%20tus%20servicios.` : '#'}" 
                           target="${isAvailable ? '_blank' : '_self'}" 
                           class="btn-hire ${!isAvailable ? 'busy' : ''}" 
                           style="text-decoration: none; display: inline-flex; justify-content: center; align-items: center; gap: 6px; padding: 10px 15px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; ${!isAvailable ? 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; cursor: not-allowed; opacity: 0.8;' : 'background: var(--accent-gradient); color: white;'}" 
                           ${!isAvailable ? 'title="Actualmente asignado a otro proyecto" onclick="return false;"' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>${isAvailable ? 'Contactar por WhatsApp' : 'Actualmente Ocupado'}</span>
                        </a>
                    </div>
                </article>
            `;
            this.professionalsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    renderHirings(hirings) {
        this.hiringsGrid.innerHTML = '';

        if (hirings.length === 0) {
            this.hiringsGrid.innerHTML = `
                <div class="empty-state">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <p>Aún no tienes contrataciones activas. Explora el Directorio y elige a tu especialista.</p>
                </div>
            `;
            return;
        }

        const statusLabels = {
            pending: '🕒 Solicitud Recibida',
            'in-progress': '⚡ En Progreso',
            completed: '✅ Servicio Concluido'
        };

        const statusBadgeClasses = {
            pending: 'status-badge-pending',
            'in-progress': 'status-badge-progress',
            completed: 'status-badge-completed'
        };

        hirings.forEach(hire => {
            const initials = hire.proName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const formattedDate = this.formatDate(hire.startDate);

            const photoImg = hire.proPhoto ?
                `<img src="${hire.proPhoto}" class="hiring-pro-avatar" alt="${this.escapeHTML(hire.proName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
            const fallbackStyle = hire.proPhoto ? 'style="display:none;"' : '';

            const cardHTML = `
                <article class="hiring-card glass" data-id="${hire.id}">
                    <div class="hiring-header">
                        <h4 class="hiring-title">${this.escapeHTML(hire.projectTitle)}</h4>
                        <span class="status-badge ${statusBadgeClasses[hire.status] || ''}">${statusLabels[hire.status] || hire.status}</span>
                    </div>

                    <p class="hiring-desc">${this.escapeHTML(hire.projectDesc)}</p>

                    <div class="hiring-pro-info">
                        ${photoImg}
                        <div class="pro-avatar" style="width:48px;height:48px;font-size:1.1rem;flex-shrink:0;${hire.proPhoto ? 'display:none;' : ''}">${initials}</div>
                        <div>
                            <strong style="display:block; font-size:0.96rem; color:var(--text-primary);">${this.escapeHTML(hire.proName)}</strong>
                            <span style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">Especialista asignado (${hire.proArea.toUpperCase()})</span>
                        </div>
                    </div>

                    <div class="hiring-footer">
                        <span>Inicio estimado: <strong style="color:var(--text-primary);">${formattedDate}</strong></span>
                        
                        <div style="display: flex; gap: 8px; align-items: center;">

                            <select class="hiring-status-changer" data-id="${hire.id}" aria-label="Cambiar estado del servicio">
                                <option value="pending" ${hire.status === 'pending' ? 'selected' : ''}>🕒 Solicitud Recibida</option>
                                <option value="in-progress" ${hire.status === 'in-progress' ? 'selected' : ''}>⚡ En Progreso</option>
                                <option value="completed" ${hire.status === 'completed' ? 'selected' : ''}>✅ Servicio Concluido</option>
                            </select>
                        </div>
                    </div>
                </article>
            `;
            this.hiringsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    openProModal(proToEdit = null) {
        this.proForm.reset();

        const photoPreviewContainer = document.getElementById('photoPreviewContainer');
        const photoPreview = document.getElementById('photoPreview');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const proPhotoFile = document.getElementById('proPhotoFile');
        if (proPhotoFile) proPhotoFile.value = '';

        if (proToEdit) {
            this.proModalTitle.textContent = 'Editar Profesional';
            document.getElementById('proId').value = proToEdit.id;
            document.getElementById('proName').value = proToEdit.name;
            document.getElementById('proPhoto').value = proToEdit.photo || '';
            document.getElementById('proArea').value = proToEdit.area;
            document.getElementById('proTitle').value = proToEdit.title;
            document.getElementById('proPhone').value = proToEdit.phone || '';
            document.getElementById('proSkills').value = proToEdit.skills.join(', ');
            document.getElementById('proExperience').value = proToEdit.experience;
            document.getElementById('proStatus').value = proToEdit.status;
            document.getElementById('proBio').value = proToEdit.bio;

            if (proToEdit.photo) {
                if (fileNameDisplay) fileNameDisplay.textContent = 'Foto actual cargada';
                if (photoPreview) photoPreview.src = proToEdit.photo;
                if (photoPreviewContainer) photoPreviewContainer.style.display = 'block';
            } else {
                if (fileNameDisplay) fileNameDisplay.textContent = 'Sin seleccionar';
                if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
            }
        } else {
            this.proModalTitle.textContent = 'Registrar Nuevo Profesional';
            document.getElementById('proId').value = '';
            document.getElementById('proPhoto').value = '';
            document.getElementById('proArea').value = 'services';
            document.getElementById('proPhone').value = '';
            document.getElementById('proStatus').value = 'available';

            if (fileNameDisplay) fileNameDisplay.textContent = 'Sin seleccionar';
            if (photoPreviewContainer) photoPreviewContainer.style.display = 'none';
            if (photoPreview) photoPreview.src = '';
        }

        if (typeof this.proModal.showModal === 'function') {
            this.proModal.showModal();
        } else {
            this.proModal.setAttribute('open', '');
        }
        document.getElementById('proName').focus();
    }

    openHireModal(pro) {
        this.hireForm.reset();
        document.getElementById('hireProId').value = pro.id;

        const initials = pro.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const photoImg = pro.photo ?
            `<img src="${pro.photo}" class="pro-avatar-img" style="width:52px;height:52px;" alt="${this.escapeHTML(pro.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
        const fallbackStyle = pro.photo ? 'style="display:none;"' : '';

        this.selectedProSummary.innerHTML = `
            <div class="pro-avatar-wrapper" style="width:52px;height:52px;padding:2px;">
                ${photoImg}
                <div class="pro-avatar" style="font-size:1.15rem;${fallbackStyle}">${initials}</div>
            </div>
            <div>
                <strong style="display:block; color:var(--text-primary); font-size:1.06rem;">${this.escapeHTML(pro.name)}</strong>
                <span style="font-size:0.84rem; color:var(--text-secondary);">${this.escapeHTML(pro.title)} · <strong style="color:var(--status-available);">$${pro.rate}/hr</strong></span>
            </div>
        `;

        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('hireStartDate').value = tomorrow;

        if (typeof this.hireModal.showModal === 'function') {
            this.hireModal.showModal();
        } else {
            this.hireModal.setAttribute('open', '');
        }
        document.getElementById('hireProjectTitle').focus();
    }

    closeModal(modalElement) {
        if (typeof modalElement.close === 'function') {
            modalElement.close();
        } else {
            modalElement.removeAttribute('open');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-available)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        } else if (type === 'error') {
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
        } else {
            iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
        }

        toast.innerHTML = `${iconSvg}<span>${this.escapeHTML(message)}</span>`;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(15px) scale(0.95)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        const options = { day: 'numeric', month: 'short' };
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('es-ES', options);
        } catch (e) {
            return dateString;
        }
    }

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// ============================================================================
// 4. CLASE APP (Controlador de Aplicación y Gestión de Eventos por Delegación)
// ============================================================================
class App {
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

        const availToggle = document.getElementById('onlyAvailableToggle');
        availToggle?.addEventListener('change', (e) => {
            this.talentManager.onlyAvailable = e.target.checked;
            this.renderAll();
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
                name: document.getElementById('proName').value,
                photo: document.getElementById('proPhoto').value,
                area: document.getElementById('proArea').value,
                title: document.getElementById('proTitle').value,
                phone: document.getElementById('proPhone').value,
                skills: document.getElementById('proSkills').value,
                experience: document.getElementById('proExperience').value,
                status: document.getElementById('proStatus').value,
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

// ============================================================================
// INICIALIZACIÓN DE LA PLATAFORMA PANDATASKER (FRIENDLY UI)
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    window.ServiPailonApp = new App();
});
