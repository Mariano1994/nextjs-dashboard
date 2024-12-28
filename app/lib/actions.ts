"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toast } from "sonner";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

// CREATING NEW INVOICE
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

  try {
    //creating an SQL query to insert the new invoice into the database
    await sql`
      insert into invoices (customer_id, amount, status, date)
      values (${customerId}, ${amountInCents}, ${status}, ${date})

`;
  } catch (error) {
    console.log(error);
    // return {
    //   message: "Databese Error: Failed do Create Invoice.",
    // };
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// UPDATE INVOICE

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
        update invoices
        set customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        where id = ${id}
    `;
  } catch (error) {
    console.log(error);
    // return {
    //   message: "Database Error: Failed to Update Invoice",
    // };
  }

  revalidatePath("/dashboard/invoices");
  // toast.success("Invoice updated successfuly");
  redirect("/dashboard/invoices");
}

// DELETE INVOICE
export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;

    revalidatePath("/dashboard/invoices");
  } catch (error) {
    // return { message: "Database Error: Failed to Delete Invoice" };
    console.log(error);
  }
}
