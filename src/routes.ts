import { index, route, layout } from "@react-router/dev/routes";

export default [
  layout("./layout/rootLayout.tsx", [
    index("./pages/Home.tsx"),
    route("login", "./pages/LoginPage.tsx"),
    route("register", "./pages/RegisterPage.tsx"),
    route("vocabulary", "./pages/Vocabulary.tsx"),
    route("recognize", "./pages/Recognize.tsx")
  ]),
];