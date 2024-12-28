"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  // Transform amount value in cents to eliminate JavaScript floating-point erros and ansure greater accurancy
  const amountInCents = amount * 100;

  // create a new date with the format "YYYY-MM-DD" for the invoice's creation date.
  const date = new Date().toISOString().split("T")[0];

  //creating an SQL query to insert the new invoice into the database

  await sql`
    insert into invoices (customer_id, amount, status, date)
    values (${customerId}, ${amountInCents}, ${status}, ${date})
  
  `;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  await sql`
    update invoices
    set customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    where id = ${id}
`;

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}
