import { index, route, layout } from "@react-router/dev/routes";

export default [
  // 认证相关页面（不需要认证）
  layout("./layout/authLayout.tsx", [
    route("login", "./pages/LoginPage.tsx"),
    route("register", "./pages/RegisterPage.tsx"),
    route("password-reset", "./pages/PasswordResetPage.tsx"),
    route("email-verification", "./pages/EmailVerificationPage.tsx"),
    route("email-verification-success", "./pages/EmailVerificationSuccessPage.tsx"),
  ]),
  
  // 需要认证的页面
  layout("./layout/rootLayout.tsx", [
    index("./pages/Home.tsx"),
    route("teach", "./pages/teach/HomePage.tsx"),
    route("profile", "./pages/ProfilePage.tsx"),
    route("sessions", "./pages/SessionsPage.tsx"),
    route("devices", "./pages/DevicesPage.tsx"),
    route("vocabulary", "./pages/vocabulary/HomePage.tsx"),
    layout("./layout/socialLayout.tsx", [
      route("social", "./pages/social/HomePage.tsx", { index: true }),
      route("social/my-posts", "./pages/social/MyPostsPage.tsx"),
      route("social/recommended", "./pages/social/RecommendedPage.tsx"),
      route("social/notifications", "./pages/social/NotificationsPage.tsx"),
      route("social/following", "./pages/social/FollowingPage.tsx"),
      route("social/followers", "./pages/social/FollowersPage.tsx"),
      route("social/trends", "./pages/social/TrendsPage.tsx"),
      route("social/post/$postId", "./pages/social/PostDetailPage.tsx")
    ])
  ]),
];