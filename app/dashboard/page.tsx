'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDaysIcon, 
  MapPinIcon, 
  ClockIcon,
  PlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';
import { BookingWithDetails } from '@/types';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load recent bookings
      const response = await fetch('/api/bookings?limit=5');
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data);
        
        // Calculate stats
        const total = data.data.length;
        const upcoming = data.data.filter((b: any) => 
          ['pending', 'confirmed'].includes(b.status)
        ).length;
        const completed = data.data.filter((b: any) => 
          b.status === 'completed'
        ).length;
        const spent = data.data
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + b.total_amount, 0);
        
        setStats({
          totalBookings: total,
          upcomingBookings: upcoming,
          completedBookings: completed,
          totalSpent: spent,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning-700 border-warning/20';
      case 'confirmed':
        return 'bg-primary/10 text-primary-700 border-primary/20';
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-success/10 text-success-700 border-success/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive-700 border-destructive/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your cleanings.
              </p>
            </div>
            <Button asChild>
              <Link href="/book">
                <PlusIcon className="h-4 w-4 mr-2" />
                Book Cleaning
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-warning" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                    <p className="text-2xl font-bold">{stats.upcomingBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <SparklesIcon className="h-8 w-8 text-success" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Bookings */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Bookings</CardTitle>
                      <CardDescription>
                        Your latest cleaning appointments
                      </CardDescription>
                    </div>
                    <Button variant="outline" asChild>
                      <Link href="/bookings">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-8">
                      <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No bookings yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Book your first cleaning service to get started.
                      </p>
                      <Button asChild>
                        <Link href="/book">Book Now</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <CalendarDaysIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">
                                  {formatDate(booking.service_date, 'long')}
                                </p>
                                <Badge className={getStatusColor(booking.status)}>
                                  {booking.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {booking.address?.street_address}, {booking.address?.city}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(booking.total_amount)}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full justify-start">
                    <Link href="/book">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Book New Cleaning
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/bookings">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      View All Bookings
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/settings">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      Manage Addresses
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                  <CardDescription>
                    Get support when you need it
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/help">
                      Help Center
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full justify-start">
                    <Link href="/contact">
                      Contact Support
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
