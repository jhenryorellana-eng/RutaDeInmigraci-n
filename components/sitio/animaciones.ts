import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/** All effects belong to this page and are reverted on navigation or pause. */
export function iniciarAnimaciones(root: HTMLElement) {
  const media = gsap.matchMedia(root);
  const seleccionar = <T extends Element = HTMLElement>(selector: string) =>
    Array.from(root.querySelectorAll<T>(selector));
  let vivo = true;
  const esMovil = () => window.matchMedia("(max-width: 760px)").matches;

  media.add("(prefers-reduced-motion: no-preference)", () => {
    const inicio = gsap.timeline({
      defaults: { ease: "power3.out", duration: 1 },
    });
    const lineas = seleccionar(".hero-word");
    const titulo = lineas.length
      ? lineas
      : seleccionar(".about-copy h1, .service-hero h1");
    // Don't replay the hero when returning to an anchor or restoring scroll.
    if (window.scrollY < 100) {
      inicio.from(titulo, {
        yPercent: lineas.length ? 105 : 20,
        opacity: lineas.length ? 1 : 0,
        rotation: 3,
        stagger: esMovil() ? 0.06 : 0.11,
        duration: esMovil() ? 0.55 : 1.15,
        clearProps: "transform,opacity",
      });
      const detalles = seleccionar(
        ".hero-title > .eyebrow, .hero-copy > p, .hero-actions, .about-copy > .eyebrow, .about-copy > p, .service-hero .lead",
      );
      if (detalles.length)
        inicio.from(
          detalles,
          {
            y: esMovil() ? 12 : 22,
            opacity: 0,
            stagger: 0.07,
            duration: esMovil() ? 0.4 : 1,
            clearProps: "transform,opacity",
          },
          0.1,
        );
      const fotos = seleccionar(".hero-image, .about-image");
      if (fotos.length)
        inicio.from(
          fotos,
          {
            clipPath: "inset(12% 0 12% 100%)",
            duration: esMovil() ? 0.6 : 1.35,
            clearProps: "clipPath",
          },
          0.05,
        );
      const tarjetas = seleccionar(
        ".hero-boletos .boleto, .service-boletos .boleto",
      );
      if (tarjetas.length)
        inicio.from(
          tarjetas,
          {
            opacity: 0,
            y: esMovil() ? 14 : 34,
            clipPath: "inset(0 0 100% 0)",
            duration: esMovil() ? 0.45 : 0.9,
            stagger: 0.12,
            // The entrance moves `.boleto`; the pointer tilt moves the
            // `.boleto-cara` inside it, so neither undoes the other.
            clearProps: "clipPath,opacity,transform",
          },
          esMovil() ? 0.25 : 0.65,
        );
    }

    seleccionar<SVGPathElement>(".route-art-path").forEach((path) => {
      const longitud = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDasharray: longitud, strokeDashoffset: longitud },
        {
          strokeDashoffset: 0,
          duration: 2.4,
          ease: "power2.inOut",
          delay: 0.2,
        },
      );
    });

    seleccionar(
      ".section-heading, .feature-copy, .journey-heading, .about-statement .site-container, .includes-section > div, .how-section h2, .faq-section > div:first-child, .closing-overline, .closing-bottom",
    ).forEach((element) => {
      gsap.from(element, {
        y: esMovil() ? 20 : 46,
        opacity: 0.15,
        duration: esMovil() ? 0.5 : 0.95,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: element, start: "top 91%", once: true },
      });
    });
    seleccionar(
      ".values-list, .how-grid, .includes-section ul, .topic-tabs, .faq-list",
    ).forEach((group) => {
      gsap.from(Array.from(group.children), {
        y: 24,
        opacity: 0.25,
        duration: esMovil() ? 0.4 : 0.75,
        stagger: 0.09,
        ease: "power2.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: group, start: "top 88%", once: true },
      });
    });

    // The two tickets are dealt onto the table, then stamped.
    seleccionar(".audiencias-boletos").forEach((grupo) => {
      const disparo = { trigger: grupo, start: "top 85%", once: true };
      gsap.from(grupo.querySelectorAll(".boleto"), {
        y: esMovil() ? 40 : 90,
        rotation: (i: number) => (i % 2 ? 7 : -7),
        opacity: 0,
        duration: esMovil() ? 0.6 : 1.1,
        stagger: 0.16,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: disparo,
      });
      gsap.from(grupo.querySelectorAll(".boleto-sello"), {
        scale: 1.9,
        rotation: -40,
        opacity: 0,
        transformOrigin: "50% 50%",
        duration: 0.7,
        delay: esMovil() ? 0.3 : 0.6,
        stagger: 0.16,
        ease: "back.out(2.2)",
        clearProps: "transform,opacity",
        scrollTrigger: disparo,
      });
    });

    // Henry's signature writes itself from left to right.
    seleccionar(".henry-signature").forEach((firma) => {
      gsap.fromTo(
        firma,
        { clipPath: "inset(-20% 100% -20% 0)" },
        {
          clipPath: "inset(-20% 0% -20% 0)",
          duration: 1.8,
          ease: "power2.inOut",
          clearProps: "clipPath",
          scrollTrigger: { trigger: firma, start: "top 92%", once: true },
        },
      );
    });

    const letras = seleccionar(".closing-link .letra");
    if (letras.length)
      gsap.from(letras, {
        yPercent: 60,
        rotation: 6,
        opacity: 0,
        stagger: 0.035,
        duration: esMovil() ? 0.5 : 0.8,
        ease: "power3.out",
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: letras[0], start: "top 90%", once: true },
      });

    // The statement on /henry lights up word by word as it is read.
    const palabras = seleccionar(".about-statement h2 .palabra");
    if (palabras.length)
      gsap.fromTo(
        palabras,
        { opacity: 0.16 },
        {
          opacity: 1,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: {
            trigger: palabras[0].closest("h2"),
            start: "top 82%",
            end: "bottom 46%",
            scrub: 0.6,
          },
        },
      );

    const progress = root.querySelector(".reading-progress span");
    if (progress)
      gsap.fromTo(
        progress,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.2,
          },
        },
      );

    const track = root.querySelector(".kinetic-track");
    if (track) {
      const cinta = gsap.to(track, {
        xPercent: -50,
        duration: 36,
        repeat: -1,
        ease: "none",
        paused: true,
      });
      ScrollTrigger.create({
        trigger: track.parentElement,
        start: "top bottom",
        end: "bottom top",
        onToggle: ({ isActive }) => {
          if (isActive) cinta.play();
          else cinta.pause();
        },
      });
    }

    seleccionar(".journey-step").forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 55%",
        end: "bottom 55%",
        toggleClass: "is-current",
      });
    });
    const rail = root.querySelector(".journey-rail span");
    if (rail)
      gsap.fromTo(
        rail,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".journey-steps",
            start: "top 65%",
            end: "bottom 55%",
            scrub: 0.4,
          },
        },
      );

    // Refresh only when page geometry can actually change (fonts, images, FAQ).
    const refresh = () => {
      if (vivo) ScrollTrigger.refresh();
    };
    const images = seleccionar<HTMLImageElement>("img").filter(
      (img) => !img.complete,
    );
    images.forEach((img) =>
      img.addEventListener("load", refresh, { once: true }),
    );
    const details = seleccionar<HTMLDetailsElement>("details");
    details.forEach((detail) => detail.addEventListener("toggle", refresh));
    document.fonts.ready.then(refresh);
    const resize = new ResizeObserver(() => ScrollTrigger.refresh());
    resize.observe(root);
    return () => {
      images.forEach((img) => img.removeEventListener("load", refresh));
      details.forEach((detail) =>
        detail.removeEventListener("toggle", refresh),
      );
      resize.disconnect();
      seleccionar(".journey-step").forEach((step) =>
        step.classList.remove("is-current"),
      );
    };
  });

  media.add(
    "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
    () => {
      seleccionar(
        ".hero-image, .feature-photo, .about-image, .service-wide-photo",
      ).forEach((frame) => {
        const photo = frame.querySelector("img");
        if (!photo) return;
        const portada = frame.classList.contains("hero-image");
        gsap.fromTo(
          photo,
          { yPercent: portada ? -1 : -3, scale: portada ? 1.07 : 1.1 },
          {
            yPercent: portada ? 1 : 3,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.75,
            },
          },
        );
      });
      const art = root.querySelector(".route-art");
      if (art)
        gsap.to(art, {
          y: 160,
          rotation: 8,
          ease: "none",
          scrollTrigger: {
            trigger: ".home-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
    },
  );

  media.add(
    "(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    () => {
      const lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -115 },
        prevent: (node) =>
          node.hasAttribute("data-lenis-prevent") ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(node.tagName),
      });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);

      const disposers: (() => void)[] = [];
      seleccionar<HTMLElement>(
        ".route-button, .nav-reserve, .closing-link > .closing-arrow",
      ).forEach((button) => {
        const x = gsap.quickTo(button, "x", {
          duration: 0.45,
          ease: "power3.out",
        });
        const y = gsap.quickTo(button, "y", {
          duration: 0.45,
          ease: "power3.out",
        });
        const move = (event: PointerEvent) => {
          const bounds = button.getBoundingClientRect();
          x((event.clientX - bounds.left - bounds.width / 2) * 0.13);
          y((event.clientY - bounds.top - bounds.height / 2) * 0.18);
        };
        const leave = () => {
          x(0);
          y(0);
        };
        button.addEventListener("pointermove", move);
        button.addEventListener("pointerleave", leave);
        button.addEventListener("blur", leave);
        disposers.push(() => {
          button.removeEventListener("pointermove", move);
          button.removeEventListener("pointerleave", leave);
          button.removeEventListener("blur", leave);
        });
      });

      seleccionar<HTMLElement>(".boleto").forEach(
        (card) => {
          const cara = card.querySelector<HTMLElement>(".boleto-cara");
          if (!cara) return;
          const fuerza = card.classList.contains("is-grande") ? 7 : 12;
          const x = gsap.quickTo(cara, "rotationX", {
            duration: 0.6,
            ease: "power3.out",
          });
          const y = gsap.quickTo(cara, "rotationY", {
            duration: 0.6,
            ease: "power3.out",
          });
          const shineX = gsap.quickTo(cara, "--shine-x", { duration: 0.4 });
          const shineY = gsap.quickTo(cara, "--shine-y", { duration: 0.4 });
          gsap.set(cara, { transformPerspective: 900 });
          const move = (event: PointerEvent) => {
            const bounds = card.getBoundingClientRect();
            const dx = (event.clientX - bounds.left) / bounds.width;
            const dy = (event.clientY - bounds.top) / bounds.height;
            x((0.5 - dy) * fuerza);
            y((dx - 0.5) * fuerza);
            shineX(dx * 100);
            shineY(dy * 100);
          };
          const leave = () => {
            x(0);
            y(0);
            shineX(30);
            shineY(0);
          };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          disposers.push(() => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          });
        },
      );
      return () => {
        disposers.forEach((dispose) => dispose());
        gsap.ticker.remove(tick);
        lenis.off("scroll", ScrollTrigger.update);
        lenis.destroy();
      };
    },
  );

  return () => {
    vivo = false;
    media.revert();
  };
}
