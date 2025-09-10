import { NextIntlClientProvider } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import { setRequestLocale } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";
import Script from "next/script";
export const runtime = 'edge';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default async function LocaleLayout({
  children,
  params
}: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <head>
        <meta
          name="ahrefs-site-verification"
          content="685dec4af0212affd8efbcb1d02cadf34025cdf2d1fc83edf90cd563c2857ffc"
        />

        {/* ✅ Preconnect/DNS Prefetch เพื่อลด latency */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://analytics.ahrefs.com" />
        <link rel="dns-prefetch" href="https://analytics.ahrefs.com" />

        {/* ✅ Google Analytics: afterInteractive ไม่ขวางการเรนเดอร์ */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-W7LWJQZFG8"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-W7LWJQZFG8', { anonymize_ip: true });
          `}
        </Script>

        {/* ✅ JSON-LD: โหลดแบบ non-blocking */}
        <Script
          id="jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Fan18x",
              url: "https://fan18x.com/",
              description: "fan18x - เว็บคลิปโป๊ 18+ รวมทุกแนวเด็ด: คลิปหลุดวัยรุ่น คลิปนักศึกษา ตั้งกล้อง ไลฟ์สด OnlyFans AV ญี่ปุ่น ฝรั่ง คาชุด แตกใน ไม่เซ็นเซอร์ ดูฟรี HD อัปเดตใหม่ทุกวัน",
              inLanguage: "th",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://fan18x.com/",
                "query-input": "required name=fan18x",
              },
            }),
          }}
        />

        {/* ✅ Ahrefs Analytics: ใช้ครั้งเดียว (ลบสคริปต์ inject ที่ซ้ำ) */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          strategy="afterInteractive"
          data-key="rjELZ/zV+7JBR494bQm0gw"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
