import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./layout/rootLayout.tsx", [
    index("./pages/Home.tsx"),
    route("login", "./pages/LoginPage.tsx"),
    route("register", "./pages/RegisterPage.tsx"),
    route("profile", "./pages/ProfilePage.tsx"),
    route("sessions", "./pages/SessionsPage.tsx"),
    route("devices", "./pages/DevicesPage.tsx"),
    route("password-reset", "./pages/PasswordResetPage.tsx"),
    route("recognize", "./pages/Recognize.tsx"),
    layout("./layout/socialLayout.tsx", [
      route("social", "./pages/social/HomePage.tsx", { index: true }),
      route("social/my-posts", "./pages/social/MyPostsPage.tsx"),
      route("social/recommended", "./pages/social/RecommendedPage.tsx"),
      route("social/notifications", "./pages/social/NotificationsPage.tsx"),
      route("social/following", "./pages/social/FollowingPage.tsx"),
      route("social/followers", "./pages/social/FollowersPage.tsx"),
      route("social/trends", "./pages/social/TrendsPage.tsx")
    ])
  ]),
];