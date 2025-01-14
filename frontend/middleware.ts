import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define route matchers based on your application's routing structure
const isPublicRoute = createRouteMatcher([
  "/", // Home page
  // "/sign-in(.*)", // Matches any sub-route under /sign-in
  // "/sign-up(.*)", // Matches any sub-route under /sign-up
]);

// Configuration for Clerk middleware
const clerkOptions = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
  domain: process.env.CLERK_API_URL,
  // signInUrl: "/sign-in",
  // signUpUrl: "/sign-up",
  afterSignInUrl: "/dashboard",
  afterSignUpUrl: "/dashboard",
  isSatellite: false,
};

// Clerk middleware function
export default clerkMiddleware((auth, request, event) => {
  if (!isPublicRoute(request)) {
    auth().protect(); // Protect all routes that are not explicitly public
  }
}, clerkOptions);

// Configuration for Next.js middleware behavior
export const config = {
  matcher: [
    "/((?!.+.[w]+$|_next).)*", // Matches all routes except for files and _next specific routes
    "/", // Home page
    "/(api|trpc)(.*)", // API routes and potentially tRPC routes
  ],
};