'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search, MapPin, ShoppingCart, User, ChevronDown, Sparkles, Gift, Radio,
  Menu as MenuIcon, LogOut, Package, LayoutDashboard, Settings as SettingsIcon,
  ShoppingBag, Star, Truck, ClipboardList, Store,
} from 'lucide-react';
import { logout } from '@/lib/store/auth.slice';
import { useLogoutServerMutation } from '@/lib/store/api/auth.api';
import { useGetCartQuery } from '@/lib/store/api/orders.api';
import { useGetSellerProfileQuery } from '@/lib/store/api/seller.api';
import { useGetRiderProfileQuery } from '@/lib/store/api/rider.api';
import type { RootState } from '@/lib/store';
import { CategoriesMegaMenu } from './categories-mega-menu';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useOrdersSocket } from '@/lib/hooks/useOrdersSocket';

const TOP_CATEGORIES: Array<{ label: string }> = [
  { label: 'Electronics' }, { label: 'Fashion' }, { label: "Women's" }, { label: "Kids' Fashion" },
  { label: 'Healthy & Beauty' }, { label: 'Pharmacy' }, { label: 'Groceries' }, { label: 'Luxury Item' },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-1 shrink-0 select-none" aria-label="GoSellr home">
      <span className="text-2xl md:text-[26px] font-extrabold tracking-tight text-primary leading-none lowercase">gosellr</span>
      <span className="flex flex-col gap-0.5 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-pill bg-accent" />
        <span className="w-1.5 h-1.5 rounded-pill bg-accent" />
      </span>
    </Link>
  );
}

