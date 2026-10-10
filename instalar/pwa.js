// Inyectar estilos para animar el botón
const pwaStyle = document.createElement('style');
pwaStyle.textContent = `
  @keyframes pwaPulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.7); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0, 242, 254, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 242, 254, 0); }
  }
  #pwa-install-button {
    position: fixed;
    bottom: 25px;
    right: 25px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%);
    color: white;
    font-weight: bold;
    border: none;
    border-radius: 50px;
    font-size: 16px;
    cursor: pointer;
    display: block;
    z-index: 1000;
    box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);
    animation: pwaPulse 2s infinite;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  #pwa-install-button:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 8px 25px rgba(0, 242, 254, 0.6);
  }
`;
document.head.appendChild(pwaStyle);

// Configuración del botón de instalación
const installButton = document.createElement('button');
installButton.id = 'pwa-install-button';
installButton.innerHTML = `
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
  Instalar App
`;
document.body.appendChild(installButton);

// Manejo del evento de instalación
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Evento beforeinstallprompt recibido');
  
  // 1. Prevenir el banner automático
  e.preventDefault();
  
  // 2. Guardar el evento para usarlo luego
  deferredPrompt = e;
  
  // 3. Mostrar NUESTRO botón de instalación de forma permanente hasta que se instale
  installButton.style.display = 'flex';
});

// Manejo del clic en nuestro botón
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) {
    alert("⚠️ ATENCIÓN ⚠️\n\nPara poder INSTALAR la app, debes abrir este archivo a través de un SERVIDOR LOCAL (ej. Live Server en VSCode) o subirlo a un HOSTING en internet.\n\nPor seguridad, los navegadores (Chrome/Safari) bloquean la instalación si simplemente abres el archivo index.html con doble clic.");
    return;
  }
  
  console.log('[PWA] Mostrando diálogo de instalación');
  
  try {
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario decida
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`[PWA] Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
    
    if (outcome === 'accepted') {
      installButton.textContent = '✓ ¡Instalada!';
      setTimeout(() => {
        installButton.style.display = 'none';
      }, 2000);
    }
  } catch (error) {
    console.error('[PWA] Error al mostrar el prompt:', error);
  } finally {
    deferredPrompt = null;
    installButton.style.display = 'none';
  }
});

// Registro del Service Worker (sin cambios)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('[PWA] Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.error('[PWA] Error al registrar Service Worker:', error);
      });
  });
}

// Detección de iOS (para mostrar instrucciones especiales)
if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
  const iosBanner = document.createElement('div');
  iosBanner.innerHTML = `
    <div style="
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: #f8f9fa;
      text-align: center;
      border-top: 1px solid #ddd;
      z-index: 999;
    ">
      <p style="margin: 0;">📱 Para instalar: Toca <strong>Compartir</strong> → <strong>Añadir a Inicio</strong></p>
    </div>
  `;
  document.body.appendChild(iosBanner);
}