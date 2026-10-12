export class StorageManager {
    constructor(
        prosKey = 'pandatasker_pros_demo_v23', 
        hiringsKey = 'pandatasker_hirings_demo_v23',
        votesKey = 'servipailon_votes_v1',
        sessionKey = 'servipailon_session_id'
    ) {
        this.prosKey = prosKey;
        this.hiringsKey = hiringsKey;
        this.votesKey = votesKey;
        this.sessionKey = sessionKey;
        this.adminTokenKey = 'servipailon_admin_token';
    }

    getAdminToken() {
        try {
            return sessionStorage.getItem(this.adminTokenKey) || '';
        } catch {
            return '';
        }
    }

    setAdminToken(token) {
        try {
            if (token) {
                sessionStorage.setItem(this.adminTokenKey, token);
            } else {
                sessionStorage.removeItem(this.adminTokenKey);
            }
        } catch (e) {
            console.warn('Error guardando token en sessionStorage', e);
        }
    }

    clearAdminToken() {
        this.setAdminToken('');
    }

    async loginAdmin(password) {
        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    this.setAdminToken(data.token);
                    return { success: true };
                }
            }
            return { success: false, message: 'Contraseña incorrecta' };
        } catch (err) {
            console.warn('Fallo de red al autenticar en la nube:', err.message);
            return { success: false, offline: true, message: 'Error de conexión con el servidor de autenticación' };
        }
    }

    getSessionId() {
        let sid = localStorage.getItem(this.sessionKey);
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.sessionKey, sid);
        }
        return sid;
    }

    getVotedProIds() {
        try {
            const data = localStorage.getItem(this.votesKey);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    hasVoted(proId) {
        return this.getVotedProIds().includes(proId);
    }

    saveLocalVote(proId) {
        const votes = this.getVotedProIds();
        if (!votes.includes(proId)) {
            votes.push(proId);
            localStorage.setItem(this.votesKey, JSON.stringify(votes));
        }
    }

    removeLocalVote(proId) {
        const votes = this.getVotedProIds().filter(id => id !== proId);
        localStorage.setItem(this.votesKey, JSON.stringify(votes));
    }

    async registerVote(proId) {
        const sessionId = this.getSessionId();
        this.saveLocalVote(proId);

        try {
            const res = await fetch('/api/votes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proId, sessionId })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.log('Modo local para votos activo:', err.message);
        }
        return { success: true, localOnly: true };
    }

    async unregisterVote(proId) {
        const sessionId = this.getSessionId();
        this.removeLocalVote(proId);

        try {
            const res = await fetch('/api/votes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proId, sessionId })
            });
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.log('Modo local para retiro de votos activo:', err.message);
        }
        return { success: true, removed: true, localOnly: true };
    }

    async syncVotesFromCloud() {
        try {
            const sessionId = this.getSessionId();
            const res = await fetch(`/api/votes?sessionId=${encodeURIComponent(sessionId)}`);
            if (res.ok) {
                const cloudVotedIds = await res.json();
                if (Array.isArray(cloudVotedIds)) {
                    const localVotes = new Set([...this.getVotedProIds(), ...cloudVotedIds]);
                    localStorage.setItem(this.votesKey, JSON.stringify([...localVotes]));
                }
            }
        } catch (err) {
            // Silencioso en modo local
        }
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
     * Sincroniza datos en segundo plano desde la API (Neon PostgreSQL en Netlify)
     */
    async syncFromCloud(onSyncComplete) {
        try {
            const prosRes = await fetch('/api/professionals');
            if (prosRes.ok) {
                const prosData = await prosRes.json();
                if (Array.isArray(prosData) && prosData.length > 0) {
                    this.saveProfessionals(prosData);
                }
            }

            const hiringsRes = await fetch('/api/hirings');
            if (hiringsRes.ok) {
                const hiringsData = await hiringsRes.json();
                if (Array.isArray(hiringsData) && hiringsData.length > 0) {
                    this.saveHirings(hiringsData);
                }
            }

            await this.syncVotesFromCloud();

            if (typeof onSyncComplete === 'function') {
                onSyncComplete();
            }
        } catch (err) {
            console.log('Modo local activo (fallback a LocalStorage):', err.message);
        }
    }

    async saveProfessionalToCloud(pro) {
        try {
            const token = this.getAdminToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/api/professionals', {
                method: 'POST',
                headers,
                body: JSON.stringify(pro)
            });
        } catch (err) {
            console.warn('No se pudo sincronizar profesional con Neon:', err.message);
        }
    }

    async updateProfessionalInCloud(pro) {
        try {
            const token = this.getAdminToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch('/api/professionals', {
                method: 'PUT',
                headers,
                body: JSON.stringify(pro)
            });
        } catch (err) {
            console.warn('No se pudo actualizar profesional en Neon:', err.message);
        }
    }

    async deleteProfessionalFromCloud(proId) {
        try {
            const token = this.getAdminToken();
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch(`/api/professionals?id=${encodeURIComponent(proId)}`, {
                method: 'DELETE',
                headers
            });
        } catch (err) {
            console.warn('No se pudo eliminar profesional en Neon:', err.message);
        }
    }

    async saveHiringToCloud(hiring) {
        try {
            await fetch('/api/hirings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hiring)
            });
        } catch (err) {
            console.warn('No se pudo sincronizar contratación con Neon:', err.message);
        }
    }

    async updateHiringInCloud(hireId, status) {
        try {
            await fetch('/api/hirings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: hireId, status })
            });
        } catch (err) {
            console.warn('No se pudo actualizar contratación en Neon:', err.message);
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
                area: 'education',
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
                skills: ['Capuchino', 'Frappés', 'Tés', 'Café', 'Moca', 'Bebidas Frías', 'Vita Café', 'Malteadas Cremosas', 'Mascarilla Antioxidante', 'Mascarilla de Spirulina', 'Crema Facial de Cocozhi'],
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
                skills: ['Atención de Niños, Jóvenes y Adultos','Evaluación Psicológica','Maestra Integradora','Apoyo Escolar','Desarrollo Creativo', 'Educación Inicial'],
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

