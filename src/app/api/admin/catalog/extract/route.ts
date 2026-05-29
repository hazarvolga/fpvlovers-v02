import { NextRequest, NextResponse } from 'next/server';
import { extractProductsFromMarkdown } from '@/lib/tools/product-catalog-extractor';
import { upsertCrawlerProductCatalog } from '@/lib/tools/product-catalog-store';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export async function POST(req: NextRequest) {
  const body = asRecord(await req.json().catch(() => ({}))) || {};
  const url = asString(body.url);
  const markdown = asString(body.markdown) || asString(body.raw_markdown) || asString(body.text);
  if (!url || !markdown) {
    return NextResponse.json({ error: 'url and markdown are required.' }, { status: 400 });
  }

  const extraction = extractProductsFromMarkdown({
    url,
    markdown,
    sourceName: asString(body.sourceName),
    productTypes: asStringArray(body.productTypes),
    crawledAt: asString(body.crawledAt),
  });

  const write = body.write === true;
  const catalog = write ? upsertCrawlerProductCatalog(extraction.products) : undefined;

  return NextResponse.json({
    write,
    extracted: extraction.products.length,
    rejected: extraction.rejected.length,
    products: extraction.products,
    catalog: catalog ? { products: catalog.products.length, generated_at: catalog.generated_at } : undefined,
  });
}
