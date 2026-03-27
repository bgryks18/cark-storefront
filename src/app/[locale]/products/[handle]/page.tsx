import { Suspense } from 'react';

import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import DOMPurify from 'isomorphic-dompurify';

import { flattenConnection } from '@/lib/shopify/normalize';
import { getProduct, getRecommendedProducts } from '@/lib/shopify/queries/product';

import { ProductForm } from '@/components/product/ProductForm';
import { ProductGallery } from '@/components/product/ProductGallery';
import { Container } from '@/components/ui/Container';
import { PageBreadcrumb } from '@/components/ui/PageBreadcrumb';
import { ProductCard, ProductCardSkeleton } from '@/components/ui/ProductCard';

interface ProductPageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { locale, handle } = await params;
  const product = await getProduct(handle, locale);
  if (!product) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const title = product.seo?.title ?? product.title;
  const description = product.seo?.description ?? product.description;
  const canonicalPath = `/products/${handle}`;
  const image = product.featuredImage;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}${locale === 'en' ? '/en' : ''}${canonicalPath}`,
      languages: {
        tr: `${siteUrl}${canonicalPath}`,
        en: `${siteUrl}/en${canonicalPath}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${locale === 'en' ? '/en' : ''}${canonicalPath}`,
      type: 'article',
      ...(image && {
        images: [
          {
            url: image.url,
            width: image.width ?? 1200,
            height: image.height ?? 630,
            alt: image.altText ?? title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image && { images: [image.url] }),
    },
  };
}

async function RelatedProducts({ productId }: { productId: string }) {
  const products = await getRecommendedProducts(productId, 4);
  if (products.length === 0) return null;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

function RelatedProductsSkeleton() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, handle } = await params;

  const [product, t] = await Promise.all([
    getProduct(handle, locale),
    getTranslations({ locale, namespace: 'product' }),
  ]);

  if (!product) notFound();

  const images = flattenConnection(product.images);
  const variants = flattenConnection(product.variants);
  const allImages = product.featuredImage
    ? [product.featuredImage, ...images.filter((img) => img.url !== product.featuredImage?.url)]
    : images;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.carkzimpara.com';
  const canonicalUrl = `${siteUrl}${locale === 'en' ? '/en' : ''}/products/${handle}`;
  const price = product.priceRange.minVariantPrice;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    sku: variants[0]?.sku || undefined,
    brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
    image: product.featuredImage?.url,
    url: canonicalUrl,
    offers: {
      '@type': 'Offer',
      priceCurrency: price.currencyCode,
      price: price.amount,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('breadcrumbHome'),
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('breadcrumbProducts'),
        item: `${siteUrl}${locale === 'en' ? '/en' : ''}/collections`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <section className="py-8 sm:py-12">
        <Container>
          <PageBreadcrumb
            crumbs={[
              { label: t('breadcrumbHome'), href: '/' },
              { label: t('breadcrumbProducts'), href: '/collections' },
            ]}
            title={product.title}
          />

          {/* Ürün detay grid */}
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Sol: Galeri */}
            <ProductGallery images={allImages} title={product.title} />

            {/* Sağ: Bilgi + form */}
            <div className="flex flex-col gap-4">
              {product.vendor && (
                <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  {product.vendor}
                </p>
              )}
              <p className="text-2xl font-bold text-black-dark sm:text-3xl">{product.title}</p>

              <ProductForm
                options={product.options}
                variants={variants}
                minPrice={product.priceRange.minVariantPrice}
                availableForSale={product.availableForSale}
                addToCartLabel={t('addToCart')}
                outOfStockLabel={t('outOfStock')}
                quantityLabel={t('quantity')}
              />

              {product.descriptionHtml && (
                <div className="border-t border-border pt-6">
                  <h2 className="mb-3 font-semibold text-text-base">{t('description')}</h2>
                  <div
                    className="prose prose-sm max-w-none text-text-muted"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(product.descriptionHtml),
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Benzer ürünler */}
      <section className="bg-surface py-10 sm:py-14">
        <Container>
          <h2 className="mb-6 text-xl font-bold text-black-dark sm:text-2xl">
            {t('relatedProducts')}
          </h2>
          <Suspense fallback={<RelatedProductsSkeleton />}>
            <RelatedProducts productId={product.id} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
