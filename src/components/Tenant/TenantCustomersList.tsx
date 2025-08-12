
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Users } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useTenantCustomers } from '@/hooks/useTenantCustomers';

interface TenantCustomersListProps {
  title?: string;
}

const PAGE_SIZE = 10;

const TenantCustomersList: React.FC<TenantCustomersListProps> = ({ title = 'Customers' }) => {
  const { isAuth } = useSupabaseSession();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useTenantCustomers({
    search: q,
    page,
    pageSize: PAGE_SIZE,
  });

  const total = data?.count ?? 0;
  const rows = data?.rows ?? [];
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>View and search tenant customers. PNR is masked for privacy.</CardDescription>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search name, email, plate, brand, model"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isAuth && (
          <Alert className="mb-4">
            <AlertTitle>Not authenticated with Supabase</AlertTitle>
            <AlertDescription>
              To view customers, sign in with a tenant account (e.g., admin@scrapyard.se). The super_admin demo bypass does not create a Supabase session, so data will appear empty by design.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading customers...
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Failed to load</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || 'Unknown error. Please try again.'}
            </AlertDescription>
          </Alert>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No customers found.</div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>PNR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.customer_id}>
                      <TableCell className="font-medium">{r.name || '-'}</TableCell>
                      <TableCell>{r.email || '-'}</TableCell>
                      <TableCell>{r.phone || '-'}</TableCell>
                      <TableCell>{r.license_plate || '-'}</TableCell>
                      <TableCell>{r.brand || '-'}</TableCell>
                      <TableCell>{r.model || '-'}</TableCell>
                      <TableCell>{r.masked_pnr || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => (canNext ? p + 1 : p))} disabled={!canNext}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantCustomersList;
