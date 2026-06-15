import { readFileSync } from "fs";
import { join } from "path";
import PassportClient from "./PassportClient";

export async function generateStaticParams() {
  try {
    const filePath = join(process.cwd(), "..", "backend", "src", "data", "products.json");
    const products = JSON.parse(readFileSync(filePath, "utf-8"));
    return products.map((p) => ({ id: String(p.id) }));
  } catch {
    return [];
  }
}

export default function PassportPage() {
  return <PassportClient />;
}
