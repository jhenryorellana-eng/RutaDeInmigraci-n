# Experiencia móvil

La composición móvil se define en `app/mobile.css` (hasta 760 px), seguida de los ajustes de reserva en `app/reserva-mobile.css`. El escritorio conserva la composición editorial.

- Portada con fotografía sin texto diminuto y precio de $70 en una banda propia.
- Navegación inferior con destinos reales y acceso directo a reservar. Tocar la página actual vuelve arriba. Se respetan las áreas seguras del dispositivo.
- Menú en un diálogo nativo: fondo inerte, foco inicial, cierre por Escape, botón o fondo, restauración del foco y del desplazamiento. Incluye el control de movimiento.
- Temas con tres pestañas compactas, flechas, teclado y gesto horizontal con Motion. El scroll vertical sigue disponible; los enlaces no inician el arrastre. El tema seleccionado se anuncia a lectores de pantalla.
- Pasos como acordeón: el contenido se descubre con un toque y las regiones mantienen identificadores estables.
- Calendario con resumen de precio y duración arriba, puntos de disponibilidad, controles de mes de 44 px y horarios de dos columnas. El desplazamiento contextual se limita a clic/toque; el teclado conserva el foco. La acción inferior sólo es sticky al elegir fecha/hora, no en los campos de contacto o pago.

Las entradas móviles son más breves que en escritorio y respetan la preferencia de movimiento reducido. No se añadieron dependencias ni cambios a las reglas de cobro.

Documentación consultada: [gestos de Motion](https://motion.dev/docs/react-drag) y [diálogo nativo de HTML](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
