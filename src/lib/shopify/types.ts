// ─── Temel tipler ────────────────────────────────────────────────────────────

export interface ShopifyError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, unknown>;
}

export interface ShopifyResponse<T> {
  data: T;
  errors?: ShopifyError[];
}

// ─── Para birimi ──────────────────────────────────────────────────────────────

export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface PriceRange {
  minVariantPrice: MoneyV2;
  maxVariantPrice: MoneyV2;
}

// ─── Görsel ───────────────────────────────────────────────────────────────────

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

// ─── SEO ──────────────────────────────────────────────────────────────────────

export interface SEO {
  title: string | null;
  description: string | null;
}

// ─── Sayfalama ───────────────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: { node: T; cursor: string }[];
  pageInfo: PageInfo;
}

// ─── Ürün ────────────────────────────────────────────────────────────────────

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  quantityRule: { maximum: number | null; minimum: number; increment: number } | null;
  selectedOptions: SelectedOption[];
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  image: ShopifyImage | null;
  sku: string | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  availableForSale: boolean;
  tags: string[];
  vendor: string;
  productType: string;
  publishedAt: string;
  seo: SEO;
  priceRange: PriceRange;
  compareAtPriceRange: PriceRange;
  featuredImage: ShopifyImage | null;
  images: Connection<ShopifyImage>;
  options: ProductOption[];
  variants: Connection<ProductVariant>;
}

// ─── Collection (Shopify) / UI: kategori ───────────────────────────────────

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  seo: SEO;
  image: ShopifyImage | null;
  products: Connection<ShopifyProduct>;
  updatedAt: string;
}

// ─── Sepet ───────────────────────────────────────────────────────────────────

export interface CartLineItem {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    sku: string | null;
    quantityAvailable: number | null;
    quantityRule: { maximum: number | null } | null;
    selectedOptions: SelectedOption[];
    product: Pick<ShopifyProduct, 'id' | 'handle' | 'title' | 'featuredImage'>;
  };
  cost: {
    totalAmount: MoneyV2;
    amountPerQuantity: MoneyV2;
    compareAtAmountPerQuantity: MoneyV2 | null;
  };
  discountAllocations: Array<{ discountedAmount: MoneyV2 }>;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: Connection<CartLineItem>;
  cost: {
    subtotalAmount: MoneyV2;
    totalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
  };
  discountCodes: Array<{ applicable: boolean; code: string }>;
  buyerIdentity?: {
    email: string | null;
    customer: { id: string } | null;
  };
}

// ─── Müşteri ─────────────────────────────────────────────────────────────────

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  phone: string | null;
  acceptsMarketing: boolean;
  createdAt: string;
  defaultAddress: ShopifyAddress | null;
  addresses: Connection<ShopifyAddress>;
  orders: Connection<ShopifyOrder>;
}

export interface ShopifyAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  formatted: string[];
}

export interface ShopifyOrder {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: MoneyV2;
  subtotalPrice: MoneyV2 | null;
  totalShippingPrice: MoneyV2;
  lineItems: Connection<OrderLineItem>;
}

export interface OrderLineItem {
  title: string;
  quantity: number;
  variant: Pick<ProductVariant, 'id' | 'title' | 'price' | 'image'> | null;
}

// ─── Arama ───────────────────────────────────────────────────────────────────

export interface PredictiveSearchResult {
  products: ShopifyProduct[];
  collections: Pick<ShopifyCollection, 'id' | 'handle' | 'title' | 'image'>[];
  queries: { text: string; styledText: string }[];
}

// ─── API input tipleri ───────────────────────────────────────────────────────

export type SortKey =
  | 'MANUAL'
  | 'BEST_SELLING'
  | 'TITLE'
  | 'PRICE'
  | 'CREATED'
  | 'RELEVANCE';

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface CustomerCreateInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptsMarketing?: boolean;
}

export interface CustomerUserError {
  field: string[] | null;
  message: string;
  code: string;
}
