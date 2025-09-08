-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.scrapyard_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrapyard_invoice_items ENABLE ROW LEVEL SECURITY;