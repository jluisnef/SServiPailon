export class UIController {
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
        if (this.statTotalPros) this.statTotalPros.textContent = stats.totalPros;
        if (this.statAvailablePros) this.statAvailablePros.textContent = stats.availablePros;
        if (this.statActiveHirings) this.statActiveHirings.textContent = stats.activeHirings;
        if (this.statTotalAreas) this.statTotalAreas.textContent = stats.totalAreas;
        if (this.badgeHirings) this.badgeHirings.textContent = totalHiringsCount;

        const total = stats.totalPros || 1;
        const availPct = Math.round((stats.availablePros / total) * 100);
        this.progressAvailable.style.width = `${stats.totalPros > 0 ? availPct : 0}%`;

        const hiringsPct = Math.min(100, stats.activeHirings * 25);
        this.progressHirings.style.width = `${hiringsPct}%`;
    }

    renderDirectory(pros, currentQuery = '') {
        this.professionalsGrid.innerHTML = '';

        const searchResultCount = document.getElementById('searchResultCount');
        const clearSearchBtn = document.getElementById('clearSearchBtn');

        if (clearSearchBtn) {
            clearSearchBtn.style.display = currentQuery && currentQuery.trim() ? 'inline-flex' : 'none';
        }

        if (searchResultCount) {
            if (currentQuery && currentQuery.trim()) {
                searchResultCount.style.display = 'inline-block';
                searchResultCount.textContent = `${pros.length} encontrado${pros.length === 1 ? '' : 's'}`;
            } else {
                searchResultCount.style.display = 'none';
            }
        }

        if (pros.length === 0) {
            const hasQuery = currentQuery && currentQuery.trim().length > 0;
            this.professionalsGrid.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary);">
                        ${hasQuery ? 'No se encontraron emprendimientos' : 'Sin registros disponibles'}
                    </h3>
                    <p style="margin: 0; max-width: 400px; font-size: 0.9rem;">
                        ${hasQuery ? `No encontramos resultados para "<strong>${this.escapeHTML(currentQuery)}</strong>". Intenta con palabras clave como <em>electricista</em>, <em>odontología</em>, <em>salud</em> o <em>mecánica</em>.` : 'No hay profesionales registrados en esta categoría en este momento.'}
                    </p>
                    ${hasQuery ? '<button type="button" class="empty-state-btn" id="resetSearchFromEmptyBtn">Ver todos los emprendimientos</button>' : ''}
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

        const normalize = (t) => (t || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normTokens = normalize(currentQuery).split(/\s+/).filter(Boolean);

        pros.forEach(pro => {
            const initials = pro.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const isAvailable = pro.status === 'available';
            const votesCount = Number(pro.interacciones) || 0;
            const hasVoted = window.ServiPailonApp && window.ServiPailonApp.storage ? window.ServiPailonApp.storage.hasVoted(pro.id) : false;

            // Si hay foto, intentamos cargar la img; si falla o está vacía se muestra el fallback con iniciales
            const photoImg = pro.photo ?
                `<img src="${this.escapeHTML(pro.photo)}" class="pro-avatar-img" alt="${this.escapeHTML(pro.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
            const fallbackStyle = pro.photo ? 'style="display:none;"' : '';

            const defaultMessage = `Hola ${pro.name}, te vi en ServiPailón y me gustaría solicitar tus servicios.`;

            const cardHTML = `
                <article class="pro-card glass" data-id="${pro.id}">
                    <div class="pro-card-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="area-badge area-${pro.area}">${areaLabels[pro.area] || pro.area}</span>
                            
                            <!-- ESTRELLITA DE VOTACIÓN / INTERACCIONES -->
                            <button type="button" 
                                    class="vote-star-btn ${hasVoted ? 'active' : ''}" 
                                    data-id="${pro.id}" 
                                    title="${hasVoted ? 'Ya votaste por este emprendimiento' : 'Votar por este emprendimiento'}">
                                <svg class="star-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                <span class="vote-count" id="voteCount-${pro.id}">${votesCount}</span>
                            </button>
                        </div>

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
                            <h4 class="pro-name" title="${this.escapeHTML(pro.businessName || pro.name)}">
                                ${this.escapeHTML(pro.businessName || pro.name)} 
                                ${!isAvailable ? '<span style="background: var(--status-busy); color: white; font-size: 0.65rem; padding: 2px 6px; border-radius: 12px; margin-left: 5px; vertical-align: middle; font-weight: bold;">OCUPADO</span>' : ''}
                            </h4>
                            <span class="pro-title" style="display:block; font-weight: 600; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 2px;">👤 Contacto: ${this.escapeHTML(pro.name)}</span>
                            <span class="pro-title">${this.escapeHTML(pro.title)}</span>
                        </div>
                    </div>

                    <div class="skill-tags">
                        ${pro.skills.map(skill => {
                            const normSkill = normalize(skill);
                            const isMatched = normTokens.length > 0 && normTokens.some(token => normSkill.includes(token));
                            return `<span class="skill-tag ${isMatched ? 'highlighted' : ''}">${this.escapeHTML(skill)}</span>`;
                        }).join('')}
                    </div>

                    <div class="pro-stats-bar">
                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Experiencia</span>
                            <span class="pro-stat-value">${pro.experience} años</span>
                        </div>
                        <div class="pro-stat-item">
                            <span class="pro-stat-label">Recomendaciones</span>
                            <span class="pro-stat-value" id="cardVotes-${pro.id}">⭐ ${votesCount}</span>
                        </div>
                    </div>

                    <div class="pro-card-footer">
                        <button type="button" 
                           class="btn-hire whatsapp-btn ${!isAvailable ? 'busy' : ''}" 
                           data-id="${pro.id}"
                           data-phone="${this.escapeHTML(pro.phone || '')}"
                           data-message="${this.escapeHTML(defaultMessage)}"
                           data-available="${isAvailable}"
                           style="text-decoration: none; width: 100%; border: none; cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; display: inline-flex; justify-content: center; align-items: center; gap: 6px; padding: 10px 15px; border-radius: 20px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; ${!isAvailable ? 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; opacity: 0.8;' : 'background: var(--accent-gradient); color: white;'}" 
                           ${!isAvailable ? 'title="Actualmente asignado a otro proyecto"' : ''}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>${isAvailable ? 'Contactar por WhatsApp' : 'Actualmente Ocupado'}</span>
                        </button>
                    </div>
                </article>
            `;
            this.professionalsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });

        // ==========================================
        // Premium Touch: Scroll Animation (Fade in up)
        // ==========================================
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Apply initial hidden state and observe
        const cards = this.professionalsGrid.querySelectorAll('.pro-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;
            observer.observe(card);
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
                `<img src="${this.escapeHTML(hire.proPhoto)}" class="hiring-pro-avatar" alt="${this.escapeHTML(hire.proName)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
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

        // ==========================================
        // Premium Touch: Scroll Animation (Fade in up)
        // ==========================================
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const cards = this.hiringsGrid.querySelectorAll('.hiring-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;
            observer.observe(card);
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
            document.getElementById('proBusinessName').value = proToEdit.businessName || proToEdit.name;
            document.getElementById('proName').value = proToEdit.name;
            document.getElementById('proPhoto').value = proToEdit.photo || '';
            document.getElementById('proArea').value = proToEdit.area;
            document.getElementById('proTitle').value = proToEdit.title;
            document.getElementById('proPhone').value = proToEdit.phone || '';
            document.getElementById('proSkills').value = proToEdit.skills.join(', ');
            document.getElementById('proExperience').value = proToEdit.experience;
            document.getElementById('proStatus').value = proToEdit.status;


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
            document.getElementById('proBusinessName').value = '';
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
            `<img src="${this.escapeHTML(pro.photo)}" class="pro-avatar-img" style="width:52px;height:52px;" alt="${this.escapeHTML(pro.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">` : '';
        const fallbackStyle = pro.photo ? 'style="display:none;"' : '';

        this.selectedProSummary.innerHTML = `
            <div class="pro-avatar-wrapper" style="width:52px;height:52px;padding:2px;">
                ${photoImg}
                <div class="pro-avatar" style="font-size:1.15rem;${fallbackStyle}">${initials}</div>
            </div>
            <div>
                <strong style="display:block; color:var(--text-primary); font-size:1.06rem;">${this.escapeHTML(pro.name)}</strong>
                <span style="font-size:0.84rem; color:var(--text-secondary);">${this.escapeHTML(pro.title)} · <strong style="color:var(--status-available);">$${pro.rate || '0.00'}/hr</strong></span>
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