export function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [logoutServer] = useLogoutServerMutation();
  // Subscribe the buyer to live notification + order pushes.
  useOrdersSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: cart } = useGetCartQuery(undefined, { skip: !isAuthenticated || user?.role !== 'buyer' });
  const cartCount = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;

  // Detect cross-role access: a buyer who also created a seller/rider profile
  const { data: sellerProfile } = useGetSellerProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: riderProfile  } = useGetRiderProfileQuery(undefined,  { skip: !isAuthenticated });

  const hasSeller = !!sellerProfile;
  const hasRider  = !!riderProfile;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logoutServer().unwrap(); } catch { /* best effort */ }
    dispatch(logout());
    setIsLoggingOut(false);
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) { router.push('/browse'); return; }
    router.push(`/browse?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      {/* Primary row */}
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-16 flex items-center gap-3 md:gap-6">
        <Wordmark />

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-3xl hidden md:flex items-center bg-surface-alt border border-border rounded-pill h-11 pl-4 pr-1 gap-2 focus-within:border-accent transition-colors">
          <Sparkles className="w-4 h-4 text-accent shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search for any product or brand"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <button type="submit" aria-label="Search" className="w-9 h-9 rounded-pill bg-accent hover:bg-accent-600 text-accent-foreground flex items-center justify-center transition-colors shrink-0">
            <Search className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-2 md:gap-4 shrink-0 ml-auto">
          <button type="button" className="hidden lg:flex items-center gap-2 text-left hover:bg-surface-alt rounded-md px-2 py-1 transition-colors" aria-label="Update delivery location">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="leading-tight">
              <span className="block text-[10px] text-muted-foreground">Delivering to</span>
              <span className="block text-xs font-semibold text-foreground">Update Location</span>
            </span>
          </button>

          {isAuthenticated && <NotificationBell size="sm" />}

          <Link href="/cart" className="relative flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors" aria-label="Cart">
            <span className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-pill bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{cartCount}</span>
              )}
            </span>
            <span className="hidden md:inline">Cart</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors" aria-label="Account menu">
                <User className="w-5 h-5" />
                <span className="hidden md:inline max-w-[6rem] truncate">{user.full_name?.split(' ')[0] ?? 'Account'}</span>
                <ChevronDown className="w-3.5 h-3.5 hidden md:inline" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border">
                      <div className="text-sm font-semibold text-foreground truncate">{user.full_name ?? user.email}</div>
                      <div className="text-xs text-muted-foreground capitalize mt-0.5">
                        {user.role} account
                        {(hasSeller || hasRider) && (
                          <span className="text-foreground"> · multi-role</span>
                        )}
                      </div>
                    </div>

                    {/* Switch role section — visible whenever any cross-role profile exists */}
                    {(hasSeller || hasRider) && (
                      <div className="border-b border-border">
                        <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                          Switch role
                        </div>
                        {hasSeller && user.role !== 'seller' && (
                          <MenuLink href="/dashboard" icon={Store} onClick={() => setMenuOpen(false)}>
                            <span className="flex items-center justify-between w-full">
                              <span>My Store</span>
                              {sellerProfile?.business_name && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[7rem]">
                                  {sellerProfile.business_name}
                                </span>
                              )}
                            </span>
                          </MenuLink>
                        )}
                        {hasRider && user.role !== 'rider' && (
                          <MenuLink href="/dashboard/rider" icon={Truck} onClick={() => setMenuOpen(false)}>
                            Rider Hub
                          </MenuLink>
                        )}
                        {/* Always show "Browse as Buyer" if not currently a buyer view */}
                        {user.role !== 'buyer' && (
                          <MenuLink href="/browse" icon={ShoppingBag} onClick={() => setMenuOpen(false)}>
                            Shop as Buyer
                          </MenuLink>
                        )}
                      </div>
                    )}

                    {user.role === 'buyer' && (
                      <>
                        <MenuLink href="/browse" icon={Search} onClick={() => setMenuOpen(false)}>Browse Products</MenuLink>
                        <MenuLink href="/orders" icon={Package} onClick={() => setMenuOpen(false)}>My Orders</MenuLink>
                        <MenuLink href="/cart" icon={ShoppingCart} onClick={() => setMenuOpen(false)}>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</MenuLink>
                        <MenuLink href="/settings" icon={SettingsIcon} onClick={() => setMenuOpen(false)}>Settings</MenuLink>
                        {/* If they don't yet have a seller profile, invite them */}
                        {!hasSeller && (
                          <MenuLink href="/seller/register" icon={Store} onClick={() => setMenuOpen(false)}>
                            Become a Seller
                          </MenuLink>
                        )}
                      </>
                    )}
                    {user.role === 'seller' && (
                      <>
                        <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>Dashboard</MenuLink>
                        <MenuLink href="/dashboard/products" icon={Package} onClick={() => setMenuOpen(false)}>My Products</MenuLink>
                        <MenuLink href="/dashboard/orders" icon={ShoppingBag} onClick={() => setMenuOpen(false)}>Orders</MenuLink>
                        <MenuLink href="/dashboard/sq-status" icon={Star} onClick={() => setMenuOpen(false)}>SQ Status</MenuLink>
                        <MenuLink href="/dashboard/settings" icon={SettingsIcon} onClick={() => setMenuOpen(false)}>Settings</MenuLink>
                      </>
                    )}
                    {user.role === 'rider' && (
                      <>
                        <MenuLink href="/dashboard/rider" icon={LayoutDashboard} onClick={() => setMenuOpen(false)}>Dashboard</MenuLink>
                        <MenuLink href="/dashboard/rider/available" icon={ClipboardList} onClick={() => setMenuOpen(false)}>Available Orders</MenuLink>
                        <MenuLink href="/dashboard/rider/active" icon={Truck} onClick={() => setMenuOpen(false)}>Active Delivery</MenuLink>
                      </>
                    )}

                    <div className="border-t border-border mt-1">
                      <button onClick={() => { setMenuOpen(false); handleLogout(); }} disabled={isLoggingOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 disabled:opacity-50">
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? 'Logging out…' : 'Logout'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent transition-colors">
                <User className="w-5 h-5" />
                Sign In
              </Link>
            </div>
          )}

          <button onClick={() => setMenuOpen((v) => !v)} className="md:hidden p-2 -mr-2 text-foreground hover:text-accent" aria-label="Open menu">
            <MenuIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile search row */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-surface-alt border border-border rounded-pill h-10 pl-3.5 pr-1 gap-2">
          <Sparkles className="w-4 h-4 text-accent shrink-0" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <button type="submit" aria-label="Search" className="w-8 h-8 rounded-pill bg-accent text-accent-foreground flex items-center justify-center">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Secondary row: Mega-menu + scrollable links + My Store pill + Best Deals + Live */}
      <div className="border-t border-border bg-background">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-12 flex items-center gap-4 md:gap-6">
          <CategoriesMegaMenu />

          <nav className="flex-1 min-w-0 flex items-center gap-5 lg:gap-6 overflow-x-auto no-scrollbar">
            {TOP_CATEGORIES.map((c) => (
              <Link key={c.label} href={`/browse?category=${encodeURIComponent(c.label)}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                {c.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* My Store / Rider Hub quick-access pill — only shown when the user
                has the corresponding profile but isn't currently in that role view. */}
            {hasSeller && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-50 hover:bg-primary-100 px-3 h-7 rounded-pill transition-colors"
                title={sellerProfile?.business_name ?? 'My Store'}
              >
                <Store className="w-3.5 h-3.5" />
                My Store
              </Link>
            )}
            {hasRider && (
              <Link
                href="/dashboard/rider"
                className="flex items-center gap-1.5 text-xs font-semibold text-warning-500 bg-warning-50 hover:bg-warning-100 px-3 h-7 rounded-pill transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                Rider Hub
              </Link>
            )}

            <Link href="/browse?deals=1" className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-700">
              <Gift className="w-4 h-4" />
              Best Deals
            </Link>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
              <span className="lowercase tracking-tight">gosellr</span>
              <Radio className="w-3.5 h-3.5" />
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-only role bottom nav (preserves existing logic, plus role shortcuts) */}
      {isAuthenticated && user && (
        <div className="md:hidden border-t border-border flex bg-background">
          {user.role === 'buyer' && (
            <>
              <Link href="/browse" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Browse</Link>
              <Link href="/cart" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent relative">
                Cart{cartCount > 0 && <span className="ml-0.5 text-accent font-bold">({cartCount})</span>}
              </Link>
              <Link href="/orders" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Orders</Link>
              {hasSeller && (
                <Link href="/dashboard" className="flex-1 py-2 text-xs text-center text-primary font-semibold flex items-center justify-center gap-1">
                  <Store className="w-3 h-3" />
                  Store
                </Link>
              )}
              {hasRider && !hasSeller && (
                <Link href="/dashboard/rider" className="flex-1 py-2 text-xs text-center text-warning-500 font-semibold flex items-center justify-center gap-1">
                  <Truck className="w-3 h-3" />
                  Rider
                </Link>
              )}
            </>
          )}
          {user.role === 'seller' && (
            <>
              <Link href="/dashboard" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Dashboard</Link>
              <Link href="/dashboard/products" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Products</Link>
              <Link href="/dashboard/orders" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Orders</Link>
              <Link href="/browse" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Shop</Link>
            </>
          )}
          {user.role === 'rider' && (
            <>
              <Link href="/dashboard/rider" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Dashboard</Link>
              <Link href="/dashboard/rider/available" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Available</Link>
              <Link href="/dashboard/rider/active" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Active</Link>
              <Link href="/browse" className="flex-1 py-2 text-xs text-center text-muted-foreground hover:text-accent">Shop</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon: Icon, children, onClick }: {
  href: string; icon: React.ElementType; children: React.ReactNode; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-surface-alt">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
      {children}
    </Link>
  );
}
