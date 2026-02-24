import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/home/:path*",
    "/feed/:path*",
    "/campaigns/:path*",
    "/social-hub/:path*",
    "/tasks/:path*",
    "/friends/:path*",
    "/referrals/:path*",
    "/rankings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/attendance/:path*",
    "/admin/:path*",
  ],
};
