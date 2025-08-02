import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import {
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const features = [
  {
    name: 'Verified Professionals',
    description: 'All cleaners are background checked, insured, and verified for your peace of mind.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Instant Booking',
    description: 'Book your cleaning service in under 3 minutes with our simple booking flow.',
    icon: ClockIcon,
  },
  {
    name: 'Quality Guarantee',
    description: '24-hour satisfaction guarantee or we\'ll send someone back to re-clean for free.',
    icon: CheckCircleIcon,
  },
  {
    name: 'Transparent Pricing',
    description: 'No hidden fees. See exactly what you\'ll pay upfront with our pricing calculator.',
    icon: CreditCardIcon,
  },
  {
    name: 'Local Service',
    description: 'Supporting local cleaning professionals in your community.',
    icon: MapPinIcon,
  },
  {
    name: 'Top Rated',
    description: 'Our cleaners maintain a 4.8+ star rating from thousands of satisfied customers.',
    icon: StarIcon,
  },
];

const services = [
  {
    name: 'Standard Cleaning',
    description: 'Regular house cleaning including all rooms, perfect for weekly or bi-weekly maintenance.',
    price: 'Starting at $80',
    features: ['Vacuum all floors', 'Dust surfaces', 'Clean bathrooms', 'Kitchen cleaning', 'Trash removal'],
  },
  {
    name: 'Deep Cleaning',
    description: 'Thorough cleaning including baseboards, inside appliances, and detailed work.',
    price: 'Starting at $150',
    features: ['Everything in standard', 'Baseboards', 'Inside oven', 'Inside refrigerator', 'Light fixtures'],
  },
  {
    name: 'Move-in/Move-out',
    description: 'Complete cleaning for moving situations, ensuring your space is spotless.',
    price: 'Starting at $200',
    features: ['Deep clean all areas', 'Cabinet interiors', 'Appliance deep clean', 'Window sills', 'Detailed work'],
  },
];

const testimonials = [
  {
    content: "CleanConnect made finding a reliable cleaner so easy. Maria has been cleaning our home for 6 months now and she's absolutely fantastic!",
    author: {
      name: 'Sarah Johnson',
      role: 'Homeowner',
      imageUrl: '/testimonials/sarah.jpg',
    },
  },
  {
    content: "As a busy professional, CleanConnect saves me so much time. The booking process is seamless and the cleaners are always professional.",
    author: {
      name: 'Michael Chen',
      role: 'Software Engineer',
      imageUrl: '/testimonials/michael.jpg',
    },
  },
  {
    content: "I love that all cleaners are background checked and insured. It gives me peace of mind when letting someone into my home.",
    author: {
      name: 'Emily Rodriguez',
      role: 'Teacher',
      imageUrl: '/testimonials/emily.jpg',
    },
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center mb-8">
              <SparklesIcon className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Professional Cleaning Services{' '}
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Connect with verified, professional cleaners in your area. Book instantly, pay securely, 
              and enjoy quality guaranteed cleaning services.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg">
                <Link href="/book">Book Now</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-x-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span>Background Checked</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span>Insured & Bonded</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success" />
                <span>Satisfaction Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Choose CleanConnect?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We make it easy to find and book trusted cleaning professionals in your area.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="relative">
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="ml-4 text-lg font-medium text-foreground">{feature.name}</h3>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-secondary/20 py-24 sm:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Our Cleaning Services
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose from our range of professional cleaning services tailored to your needs.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.name} className="card">
                <div className="card-header">
                  <h3 className="card-title">{service.name}</h3>
                  <p className="card-description">{service.description}</p>
                  <p className="text-2xl font-bold text-primary">{service.price}</p>
                </div>
                <div className="card-content">
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckCircleIcon className="h-4 w-4 text-success mr-2" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-footer">
                  <Button asChild className="w-full">
                    <Link href="/book">Book This Service</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 sm:py-32">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of satisfied customers who trust CleanConnect for their cleaning needs.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="card-content">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="h-5 w-5 text-warning fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-muted-foreground">
                    "{testimonial.content}"
                  </blockquote>
                </div>
                <div className="card-footer">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {testimonial.author.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-foreground">{testimonial.author.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.author.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="container px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Book your first cleaning service today and experience the CleanConnect difference.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button variant="secondary" size="lg" asChild>
                <Link href="/book">Book Your Cleaning</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/become-cleaner">Become a Cleaner</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
