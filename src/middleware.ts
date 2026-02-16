import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/home/:path*",
    "/referrals/:path*",
    "/rankings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
