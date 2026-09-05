# Movimiento de la asesoría

Se usa GSAP 3.15 con ScrollTrigger, Lenis 1.3 y Motion 13. Las versiones resueltas están fijadas en `package-lock.json`.

- **GSAP:** entrada por líneas del titular, revelado de fotos, dibujo de la ruta SVG, apariciones escalonadas, desplazamiento continuo de la banda tipográfica, progreso de lectura, avance por los tres pasos, botones magnéticos e inclinación/reflejo de la tarjeta.
- **Lenis:** desplazamiento suave en dispositivos con ratón, desde 900 px. Se conecta al reloj de GSAP y a ScrollTrigger. En móvil se conserva el scroll nativo.
- **Motion:** entrada y salida del contenido de los temas, cambio de número y apertura/cierre del menú móvil.

El motor GSAP/Lenis se importa como mejora del contenido ya renderizado. No se descarga para las páginas de reserva ni cuando los efectos están desactivados. Cada montaje crea su propio contexto; al salir de la página, cambiar el tamaño o pausar se eliminan las animaciones, observadores, eventos y la instancia de Lenis.

La preferencia de movimiento reducido del dispositivo se respeta y se puede pausar todo desde la banda o el pie de página. La pausa se conserva entre las rutas durante la sesión de navegación. No se impide el scroll, no se captura el cursor ni se obliga a esperar una animación para reservar. Sin JavaScript, la información y los enlaces siguen visibles.

Las fotografías se desplazan dentro de marcos recortados, con escala suficiente para no mostrar sus bordes. No se anima el importe de $70 para que siempre sea legible y exacto.

## Documentación consultada

Validación: compilación de producción y 87 pruebas existentes correctas; revisión en navegador de portada, temas por teclado, pausa/reanudación, menú móvil y Escape, preguntas frecuentes y acceso al calendario. Se comprobó que Lenis se desmonta al entrar en la reserva o pasar a móvil, y que la tarjeta vuelve a su inclinación base al cambiar de tamaño. Sin reservas ni cobros reales durante la verificación.

- [GSAP: matchMedia y limpieza de contextos](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>)
- [GSAP: ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Lenis: integración con GSAP, anclas y opciones](https://github.com/darkroomengineering/lenis)
- [Motion: AnimatePresence](https://motion.dev/docs/react-animate-presence)
