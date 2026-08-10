import { getCommunityStats } from '@/platform/community';
import {
  getRouteI18n,
  type LocaleRouteParams,
} from '@/platform/i18n/get-route-i18n';
import { resolveLocaleParam } from '@/platform/i18n/resolve-locale-param';
import {
  buildBreadcrumbListJsonLd,
  buildRouteMetadata,
  JsonLd,
} from '@/platform/seo';
import { Menu } from '@/sections/menu';
import { WhyDiexEditorials } from '@/sections/why-diex-editorial';
import { WhyDiexHero } from '@/sections/why-diex-hero';
import { WhyDiexMarquee } from '@/sections/why-diex-marquee';
import { WhyDiexSignoff } from '@/sections/why-diex-signoff';

export const generateMetadata = buildRouteMetadata('whyDiex');

export default async function WhyDiexPage({
  params,
}: {
  params: Promise<LocaleRouteParams>;
}) {
  const [, communityStats] = await Promise.all([
    getRouteI18n(params),
    getCommunityStats(),
  ]);
  const locale = resolveLocaleParam((await params).locale);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbListJsonLd(
          [
            { name: 'Home', path: '/' },
            { name: 'Why Diex', path: '/why-diex' },
          ],
          locale,
        )}
      />
      <Menu communityStats={communityStats} scheme="dark" />
      <main>
        <WhyDiexHero />
        <WhyDiexEditorials />
        <WhyDiexMarquee />
        <WhyDiexSignoff />
      </main>
    </>
  );
}
