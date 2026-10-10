export class TalentManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.pros = this.storage.getProfessionals();
        this.hirings = this.storage.getHirings();
        this.currentAreaFilter = 'all';
        this.currentSearchQuery = '';
    }

    /**
     * Registra un nuevo profesional procesando su fotografía (o asignando una por defecto).
     */
    createProfessional(data) {
        const skillsArray = typeof data.skills === 'string' ?
            data.skills.split(',').map(s => s.trim()).filter(Boolean) : data.skills;

        // Si no suben foto, se mostrarán sus iniciales automáticamente
        const fallbackPhotos = {
            health: '',
            education: '',
            business: '',
            services: ''
        };

        const photoUrl = data.photo ? data.photo.trim() : (fallbackPhotos[data.area] || '');

        const newPro = {
            id: 'pro_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            businessName: data.businessName ? data.businessName.trim() : data.name.trim(),
            name: data.name.trim(),
            area: data.area,
            title: data.title.trim(),
            phone: data.phone ? data.phone.trim() : '+59100000000',
            photo: photoUrl,
            skills: skillsArray.length ? skillsArray : ['Profesional'],
            experience: Number(data.experience) || 1,
            status: data.status || 'available'
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

            const query = this.currentSearchQuery.toLowerCase();
            const matchesSearch = !query ||
                (pro.businessName && pro.businessName.toLowerCase().includes(query)) ||
                pro.name.toLowerCase().includes(query) ||
                pro.title.toLowerCase().includes(query) ||
                pro.skills.some(s => s.toLowerCase().includes(query));

            return matchesArea && matchesSearch;
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

