// Tekrar kullanılan GraphQL fragment'leri
// Her query dosyasında import edilerek kullanılır

export const IMAGE_FRAGMENT = `#graphql
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = `#graphql
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

export const SEO_FRAGMENT = `#graphql
  fragment SeoFields on SEO {
    title
    description
  }
`;

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariantFields on ProductVariant {
    id
    title
    availableForSale
    quantityAvailable
    quantityRule { maximum minimum increment }
    sku
    selectedOptions {
      name
      value
    }
    price {
      ...MoneyFields
    }
    compareAtPrice {
      ...MoneyFields
    }
    image {
      ...ImageFields
    }
  }
`;

export const PRODUCT_CARD_FRAGMENT = `#graphql
  fragment ProductCardFields on Product {
    id
    handle
    title
    availableForSale
    tags
    vendor
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    featuredImage {
      ...ImageFields
    }
    variants(first: 1) {
      edges {
        node {
          id
          availableForSale
          selectedOptions { name value }
          price { ...MoneyFields }
          compareAtPrice { ...MoneyFields }
        }
      }
    }
  }
`;

export const CART_LINE_FRAGMENT = `#graphql
  fragment CartLineFields on CartLine {
    id
    quantity
    merchandise {
      ... on ProductVariant {
        id
        title
        sku
        quantityAvailable
        quantityRule { maximum }
        selectedOptions { name value }
        product {
          id
          handle
          title
          featuredImage { ...ImageFields }
        }
      }
    }
    cost {
      totalAmount { ...MoneyFields }
      amountPerQuantity { ...MoneyFields }
      compareAtAmountPerQuantity { ...MoneyFields }
    }
    discountAllocations {
      discountedAmount { ...MoneyFields }
    }
  }
`;

export const CART_FRAGMENT = `#graphql
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    lines(first: 100) {
      edges {
        cursor
        node { ...CartLineFields }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    cost {
      subtotalAmount { ...MoneyFields }
      totalAmount { ...MoneyFields }
      totalTaxAmount { ...MoneyFields }
    }
    discountCodes {
      applicable
      code
    }
    buyerIdentity {
      email
      customer { id }
    }
  }
  ${CART_LINE_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

export const ADDRESS_FRAGMENT = `#graphql
  fragment AddressFields on MailingAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    country
    zip
    phone
    formatted
  }
`;
