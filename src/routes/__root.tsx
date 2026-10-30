import type {ReactNode} from "react";
import {HeadContent, Outlet, Scripts, createRootRoute} from "@tanstack/react-router";
import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useEffect, useState} from "react";
import {PLATFORM_META, PLATFORM_SCRIPTS} from "@/platform/scripts.gen";
import {HMR_CLIENT} from "@/platform/dev-hmr";
import {RouteScrollToTop, ScrollToTopButton} from "@/components/ScrollToTop";
import HolidayEffects from "@/components/HolidayEffects";
import {applyTheme, loadTheme, useAppliedTheme} from "@/hooks/useTheme";
import NotFound from "@/pages/NotFound";
import appCss from "@/index.css?url";

const TITLE = "ProFiX — IT-сервис в Якутске: ремонт компьютеров, 1С, видеонаблюдение";
const DESCRIPTION =
    "ProFiX в Якутске: ремонт компьютеров и ноутбуков, установка и обслуживание 1С, видеонаблюдение, настройка сетей, заправка картриджей. Выезд мастера, гарантия, быстро.";
const OG_TITLE = "ProFiX — IT-сервис в Якутске";
const OG_DESCRIPTION = "Ремонт компьютеров, 1С, видеонаблюдение, настройка сетей в Якутске. Быстро, с гарантией. Выезд мастера.";
const OG_IMAGE = "https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png";

const LD_JSON = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ProFiX",
    "description": "IT-сервис в Якутске: ремонт компьютеров, 1С, видеонаблюдение, настройка сетей",
    "url": "https://it-profix.ru",
    "telephone": "+7-914-000-00-00",
    "email": "727187@it-profix.ru",
    "address": {
        "@type": "PostalAddress",
        "addressLocality": "Якутск",
        "addressRegion": "Республика Саха (Якутия)",
        "addressCountry": "RU",
    },
    "areaServed": "Якутск",
    "serviceType": ["Ремонт компьютеров", "1С", "Видеонаблюдение", "Настройка сетей", "Заправка картриджей"],
};

const SW_SCRIPT = `if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js");
  });
}`;

const METRIKA_SCRIPT = `(function () {
    var h = location.hostname;
    var isPreview = h.indexOf("preview--") === 0 || h === "localhost" || h === "127.0.0.1";
    if (isPreview) { window.ym = function () {}; return; }

    window.addEventListener("error", function (ev) {
        var src = ev && ev.target && ev.target.src;
        if (src && src.indexOf("mc.yandex.ru") !== -1) {
            ev.stopImmediatePropagation();
            ev.preventDefault();
        }
    }, true);

    (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () {
            (m[i].a = m[i].a || []).push(arguments)
        };
        m[i].l = 1 * new Date();
        for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) {
                return;
            }
        }
        k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, k.onerror = function(){}, a.parentNode.insertBefore(k, a)
    })
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    try {
        ym(101026698, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: true,
            trackHash: true
        });
    } catch (e) {}
})();`;

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {charSet: "utf-8"},
            {httpEquiv: "Cache-Control", content: "no-cache, no-store, must-revalidate"},
            {httpEquiv: "Pragma", content: "no-cache"},
            {httpEquiv: "Expires", content: "0"},
            {name: "viewport", content: "width=device-width, initial-scale=1.0"},
            {title: TITLE},
            {name: "description", content: DESCRIPTION},
            {name: "keywords", content: "ремонт компьютеров Якутск, 1С Якутск, видеонаблюдение Якутск, настройка сети, заправка картриджей, IT-сервис Якутск, ProFiX"},
            {name: "author", content: "ProFiX"},
            {name: "robots", content: "index, follow"},
            {name: "mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-capable", content: "yes"},
            {name: "apple-mobile-web-app-status-bar-style", content: "black-translucent"},
            {name: "apple-mobile-web-app-title", content: "ProFiX"},
            {name: "theme-color", content: "#3ca615"},
            {property: "og:type", content: "website"},
            {property: "og:locale", content: "ru_RU"},
            {property: "og:site_name", content: "ProFiX"},
            {property: "og:title", content: OG_TITLE},
            {property: "og:description", content: OG_DESCRIPTION},
            {property: "og:url", content: "https://it-profix.ru/"},
            {property: "og:image", content: OG_IMAGE},
            {property: "og:image:width", content: "512"},
            {property: "og:image:height", content: "512"},
            {property: "og:image:alt", content: OG_TITLE},
            {name: "twitter:card", content: "summary"},
            {name: "twitter:title", content: OG_TITLE},
            {name: "twitter:description", content: "Ремонт компьютеров, 1С, видеонаблюдение, настройка сетей в Якутске."},
            {name: "twitter:image", content: OG_IMAGE},
            ...PLATFORM_META,
        ],
        links: [
            {rel: "stylesheet", href: appCss},
            {rel: "canonical", href: "https://it-profix.ru/"},
            {rel: "preconnect", href: "https://fonts.googleapis.com"},
            {rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous"},
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;900&family=Oswald:wght@400;500;600;700&display=swap",
            },
            {rel: "icon", type: "image/png", href: OG_IMAGE},
            {rel: "manifest", href: "/manifest.json"},
            {rel: "apple-touch-icon", href: OG_IMAGE},
        ],
        styles: [{children: 'link[rel="icon"]{border-radius:50%}'}],
        // IMPORTANT: DO NOT REMOVE PLATFORM SCRIPTS AND THE DEV HMR CLIENT!
        scripts: [
            ...(import.meta.env.DEV ? [{children: HMR_CLIENT}] : []),
            ...PLATFORM_SCRIPTS,
            {type: "application/ld+json", children: JSON.stringify(LD_JSON)},
            {children: SW_SCRIPT},
            {children: METRIKA_SCRIPT},
        ],
    }),
    component: RootComponent,
    notFoundComponent: NotFound,
});

// Синхронизирует тему с сервером и между вкладками
function ThemeSync() {
    useEffect(() => {
        // Применяем кэшированную тему сразу после загрузки
        applyTheme(loadTheme());
    }, []);
    useAppliedTheme();
    return null;
}

function RootComponent() {
    const [queryClient] = useState(() => new QueryClient());
    return (
        <RootDocument>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <ThemeSync/>
                    <Toaster/>
                    <Sonner/>
                    <HolidayEffects/>
                    <RouteScrollToTop/>
                    <ScrollToTopButton/>
                    <Outlet/>
                </TooltipProvider>
            </QueryClientProvider>
        </RootDocument>
    );
}

function RootDocument({children}: { children: ReactNode }) {
    return (
        <html lang="ru">
        <head>
            <HeadContent/>
        </head>
        <body>
        {children}
        <Scripts/>
        </body>
        </html>
    );
}
