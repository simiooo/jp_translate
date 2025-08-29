import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./layout/rootLayout.tsx", [
    index("./pages/Home.tsx"),
    route("login", "./pages/LoginPage.tsx"),
    route("register", "./pages/RegisterPage.tsx"),
    route("profile", "./pages/ProfilePage.tsx"),
    route("recognize", "./pages/Recognize.tsx"),
    layout("./layout/vocabularyLayout.tsx", [
      route("vocabulary", "./pages/vocabulary/HomePage.tsx", { index: true }),
      route("vocabulary/my-vocabulary", "./pages/vocabulary/MyVocabularyPage.tsx"),
      route("vocabulary/recommended", "./pages/vocabulary/RecommendedPage.tsx"),
      route("vocabulary/notifications", "./pages/vocabulary/NotificationsPage.tsx"),
      route("vocabulary/following", "./pages/vocabulary/FollowingPage.tsx"),
      route("vocabulary/followers", "./pages/vocabulary/FollowersPage.tsx"),
      route("vocabulary/trends", "./pages/vocabulary/TrendsPage.tsx")
    ])
  ]),
];