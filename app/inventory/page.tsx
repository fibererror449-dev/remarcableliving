import type { Metadata } from "next";
import { listImportedInventory } from "../../lib/inventory";
import InventoryClient from "./InventoryClient";

export const metadata: Metadata = {
  title: "Available Bangkok rental inventory | REMARCABLE LIVING",
  description: "Browse currently available rental units imported from the supplied inventory, with source-linked photos where provided.",
};

export default async function InventoryPage() {
  const units = await listImportedInventory();
  return <InventoryClient units={units} />;
}
