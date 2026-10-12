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
            status: data.status || 'available',
            interacciones: Number(data.interacciones) || 0
        };

        this.pros.unshift(newPro);
        this.storage.saveProfessionals(this.pros);
        this.storage.saveProfessionalToCloud(newPro);
        return newPro;
    }

    async voteForProfessional(proId) {
        const pro = this.getProfessionalById(proId);
        if (!pro) return { success: false, message: 'No encontrado' };

        if (this.storage.hasVoted(proId)) {
            return { 
                success: false, 
                yaVotado: true, 
                interacciones: pro.interacciones || 0,
                message: 'Ya votaste por este emprendimiento' 
            };
        }

        // Incrementar localmente
        pro.interacciones = (Number(pro.interacciones) || 0) + 1;
        this.storage.saveProfessionals(this.pros);

        // Registrar en Storage y en Cloud
        const cloudResult = await this.storage.registerVote(proId);
        if (cloudResult && cloudResult.interacciones !== undefined) {
            pro.interacciones = cloudResult.interacciones;
            this.storage.saveProfessionals(this.pros);
        }

        return { 
            success: true, 
            voted: true,
            interacciones: pro.interacciones 
        };
    }

    async toggleVoteForProfessional(proId) {
        const pro = this.getProfessionalById(proId);
        if (!pro) return { success: false, message: 'No encontrado' };

        const currentlyVoted = this.storage.hasVoted(proId);

        if (currentlyVoted) {
            // Deseleccionar voto
            pro.interacciones = Math.max(0, (Number(pro.interacciones) || 0) - 1);
            this.storage.saveProfessionals(this.pros);

            const cloudResult = await this.storage.unregisterVote(proId);
            if (cloudResult && cloudResult.interacciones !== undefined) {
                pro.interacciones = cloudResult.interacciones;
                this.storage.saveProfessionals(this.pros);
            }

            return {
                success: true,
                voted: false,
                interacciones: pro.interacciones,
                message: 'Voto retirado'
            };
        } else {
            // Votar
            return await this.voteForProfessional(proId);
        }
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
            this.storage.updateProfessionalInCloud(this.pros[index]);
            return this.pros[index];
        }
        return null;
    }

    deleteProfessional(proId) {
        const initialLength = this.pros.length;
        this.pros = this.pros.filter(p => p.id !== proId);
        if (this.pros.length !== initialLength) {
            this.storage.saveProfessionals(this.pros);
            this.storage.deleteProfessionalFromCloud(proId);
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
        this.storage.saveHiringToCloud(newHire);
        return newHire;
    }

    updateHiringStatus(hireId, newStatus) {
        const index = this.hirings.findIndex(h => h.id === hireId);
        if (index !== -1) {
            this.hirings[index].status = newStatus;
            this.storage.saveHirings(this.hirings);
            this.storage.updateHiringInCloud(hireId, newStatus);
            return this.hirings[index];
        }
        return null;
    }

    getFilteredProfessionals() {
        const normalize = (text) => {
            return (text || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();
        };

        const query = normalize(this.currentSearchQuery).trim();
        const tokens = query.split(/\s+/).filter(Boolean);

        const areaKeywordsMap = {
            health: 'salud medicina medico doctor enfermeria clinica farmacia dental odontologia',
            education: 'educacion profesor maestro tutoria clases apoyo psicologia escuela',
            business: 'negocios asesoria finanzas contabilidad administracion legal abogado consultoria',
            services: 'servicios tecnico electricista plomero mecanica reparacion instalaciones chofer transporte arbitro cafeteria'
        };

        return this.pros.filter(pro => {
            const matchesArea = this.currentAreaFilter === 'all' || pro.area === this.currentAreaFilter;
            if (!matchesArea) return false;

            if (tokens.length === 0) return true;

            const areaSynonyms = areaKeywordsMap[pro.area] || '';
            const searchableCorpus = normalize([
                pro.businessName || '',
                pro.name || '',
                pro.title || '',
                pro.area || '',
                (pro.skills || []).join(' '),
                pro.phone || '',
                areaSynonyms
            ].join(' '));

            return tokens.every(token => searchableCorpus.includes(token));
        }).sort((a, b) => {
            const votesA = Number(a.interacciones) || 0;
            const votesB = Number(b.interacciones) || 0;
            return votesB - votesA; // Mayor a menor cantidad de votos
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

