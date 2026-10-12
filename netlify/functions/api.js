import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

// Token secreto / función para validar tokens de administrador
function generateAdminToken(secret) {
    const today = new Date().toISOString().slice(0, 10);
    return crypto.createHmac('sha256', secret).update(`servipailon_admin_${today}`).digest('hex');
}

function verifyAdmin(event) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'ServiPailon20';
    const authHeader = event.headers['authorization'] || event.headers['Authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return false;

    const expectedToken = generateAdminToken(adminPassword);
    // Comparación segura en tiempo constante contra timing attacks
    try {
        const bufA = Buffer.from(token);
        const bufB = Buffer.from(expectedToken);
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    } catch {
        return false;
    }
}

function sanitizeInput(str, maxLength = 255) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
}

export async function handler(event) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        return {
            statusCode: 503,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'DATABASE_URL_NOT_SET',
                message: 'La variable de entorno DATABASE_URL no está configurada en Netlify.'
            })
        };
    }

    const sql = neon(databaseUrl);
    const path = event.path.replace(/\/?\.netlify\/functions\/api\/?/, '').replace(/^\/?api\/?/, '');
    const segments = path.split('/').filter(Boolean);
    const resource = segments[0] || 'professionals';
    const id = segments[1] || null;

    try {
        // --- 0. AUTENTICACIÓN ADMIN SEGURA (/api/auth) ---
        if (resource === 'auth') {
            if (event.httpMethod === 'POST') {
                const data = JSON.parse(event.body || '{}');
                const password = (data.password || '').trim();
                const adminPassword = process.env.ADMIN_PASSWORD || 'ServiPailon20';

                // Verificación constante contra timing attacks
                const inputBuf = Buffer.from(password);
                const passBuf = Buffer.from(adminPassword);
                const isMatch = inputBuf.length === passBuf.length && crypto.timingSafeEqual(inputBuf, passBuf);

                if (isMatch) {
                    const token = generateAdminToken(adminPassword);
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({ success: true, token, message: 'Autenticación exitosa' })
                    };
                } else {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({ success: false, message: 'Contraseña incorrecta' })
                    };
                }
            }
        }
        // --- PROFESIONALES ---
        if (resource === 'professionals') {
            if (event.httpMethod === 'GET') {
                const rows = await sql`
                    SELECT 
                        id, 
                        business_name as "businessName", 
                        name, 
                        area, 
                        title, 
                        photo, 
                        phone, 
                        skills, 
                        experience, 
                        status,
                        COALESCE(interacciones, 0) as "interacciones"
                    FROM professionals 
                    ORDER BY COALESCE(interacciones, 0) DESC, created_at DESC;
                `;
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(rows)
                };
            }

            if (event.httpMethod === 'POST') {
                if (!verifyAdmin(event)) {
                    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado. Se requiere sesión de administrador.' }) };
                }

                const data = JSON.parse(event.body || '{}');
                const proId = data.id || `pro_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
                const cleanBusiness = sanitizeInput(data.businessName || '', 120);
                const cleanName = sanitizeInput(data.name || '', 100);
                const cleanArea = sanitizeInput(data.area || 'services', 30);
                const cleanTitle = sanitizeInput(data.title || '', 120);
                const cleanPhone = sanitizeInput(data.phone || '', 30);
                const cleanStatus = ['available', 'busy'].includes(data.status) ? data.status : 'available';
                const skillsJson = JSON.stringify(Array.isArray(data.skills) ? data.skills.map(s => sanitizeInput(s, 50)) : []);

                await sql`
                    INSERT INTO professionals (id, business_name, name, area, title, photo, phone, skills, experience, status, interacciones)
                    VALUES (
                        ${proId},
                        ${cleanBusiness},
                        ${cleanName},
                        ${cleanArea},
                        ${cleanTitle},
                        ${data.photo || ''},
                        ${cleanPhone},
                        ${skillsJson}::jsonb,
                        ${Math.min(60, Math.max(0, Number(data.experience) || 1))},
                        ${cleanStatus},
                        ${Math.max(0, Number(data.interacciones) || 0)}
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        business_name = EXCLUDED.business_name,
                        name = EXCLUDED.name,
                        area = EXCLUDED.area,
                        title = EXCLUDED.title,
                        photo = EXCLUDED.photo,
                        phone = EXCLUDED.phone,
                        skills = EXCLUDED.skills,
                        experience = EXCLUDED.experience,
                        status = EXCLUDED.status;
                `;

                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: true, id: proId })
                };
            }

            if (event.httpMethod === 'PUT') {
                if (!verifyAdmin(event)) {
                    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado. Se requiere sesión de administrador.' }) };
                }

                const targetId = id || JSON.parse(event.body || '{}').id;
                const data = JSON.parse(event.body || '{}');
                const cleanBusiness = data.businessName !== undefined ? sanitizeInput(data.businessName, 120) : null;
                const cleanName = data.name !== undefined ? sanitizeInput(data.name, 100) : null;
                const cleanArea = data.area !== undefined ? sanitizeInput(data.area, 30) : null;
                const cleanTitle = data.title !== undefined ? sanitizeInput(data.title, 120) : null;
                const cleanPhone = data.phone !== undefined ? sanitizeInput(data.phone, 30) : null;
                const cleanStatus = data.status !== undefined && ['available', 'busy'].includes(data.status) ? data.status : null;
                const skillsJson = data.skills !== undefined ? JSON.stringify(Array.isArray(data.skills) ? data.skills.map(s => sanitizeInput(s, 50)) : []) : null;

                await sql`
                    UPDATE professionals SET
                        business_name = COALESCE(${cleanBusiness}, business_name),
                        name = COALESCE(${cleanName}, name),
                        area = COALESCE(${cleanArea}, area),
                        title = COALESCE(${cleanTitle}, title),
                        photo = COALESCE(${data.photo}, photo),
                        phone = COALESCE(${cleanPhone}, phone),
                        skills = COALESCE(${skillsJson}::jsonb, skills),
                        experience = COALESCE(${data.experience ? Math.min(60, Math.max(0, Number(data.experience))) : null}, experience),
                        status = COALESCE(${cleanStatus}, status)
                    WHERE id = ${targetId};
                `;

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: true, id: targetId })
                };
            }

            if (event.httpMethod === 'DELETE') {
                if (!verifyAdmin(event)) {
                    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'No autorizado. Se requiere sesión de administrador.' }) };
                }

                const targetId = id || (event.queryStringParameters && event.queryStringParameters.id);
                if (!targetId) {
                    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Falta ID' }) };
                }
                await sql`DELETE FROM professionals WHERE id = ${targetId};`;
                return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
            }
        }

        // --- CONTRATACIONES ---
        if (resource === 'hirings') {
            if (event.httpMethod === 'GET') {
                const rows = await sql`
                    SELECT 
                        id, 
                        pro_id as "proId", 
                        pro_name as "proName", 
                        pro_photo as "proPhoto", 
                        pro_area as "proArea", 
                        project_title as "projectTitle", 
                        project_desc as "projectDesc", 
                        TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", 
                        status, 
                        created_at as "createdAt"
                    FROM hirings
                    ORDER BY created_at DESC;
                `;
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(rows)
                };
            }

            if (event.httpMethod === 'POST') {
                const data = JSON.parse(event.body || '{}');
                const rawHireId = data.id || `hire_${Date.now()}`;
                const hireId = sanitizeInput(rawHireId, 100);
                const proId = sanitizeInput(data.proId, 100);
                const proName = sanitizeInput(data.proName || '', 100);
                const proPhoto = sanitizeInput(data.proPhoto || '', 500);
                const proArea = sanitizeInput(data.proArea || '', 50);
                const projectTitle = sanitizeInput(data.projectTitle || 'Proyecto', 150);
                const projectDesc = sanitizeInput(data.projectDesc || '', 1000);
                const rawDate = data.startDate || new Date().toISOString().split('T')[0];
                const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : new Date().toISOString().split('T')[0];
                const validStatus = ['in-progress', 'completed', 'cancelled'].includes(data.status) ? data.status : 'in-progress';

                await sql`
                    INSERT INTO hirings (id, pro_id, pro_name, pro_photo, pro_area, project_title, project_desc, start_date, status)
                    VALUES (
                        ${hireId},
                        ${proId},
                        ${proName},
                        ${proPhoto},
                        ${proArea},
                        ${projectTitle},
                        ${projectDesc},
                        ${validDate}::date,
                        ${validStatus}
                    );
                `;

                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: true, id: hireId })
                };
            }

            if (event.httpMethod === 'PUT') {
                const targetId = sanitizeInput(id || JSON.parse(event.body || '{}').id || '', 100);
                const data = JSON.parse(event.body || '{}');
                const newStatus = ['in-progress', 'completed', 'cancelled'].includes(data.status) ? data.status : null;

                if (!targetId || !newStatus) {
                    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Parámetros inválidos' }) };
                }

                await sql`
                    UPDATE hirings SET
                        status = ${newStatus}
                    WHERE id = ${targetId};
                `;

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ success: true, id: targetId })
                };
            }
        }

        // --- VOTOS / INTERACCIONES ---
        if (resource === 'votes') {
            // Asegurar que exista la tabla specialist_votes
            await sql`
                CREATE TABLE IF NOT EXISTS specialist_votes (
                    id SERIAL PRIMARY KEY,
                    pro_id VARCHAR(100) NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
                    session_id VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    CONSTRAINT unique_pro_session_vote UNIQUE (pro_id, session_id)
                );
            `;

            // GET /api/votes?sessionId=xyz -> devuelve lista de pro_ids votados
            if (event.httpMethod === 'GET') {
                const sessionId = event.queryStringParameters && event.queryStringParameters.sessionId;
                if (!sessionId) {
                    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify([]) };
                }
                const rows = await sql`
                    SELECT pro_id as "proId" FROM specialist_votes WHERE session_id = ${sessionId};
                `;
                const votedIds = rows.map(r => r.proId);
                return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(votedIds) };
            }

            // POST /api/votes -> { proId: '...', sessionId: '...' }
            if (event.httpMethod === 'POST') {
                const data = JSON.parse(event.body || '{}');
                const proId = typeof data.proId === 'string' ? sanitizeInput(data.proId, 100) : '';
                const sessionId = typeof data.sessionId === 'string' ? sanitizeInput(data.sessionId, 100) : '';

                const safeIdRegex = /^[a-zA-Z0-9_\-]{1,100}$/;
                if (!proId || !sessionId || !safeIdRegex.test(proId) || !safeIdRegex.test(sessionId)) {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: JSON.stringify({ success: false, message: 'Parámetros proId o sessionId inválidos' })
                    };
                }

                // Verificar si ya existe el voto
                const existing = await sql`
                    SELECT id FROM specialist_votes 
                    WHERE pro_id = ${proId} AND session_id = ${sessionId};
                `;

                if (existing.length > 0) {
                    // Ya votó
                    const countRow = await sql`
                        SELECT COALESCE(interacciones, 0) as "interacciones" FROM professionals WHERE id = ${proId};
                    `;
                    const currentInteractions = countRow.length > 0 ? countRow[0].interacciones : 0;
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            yaVotado: true,
                            interacciones: currentInteractions,
                            message: 'Ya votaste por este emprendimiento'
                        })
                    };
                }

                // Insertar voto y asegurar unicidad
                try {
                    await sql`
                        INSERT INTO specialist_votes (pro_id, session_id)
                        VALUES (${proId}, ${sessionId})
                        ON CONFLICT DO NOTHING;
                    `;

                    // Incrementar interacciones del profesional
                    await sql`
                        UPDATE professionals 
                        SET interacciones = COALESCE(interacciones, 0) + 1 
                        WHERE id = ${proId};
                    `;

                    const updated = await sql`
                        SELECT COALESCE(interacciones, 0) as "interacciones" FROM professionals WHERE id = ${proId};
                    `;
                    const newCount = updated.length > 0 ? updated[0].interacciones : 1;

                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: true,
                            yaVotado: false,
                            interacciones: newCount,
                            message: 'Voto registrado exitosamente'
                        })
                    };
                } catch (voteErr) {
                    return {
                        statusCode: 200,
                        headers: corsHeaders,
                        body: JSON.stringify({
                            success: false,
                            yaVotado: true,
                            message: 'Voto duplicado detectado'
                        })
                    };
                }
            }

            // DELETE /api/votes -> { proId: '...', sessionId: '...' } o query params
            if (event.httpMethod === 'DELETE') {
                const queryProId = event.queryStringParameters && event.queryStringParameters.proId;
                const querySessionId = event.queryStringParameters && event.queryStringParameters.sessionId;
                let bodyData = {};
                try {
                    bodyData = JSON.parse(event.body || '{}');
                } catch {
                    bodyData = {};
                }

                const rawProId = queryProId || bodyData.proId;
                const rawSessionId = querySessionId || bodyData.sessionId;

                const proId = typeof rawProId === 'string' ? sanitizeInput(rawProId, 100) : '';
                const sessionId = typeof rawSessionId === 'string' ? sanitizeInput(rawSessionId, 100) : '';
                const safeIdRegex = /^[a-zA-Z0-9_\-]{1,100}$/;

                if (!proId || !sessionId || !safeIdRegex.test(proId) || !safeIdRegex.test(sessionId)) {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: JSON.stringify({ success: false, message: 'Parámetros proId o sessionId inválidos' })
                    };
                }

                // Eliminar voto
                const deleteResult = await sql`
                    DELETE FROM specialist_votes 
                    WHERE pro_id = ${proId} AND session_id = ${sessionId}
                    RETURNING id;
                `;

                // Solo restar si realmente existía el voto
                if (deleteResult.length > 0) {
                    await sql`
                        UPDATE professionals 
                        SET interacciones = GREATEST(0, COALESCE(interacciones, 0) - 1)
                        WHERE id = ${proId};
                    `;
                }

                const countRow = await sql`
                    SELECT COALESCE(interacciones, 0) as "interacciones" FROM professionals WHERE id = ${proId};
                `;
                const newCount = countRow.length > 0 ? countRow[0].interacciones : 0;

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        removed: true,
                        interacciones: newCount,
                        message: 'Voto retirado'
                    })
                };
            }
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Recurso no encontrado' })
        };

    } catch (err) {
        console.error('Error en API Neon:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: err.message })
        };
    }
}
