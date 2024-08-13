import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

import { useState } from "react";
import { createProductCollection } from "../../server/models/productCollection";
import {
  Button,
  Card,
  LegacyStack,
  List,
  Page,
  Spinner,
  Tag,
  Text,
  Thumbnail,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request); // Ensure the request is authenticated

    const response = await admin.graphql(
      `#graphql
      query {
        products(first: 5) {
          edges {
            node {
              id
              title
              handle
              descriptionHtml
              tags
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    sku
                    availableForSale
                  }
                }
              }
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
              publishedAt
            }
          }
        }
      }`,
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("GraphQL Response Data:", data);

    if (
      !data ||
      !data.data ||
      !data.data.products ||
      !data.data.products.edges
    ) {
      throw new Error("Failed to fetch products");
    }

    return json({ products: data.data.products.edges });
  } catch (error) {
    console.error("Error fetching products:", error);
    return json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 },
    );
  }
};

// create action for post data or send data to location place

export let action = async ({ request }) => {
  try {
    const formData = new URLSearchParams(await request.text());
    const title = formData.get("title") || "";
    const products = JSON.parse(formData.get("products") || "[]");

  createProductCollection(title, products);

    return redirect("/server/models/productCollection.js");
  } catch (error) {
    console.error("Error saving data:", error);
    return json({ error: "Failed to save data" }, { status: 500 });
  }
};



// Component to display products

export default function AdditionalPage() {
  const { products, error } = useLoaderData();


  // handle click action and send reauqest for sending data to database 

  const handleSaveData = async () => {
    try {
      const response = await fetch("./server/models/productCollection.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          title: "My Product Collection",
          products: JSON.stringify(products),
        }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Save Data Response:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      // Redirect or show a success message
      window.location.href = "/server/models/productCollection.js";
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };


  // Handle error state
  if (error) {
    return (
      <Page>
        <TitleBar title="Error" />
        <Text variant="headingMd" as="h2">
          Error: {error}
        </Text>
      </Page>
    );
  }

  // Handle loading and empty states
  if (!products) {
    return (
      <Page>
        <TitleBar title="Loading" />
        <Spinner />
      </Page>
    );
  }

  if (products.length === 0) {
    return (
      <Page>
        <TitleBar title="No Products" />
        <Text variant="bodyMd">No products found.</Text>
      </Page>
    );
  }

  // handle Save data to database
  // src/routes/collections/index.tsx

  return (
    <Page>
      <TitleBar title="Product List" />
      <Card title="Products" sectioned>
        <List>
          {products.map(({ node }) => (
            <List.Item key={node.id}>
              <LegacyStack vertical>
                {node.images.edges.length > 0 && (
                  <Thumbnail
                    source={node.images.edges[0].node.url}
                    alt={node.images.edges[0].node.altText || "Product image"}
                  />
                )}

                <Text as="h3" variant="headingMd">
                  {node.title} ({node.handle})
                </Text>

                <Text as="p" variant="bodyMd">
                  Description:{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: node.descriptionHtml }}
                  />
                </Text>

                <Text as="p" variant="bodyMd">
                  publice Date:{" "}
                  <span
                    dangerouslySetInnerHTML={{ __html: node.publishedAt }}
                  />
                </Text>

                <LegacyStack>
                  {node.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </LegacyStack>
              </LegacyStack>
            </List.Item>
          ))}
        </List>
      </Card>

      <Button onClick={() => handleSaveData(products)}>
        {" "}
        Save Data to Database{" "}
      </Button>
    </Page>
  );
}
