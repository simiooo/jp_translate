import { index, route } from "@react-router/dev/routes";

export default [
  index("./pages/Home.tsx"),
  route("login", "./pages/LoginPage.tsx"),
  route("register", "./pages/RegisterPage.tsx"),
];