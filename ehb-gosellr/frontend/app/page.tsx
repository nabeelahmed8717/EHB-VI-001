'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { ShoppingBag, Shield, Store } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center space-y-6 p-8 max-w-2xl">
          <div className="flex justify-center">
            <ShoppingBag className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">GoSellr</h1>
          <p className="text-lg text-muted-foreground">
            A trusted marketplace powered by the EHB Seller Qualification (SQ) system.
            Every product is verified before it goes live.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><Shield className="h-4 w-4 text-green-600" /> SQ Verified Products</div>
            <div className="flex items-center gap-1"><Store className="h-4 w-4 text-blue-600" /> Trusted Sellers</div>
          </div>
          <div className="flex gap-4 justify-center">
            {isAuthenticated && user ? (
              <>
                {user.role === 'seller' && (
                  <Link href="/dashboard"><Button size="lg">Seller Dashboard</Button></Link>
                )}
                {user.role === 'buyer' && (
                  <Link href="/browse"><Button size="lg">Browse Products</Button></Link>
                )}
              </>
            ) : (
              <>
                <Link href="/register"><Button size="lg">Get Started</Button></Link>
                <Link href="/login"><Button variant="outline" size="lg">Sign In</Button></Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
