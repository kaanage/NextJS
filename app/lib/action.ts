'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addInvoice, updateInvoice, deleteInvoiceById } from '@/app/lib/data';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const EditInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
    
  try {
    addInvoice(customerId, amountInCents, status);
  }
  catch (e) {
    return {
      message: 'Database Error: Failed to Create Invoice.' + e,
    };
  }

  revalidatePath('/dashboard/invoices');  // clear this route's cache
  redirect('/dashboard/invoices');
}

// state comes after id due to binding order for the form injection
export async function editInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = EditInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
    
  try {
      updateInvoice(id, customerId, amountInCents, status);
  }
  catch (e) {
    return {
      message: 'Database Error: Failed to Update Invoice.' + e,
    };
  }
  revalidatePath('/dashboard/invoices');  // clear this route's cache
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    deleteInvoiceById(id);
  }
  catch (e) {
    return {
      message: 'Database Error: Failed to Delete Invoice.' + e,
    };
  }
  revalidatePath('/dashboard/invoices');  // clear this route's cache
  return { message: 'Deleted Invoice.' };
}

 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}