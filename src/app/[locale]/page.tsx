// page
import { Usable, use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import VideoScroller from '@/components/VideoScroller';
import { Metadata } from 'next';
export const runtime = 'edge';

// --- Types ---
type PageParams = {
  locale: string;
};

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  // ต้อง await params
  const resolvedParams = await params; 
  const { locale } = resolvedParams;

  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    title: t('app_title'),
    description: t('app_description'),
    icons: { icon: '/favicon.ico' },
    openGraph: {
      title: t('og_title'),
      description: t('og_description'),
      url: t('og_url'),
      images: [t('og_image')],
      type: 'website',
    },
    twitter: {
      title: t('twitter_title'),
      description: t('twitter_description'),
      card: 'summary_large_image',
      images: [t('twitter_image')],
    },
    metadataBase: new URL(t('jsonld_url')),
  };
}


export default function IndexPage({ params }: { params: Usable<unknown> }) {
  const { locale } = use(params) as any;
  // Enable static rendering
  setRequestLocale(locale);
  //const t = useTranslations('HomePage');
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Video Section */}
      <VideoScroller />
    </div>
  )
}
